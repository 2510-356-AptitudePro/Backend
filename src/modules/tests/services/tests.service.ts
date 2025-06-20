import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from '../entities/test.entity';
import { Question } from '../entities/question.entity';
import { Option } from '../entities/option.entity';
import { CreateTestDto } from '../dto/create-test.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationOptions, PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { TestType } from 'src/common/enums/test-type.enum';

@Injectable()
export class TestsService {
  constructor(
    @InjectRepository(Test)
    private readonly testRepository: Repository<Test>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
  ) {}

  async create(createTestDto: CreateTestDto, createdBy: string): Promise<Test> {
    const { questions, ...testData } = createTestDto;

    // Validate test data
    if (questions.length === 0) {
      throw new BadRequestException('El test debe tener al menos una pregunta');
    }

    // Create test
    const test = this.testRepository.create({
      ...testData,
      createdBy,
    });

    const savedTest = await this.testRepository.save(test);

    // Create questions and options
    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];
      
      if (questionData.options.length < 2) {
        throw new BadRequestException(`La pregunta ${i + 1} debe tener al menos 2 opciones`);
      }

      const question = this.questionRepository.create({
        ...questionData,
        testId: savedTest.id,
        orderIndex: questionData.orderIndex || i + 1,
      });

      const savedQuestion = await this.questionRepository.save(question);

      // Create options
      for (let j = 0; j < questionData.options.length; j++) {
        const optionData = questionData.options[j];
        
        const option = this.optionRepository.create({
          ...optionData,
          questionId: savedQuestion.id,
          orderIndex: optionData.orderIndex || j + 1,
        });

        await this.optionRepository.save(option);
      }
    }

    return this.findOne(savedTest.id);
  }

  async findAll(options: PaginationOptions = {}): Promise<PaginatedResult<Test>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.testRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['creator'],
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        duration: true,
        createdAt: true,
        creator: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    // Add question count
    const testsWithCount = await Promise.all(
      data.map(async (test) => {
        const questionCount = await this.questionRepository.count({
          where: { testId: test.id },
        });
        return { ...test, questionCount };
      }),
    );

    return {
      data: testsWithCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByType(type: TestType, options: PaginationOptions = {}): Promise<PaginatedResult<Test>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.testRepository.findAndCount({
      where: { type, isActive: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['creator'],
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        duration: true,
        createdAt: true,
        creator: {
          id: true,
          firstName: true,
          lastName: true,
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

  async findOne(id: string): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'creator'],
      order: {
        questions: {
          orderIndex: 'ASC',
          options: {
            orderIndex: 'ASC',
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test no encontrado');
    }

    return test;
  }

  async findOneForTaking(id: string): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id, isActive: true },
      relations: ['questions', 'questions.options'],
      order: {
        questions: {
          orderIndex: 'ASC',
          options: {
            orderIndex: 'ASC',
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        duration: true,
        instructions: true,
        questions: {
          id: true,
          content: true,
          imageUrl: true,
          orderIndex: true,
          category: true,
          options: {
            id: true,
            content: true,
            orderIndex: true,
            // No incluir isCorrect ni points para que el estudiante no vea las respuestas
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test no encontrado o no disponible');
    }

    return test;
  }

  async update(id: string, updateTestDto: UpdateTestDto, userId: string, userRole: UserRole): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!test) {
      throw new NotFoundException('Test no encontrado');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && test.createdBy !== userId) {
      throw new ForbiddenException('No tienes permisos para editar este test');
    }

    Object.assign(test, updateTestDto);
    await this.testRepository.save(test);

    return this.findOne(id);
  }

  async remove(id: string, userId: string, userRole: UserRole): Promise<void> {
    const test = await this.testRepository.findOne({
      where: { id },
      relations: ['testResults'],
    });

    if (!test) {
      throw new NotFoundException('Test no encontrado');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && test.createdBy !== userId) {
      throw new ForbiddenException('No tienes permisos para eliminar este test');
    }

    // Check if test has results
    if (test.testResults && test.testResults.length > 0) {
      throw new BadRequestException('No se puede eliminar un test que tiene resultados asociados');
    }

    await this.testRepository.remove(test);
  }

  async toggleActive(id: string, userId: string, userRole: UserRole): Promise<Test> {
    const test = await this.testRepository.findOne({
      where: { id },
    });

    if (!test) {
      throw new NotFoundException('Test no encontrado');
    }

    // Check permissions
    if (userRole !== UserRole.ADMIN && test.createdBy !== userId) {
      throw new ForbiddenException('No tienes permisos para modificar este test');
    }

    test.isActive = !test.isActive;
    await this.testRepository.save(test);

    return this.findOne(id);
  }

  async getMyTests(userId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Test>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.testRepository.findAndCount({
      where: { createdBy: userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}