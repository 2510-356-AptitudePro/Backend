import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { TestType } from 'src/common/enums/test-type.enum';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { Question } from './question.entity';

@Entity('tests')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: TestType,
  })
  type: TestType;

  @Column({ default: 0 })
  duration: number; // en minutos

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  instructions: string;

  @Column('uuid', { nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Question, (question) => question.test, { cascade: true })
  questions: Question[];

  @OneToMany(() => TestResult, (testResult) => testResult.test)
  testResults: TestResult[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  get questionCount(): number {
    return this.questions?.length || 0;
  }
}