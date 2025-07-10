import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Availability } from 'src/modules/consultations/entities/availability.entity';
import { Consultation } from 'src/modules/consultations/entities/consultation.entity';
import { ForumComment } from 'src/modules/forums/entities/forum-comment.entity';
import { ForumPost } from 'src/modules/forums/entities/forum-post.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';


@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

@Column({ select: false }) // Esto evita que se incluya por defecto en las consultas
password?: string; // Cambiar de 'password: string' a 'password?: string'

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ length: 100, nullable: true })
  firstName: string;

  @Column({ length: 100, nullable: true })
  lastName: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ length: 100, nullable: true })
  school: string;

  @Column({ nullable: true })
  grade: number;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => TestResult, (testResult) => testResult.user)
  testResults: TestResult[];

  @OneToMany(() => Consultation, (consultation) => consultation.student)
  studentConsultations: Consultation[];

  @OneToMany(() => Consultation, (consultation) => consultation.psychologist)
  psychologistConsultations: Consultation[];

  @OneToMany(() => Availability, (availability) => availability.psychologist)
  availabilities: Availability[];

  @OneToMany(() => ForumPost, (post) => post.author)
  forumPosts: ForumPost[];

  @OneToMany(() => ForumComment, (comment) => comment.author)
  forumComments: ForumComment[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }
}