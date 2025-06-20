import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TestResult } from './test-result.entity';
import { Question } from '../../tests/entities/question.entity';
import { Option } from '../../tests/entities/option.entity';

@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  testResultId: string;

  @Column('uuid')
  questionId: string;

  @Column('uuid', { nullable: true })
  selectedOptionId: string;

  @Column({ type: 'text', nullable: true })
  textAnswer: string; // Para preguntas abiertas

  @Column({ default: 0 })
  pointsEarned: number;

  @Column({ default: false })
  isCorrect: boolean;

  // Relations
  @ManyToOne(() => TestResult, (testResult) => testResult.answers)
  @JoinColumn({ name: 'testResultId' })
  testResult: TestResult;

  @ManyToOne(() => Question, (question) => question.answers)
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @ManyToOne(() => Option, (option) => option.answers, { nullable: true })
  @JoinColumn({ name: 'selectedOptionId' })
  selectedOption: Option;
}