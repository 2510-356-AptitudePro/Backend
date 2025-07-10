import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { Career } from '../entities/career.entity';
import { University } from '../entities/university.entity';
import { CreateCareerDto } from '../dto/create-career.dto';
import { CreateUniversityDto } from '../dto/create-university.dto';
import { PaginationOptions, PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class CareersService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepository: Repository<Career>,
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
  ) {}

  // Career methods
  async createCareer(createCareerDto: CreateCareerDto): Promise<Career> {
    const { universityIds, ...careerData } = createCareerDto;

    // Check if career already exists
    const existingCareer = await this.careerRepository.findOne({
      where: { name: careerData.name },
    });

    if (existingCareer) {
      throw new ConflictException('Ya existe una carrera con este nombre');
    }

    // Get universities if provided
    let universities: University[] = [];
    if (universityIds && universityIds.length > 0) {
      universities = await this.universityRepository.find({
        where: { id: In(universityIds) },
      });
    }

    const career = this.careerRepository.create(careerData);
    career.universities = universities;

    return this.careerRepository.save(career);
  }

  async findAllCareers(options: PaginationOptions = {}): Promise<PaginatedResult<Career>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.careerRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { name: 'ASC' },
      relations: ['universities'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCareersByField(field: string, options: PaginationOptions = {}): Promise<PaginatedResult<Career>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.careerRepository.findAndCount({
      where: { 
        fieldOfStudy: Like(`%${field}%`),
        isActive: true 
      },
      skip,
      take: limit,
      order: { name: 'ASC' },
      relations: ['universities'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchCareers(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<Career>> {
    const { page = 1, limit = 10 } = options;
   const skip = (page - 1) * limit;

   const [data, total] = await this.careerRepository.findAndCount({
     where: [
       { name: Like(`%${query}%`), isActive: true },
       { description: Like(`%${query}%`), isActive: true },
       { fieldOfStudy: Like(`%${query}%`), isActive: true },
     ],
     skip,
     take: limit,
     order: { name: 'ASC' },
     relations: ['universities'],
   });

   return {
     data,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async findCareerById(id: string): Promise<Career> {
   const career = await this.careerRepository.findOne({
     where: { id },
     relations: ['universities'],
   });

   if (!career) {
     throw new NotFoundException('Carrera no encontrada');
   }

   return career;
 }

 async updateCareer(id: string, updateData: Partial<CreateCareerDto>): Promise<Career> {
   const { universityIds, ...careerData } = updateData;
   
   const career = await this.findCareerById(id);

   // Update universities if provided
   if (universityIds !== undefined) {
     if (universityIds.length > 0) {
       const universities = await this.universityRepository.find({
         where: { id: In(universityIds) },
       });
       career.universities = universities;
     } else {
       career.universities = [];
     }
   }

   Object.assign(career, careerData);
   return this.careerRepository.save(career);
 }

 async removeCareer(id: string): Promise<void> {
   const career = await this.findCareerById(id);
   await this.careerRepository.remove(career);
 }

 async toggleCareerStatus(id: string): Promise<Career> {
   const career = await this.findCareerById(id);
   career.isActive = !career.isActive;
   return this.careerRepository.save(career);
 }

 // University methods
 async createUniversity(createUniversityDto: CreateUniversityDto): Promise<University> {
   // Check if university already exists
   const existingUniversity = await this.universityRepository.findOne({
     where: { name: createUniversityDto.name },
   });

   if (existingUniversity) {
     throw new ConflictException('Ya existe una universidad con este nombre');
   }

   const university = this.universityRepository.create(createUniversityDto);
   return this.universityRepository.save(university);
 }

 async findAllUniversities(options: PaginationOptions = {}): Promise<PaginatedResult<University>> {
   const { page = 1, limit = 10 } = options;
   const skip = (page - 1) * limit;

   const [data, total] = await this.universityRepository.findAndCount({
     where: { isActive: true },
     skip,
     take: limit,
     order: { name: 'ASC' },
     relations: ['careers'],
   });

   return {
     data,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async findUniversityById(id: string): Promise<University> {
   const university = await this.universityRepository.findOne({
     where: { id },
     relations: ['careers'],
   });

   if (!university) {
     throw new NotFoundException('Universidad no encontrada');
   }

   return university;
 }

 async updateUniversity(id: string, updateData: Partial<CreateUniversityDto>): Promise<University> {
   const university = await this.findUniversityById(id);
   Object.assign(university, updateData);
   return this.universityRepository.save(university);
 }

 async removeUniversity(id: string): Promise<void> {
   const university = await this.findUniversityById(id);
   await this.universityRepository.remove(university);
 }

 async getCareerRecommendations(skills: string[]): Promise<Career[]> {
   if (!skills || skills.length === 0) {
     return [];
   }

   const careers = await this.careerRepository.find({
     where: { isActive: true },
     relations: ['universities'],
   });

   // Simple recommendation algorithm
   const scoredCareers = careers.map(career => {
     const careerSkills = career.requiredSkills || [];
     const matchingSkills = skills.filter(skill => 
       careerSkills.some(reqSkill => 
         reqSkill.toLowerCase().includes(skill.toLowerCase())
       )
     );
     
     const score = matchingSkills.length / Math.max(skills.length, careerSkills.length);
     
     return { career, score };
   });

   // Sort by score and return top recommendations
   return scoredCareers
     .filter(item => item.score > 0)
     .sort((a, b) => b.score - a.score)
     .slice(0, 10)
     .map(item => item.career);
 }

 async getCareersByUniversity(universityId: string): Promise<Career[]> {
   const university = await this.universityRepository.findOne({
     where: { id: universityId },
     relations: ['careers'],
   });

   if (!university) {
     throw new NotFoundException('Universidad no encontrada');
   }

   return university.careers.filter(career => career.isActive);
 }

 async getUniversitiesByCareer(careerId: string): Promise<University[]> {
   const career = await this.careerRepository.findOne({
     where: { id: careerId },
     relations: ['universities'],
   });

   if (!career) {
     throw new NotFoundException('Carrera no encontrada');
   }

   return career.universities.filter(university => university.isActive);
 }
}