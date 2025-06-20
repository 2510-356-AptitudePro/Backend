import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Test } from './test.entity';
import { Answer } from 'src/modules/test-results/entities/answer.entity';
import { Option } from './option.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: 1 })
  orderIndex: number;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ default: 1 })
  points: number;

  @Column('uuid')
  testId: string;

  // Relations
  @ManyToOne(() => Test, (test) => test.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'testId' })
  test: Test;

  @OneToMany(() => Option, (option) => option.question, { cascade: true })
  options: Option[];

  @OneToMany(() => Answer, (answer) => answer.question)
  answers: Answer[];
}