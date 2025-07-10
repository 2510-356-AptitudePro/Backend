import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestResultsService } from './services/test-results.service';
import { TestResultsController } from './controllers/test-results.controller';
import { TestResult } from './entities/test-result.entity';
import { Answer } from './entities/answer.entity';
import { Test } from '../tests/entities/test.entity';
import { Question } from '../tests/entities/question.entity';
import { Option } from '../tests/entities/option.entity';
import { Career } from '../careers/entities/career.entity';


@Module({
  imports: [TypeOrmModule.forFeature([TestResult, Answer, Test, Question, Option, Career])],
  controllers: [TestResultsController],
  providers: [TestResultsService],
  exports: [TestResultsService],
})
export class TestResultsModule {}