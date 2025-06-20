import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Answer } from 'src/modules/test-results/entities/answer.entity';


@Entity('options')
export class Option {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isCorrect: boolean;

  @Column({ default: 0 })
  points: number;

  @Column({ default: 1 })
  orderIndex: number;

  @Column('uuid')
  questionId: string;

  // Relations
  @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @OneToMany(() => Answer, (answer) => answer.selectedOption)
  answers: Answer[];
}