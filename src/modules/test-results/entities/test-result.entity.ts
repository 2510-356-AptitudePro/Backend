import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Test } from '../../tests/entities/test.entity';
import { Answer } from './answer.entity';


@Entity('test_results')
export class TestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  testId: string;

  @Column({ type: 'json', nullable: true })
  scores: {
    verbal?: number;
    numerical?: number;
    spatial?: number;
    logical?: number;
    total?: number;
  };

  @Column({ type: 'json', nullable: true })
  aptitudeProfile: {
    strengths: string[];
    weaknesses: string[];
    primaryAptitude: string;
  };

  @Column({ type: 'json', nullable: true })
  careerRecommendations: {
    careerId: string;
    careerName: string;
    matchPercentage: number;
    reasoning: string;
  }[];

  @Column({ default: 0 })
  timeSpent: number; // en segundos

  @Column({ default: false })
  isCompleted: boolean;

  @CreateDateColumn()
  completedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.testResults)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Test, (test) => test.testResults)
  @JoinColumn({ name: 'testId' })
  test: Test;

  @OneToMany(() => Answer, (answer) => answer.testResult, { cascade: true })
  answers: Answer[];

  get totalScore(): number {
    return this.scores?.total || 0;
  }

  get answersCount(): number {
    return this.answers?.length || 0;
  }
}