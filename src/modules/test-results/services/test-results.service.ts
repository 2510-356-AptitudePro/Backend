import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TestResult } from '../entities/test-result.entity';
import { Answer } from '../entities/answer.entity';
import { Test } from '../../tests/entities/test.entity';
import { Question } from '../../tests/entities/question.entity';
import { Option } from '../../tests/entities/option.entity';

import { SubmitTestDto } from '../dto/submit-test.dto';
import { PaginationOptions, PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { Career } from 'src/modules/careers/entities/career.entity';

@Injectable()
export class TestResultsService {
  constructor(
    @InjectRepository(TestResult)
    private readonly testResultRepository: Repository<TestResult>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
@InjectRepository(Test)
   private readonly testRepository: Repository<Test>,
   @InjectRepository(Question)
   private readonly questionRepository: Repository<Question>,
   @InjectRepository(Option)
   private readonly optionRepository: Repository<Option>,
   @InjectRepository(Career)
   private readonly careerRepository: Repository<Career>,
 ) {}

 async submitTest(userId: string, submitTestDto: SubmitTestDto): Promise<TestResult> {
   const { testId, answers: submittedAnswers, timeSpent } = submitTestDto;

   // Verify test exists and is active
   const test = await this.testRepository.findOne({
     where: { id: testId, isActive: true },
     relations: ['questions', 'questions.options'],
   });

   if (!test) {
     throw new NotFoundException('Test no encontrado o no disponible');
   }

   // Check if user already completed this test
   const existingResult = await this.testResultRepository.findOne({
     where: { userId, testId, isCompleted: true },
   });

   if (existingResult) {
     throw new ConflictException('Ya has completado este test');
   }

   // Validate all questions are answered
   const requiredQuestions = test.questions.map(q => q.id);
   const answeredQuestions = submittedAnswers.map(a => a.questionId);
   
   const missingQuestions = requiredQuestions.filter(qId => !answeredQuestions.includes(qId));
   if (missingQuestions.length > 0) {
     throw new BadRequestException('Faltan respuestas por completar');
   }

   // Create test result
   const testResult = this.testResultRepository.create({
     userId,
     testId,
     timeSpent: timeSpent || 0,
     isCompleted: true,
   });

   const savedResult = await this.testResultRepository.save(testResult);

   // Process answers and calculate scores
   let totalPoints = 0;
   let maxPossiblePoints = 0;
   const categoryScores: { [key: string]: { earned: number; max: number } } = {};

   for (const answerData of submittedAnswers) {
     const question = test.questions.find(q => q.id === answerData.questionId);
     if (!question) continue;

     const selectedOption = answerData.selectedOptionId
       ? question.options.find(o => o.id === answerData.selectedOptionId)
       : null;

     const pointsEarned = selectedOption?.points || 0;
     const isCorrect = selectedOption?.isCorrect || false;

     // Create answer
     const answer = this.answerRepository.create({
       testResultId: savedResult.id,
       questionId: question.id,
       selectedOptionId: answerData.selectedOptionId,
       textAnswer: answerData.textAnswer,
       pointsEarned,
       isCorrect,
     });

     await this.answerRepository.save(answer);

     // Update scores
     totalPoints += pointsEarned;
     maxPossiblePoints += question.points;

     // Category scoring
     const category = question.category || 'general';
     if (!categoryScores[category]) {
       categoryScores[category] = { earned: 0, max: 0 };
     }
     categoryScores[category].earned += pointsEarned;
     categoryScores[category].max += question.points;
   }

   // Calculate final scores and profile
   const scores = this.calculateScores(categoryScores, totalPoints, maxPossiblePoints);
   const aptitudeProfile = this.generateAptitudeProfile(scores, categoryScores);
   const careerRecommendations = await this.generateCareerRecommendations(aptitudeProfile);

   // Update test result with analysis
   savedResult.scores = scores;
   savedResult.aptitudeProfile = aptitudeProfile;
   savedResult.careerRecommendations = careerRecommendations;

   await this.testResultRepository.save(savedResult);

   return this.findOne(savedResult.id);
 }

 async findOne(id: string): Promise<TestResult> {
   const result = await this.testResultRepository.findOne({
     where: { id },
     relations: ['user', 'test', 'answers', 'answers.question', 'answers.selectedOption'],
   });

   if (!result) {
     throw new NotFoundException('Resultado no encontrado');
   }

   return result;
 }

 async findByUser(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<TestResult>> {
   const { page = 1, limit = 10 } = options;
   const skip = (page - 1) * limit;

   const [data, total] = await this.testResultRepository.findAndCount({
     where: { userId, isCompleted: true },
     skip,
     take: limit,
     order: { completedAt: 'DESC' },
     relations: ['test'],
     select: {
       id: true,
       scores: true,
       completedAt: true,
       timeSpent: true,
       test: {
         id: true,
         title: true,
         type: true,
       },
     },
   });

   return {
     data,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async findByTest(testId: string, options: PaginationOptions = {}): Promise<PaginatedResult<TestResult>> {
   const { page = 1, limit = 10 } = options;
   const skip = (page - 1) * limit;

   const [data, total] = await this.testResultRepository.findAndCount({
     where: { testId, isCompleted: true },
     skip,
     take: limit,
     order: { completedAt: 'DESC' },
     relations: ['user'],
     select: {
       id: true,
       scores: true,
       completedAt: true,
       timeSpent: true,
       user: {
         id: true,
         firstName: true,
         lastName: true,
         username: true,
       },
     },
   });

   return {
     data,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async getStatistics(testId?: string): Promise<any> {
   const query = this.testResultRepository.createQueryBuilder('result')
     .where('result.isCompleted = :completed', { completed: true });

   if (testId) {
     query.andWhere('result.testId = :testId', { testId });
   }

   const results = await query.getMany();

   if (results.length === 0) {
     return {
       totalResults: 0,
       averageScore: 0,
       averageTime: 0,
       completionRate: 0,
     };
   }

   const totalResults = results.length;
   const totalScore = results.reduce((sum, result) => sum + (result.scores?.total || 0), 0);
   const totalTime = results.reduce((sum, result) => sum + (result.timeSpent || 0), 0);

   return {
     totalResults,
     averageScore: totalScore / totalResults,
     averageTime: totalTime / totalResults,
     scoreDistribution: this.calculateScoreDistribution(results),
     categoryAverages: this.calculateCategoryAverages(results),
   };
 }

 private calculateScores(
   categoryScores: { [key: string]: { earned: number; max: number } },
   totalPoints: number,
   maxPossiblePoints: number,
 ): any {
   const scores: any = {
     total: maxPossiblePoints > 0 ? Math.round((totalPoints / maxPossiblePoints) * 100) : 0,
   };

   // Calculate category percentages
   Object.keys(categoryScores).forEach(category => {
     const { earned, max } = categoryScores[category];
     scores[category] = max > 0 ? Math.round((earned / max) * 100) : 0;
   });

   return scores;
 }

 private generateAptitudeProfile(scores: any, categoryScores: any): any {
   const categories = Object.keys(categoryScores);
   
   if (categories.length === 0) {
     return {
       strengths: [],
       weaknesses: [],
       primaryAptitude: 'general',
     };
   }

   // Find strengths (categories with scores > 70%)
   const strengths = categories.filter(cat => scores[cat] >= 70);
   
   // Find weaknesses (categories with scores < 50%)
   const weaknesses = categories.filter(cat => scores[cat] < 50);
   
   // Find primary aptitude (highest scoring category)
   const primaryAptitude = categories.reduce((best, current) => 
     scores[current] > scores[best] ? current : best
   );

   return {
     strengths,
     weaknesses,
     primaryAptitude,
   };
 }

 private async generateCareerRecommendations(aptitudeProfile: any): Promise<any[]> {
   // Get all careers from database
   const careers = await this.careerRepository.find({
     select: ['id', 'name', 'description', 'requiredSkills'],
   });

   // Simple matching algorithm based on aptitude profile
   const recommendations = careers.map(career => {
     let matchPercentage = 50; // Base score
     
     // Increase match if career requires primary aptitude
     if (career.requiredSkills?.includes(aptitudeProfile.primaryAptitude)) {
       matchPercentage += 30;
     }
     
     // Increase match for each strength
     aptitudeProfile.strengths?.forEach((strength: string) => {
       if (career.requiredSkills?.includes(strength)) {
         matchPercentage += 10;
       }
     });
     
     // Decrease match for each weakness
     aptitudeProfile.weaknesses?.forEach((weakness: string) => {
       if (career.requiredSkills?.includes(weakness)) {
         matchPercentage -= 15;
       }
     });

     return {
       careerId: career.id,
       careerName: career.name,
       matchPercentage: Math.min(100, Math.max(0, matchPercentage)),
       reasoning: this.generateRecommendationReasoning(career, aptitudeProfile, matchPercentage),
     };
   });

   // Sort by match percentage and return top 5
   return recommendations
     .sort((a, b) => b.matchPercentage - a.matchPercentage)
     .slice(0, 5);
 }

 private generateRecommendationReasoning(career: any, profile: any, match: number): string {
   if (match >= 80) {
     return `Excelente compatibilidad con tu perfil de aptitudes, especialmente en ${profile.primaryAptitude}.`;
   } else if (match >= 60) {
     return `Buena compatibilidad. Considera desarrollar más habilidades en ${profile.weaknesses?.[0] || 'áreas específicas'}.`;
   } else {
     return `Compatibilidad moderada. Requiere desarrollo en varias áreas clave.`;
   }
 }

 private calculateScoreDistribution(results: TestResult[]): any {
   const ranges = {
     '0-20': 0,
     '21-40': 0,
     '41-60': 0,
     '61-80': 0,
     '81-100': 0,
   };

   results.forEach(result => {
     const score = result.scores?.total || 0;
     if (score <= 20) ranges['0-20']++;
     else if (score <= 40) ranges['21-40']++;
     else if (score <= 60) ranges['41-60']++;
     else if (score <= 80) ranges['61-80']++;
     else ranges['81-100']++;
   });

   return ranges;
 }

 private calculateCategoryAverages(results: TestResult[]): any {
   const categories: { [key: string]: number[] } = {};

   results.forEach(result => {
     if (result.scores) {
       Object.keys(result.scores).forEach(category => {
         if (category !== 'total') {
           if (!categories[category]) categories[category] = [];
           categories[category].push(result.scores[category]);
         }
       });
     }
   });

   const averages: { [key: string]: number } = {};
   Object.keys(categories).forEach(category => {
     const scores = categories[category];
     averages[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
   });

   return averages;
 }

 async remove(id: string): Promise<void> {
   const result = await this.testResultRepository.findOne({
     where: { id },
     relations: ['answers'],
   });

   if (!result) {
     throw new NotFoundException('Resultado no encontrado');
   }

   await this.testResultRepository.remove(result);
 }
}
