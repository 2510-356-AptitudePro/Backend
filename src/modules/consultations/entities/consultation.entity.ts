import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ConsultationStatus } from '../../../common/enums/consultation-status.enum';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  studentId: string;

  @Column('uuid')
  psychologistId: string;

  @Column({
    type: 'enum',
    enum: ConsultationStatus,
    default: ConsultationStatus.PENDING,
  })
  status: ConsultationStatus;

  @Column()
  scheduledDate: Date;

  @Column({ type: 'text', nullable: true })
  studentNotes: string;

  @Column({ type: 'text', nullable: true })
  psychologistNotes: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @Column({ nullable: true })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ default: 60 })
  duration: number; // en minutos

  @Column({ nullable: true })
  meetingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.studentConsultations)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @ManyToOne(() => User, (user) => user.psychologistConsultations)
  @JoinColumn({ name: 'psychologistId' })
  psychologist: User;
}