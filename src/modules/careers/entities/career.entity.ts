import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { University } from './university.entity';


@Entity('careers')
export class Career {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100 })
  fieldOfStudy: string;

  @Column({ type: 'json', nullable: true })
  requiredSkills: string[];

  @Column({ type: 'json', nullable: true })
  jobProspects: {
    averageSalary: number;
    employmentRate: number;
    growthProjection: string;
    commonJobs: string[];
  };

  @Column({ default: 4 })
  duration: number; // años de duración

  @Column({ length: 100, nullable: true })
  degreeType: string; // Licenciatura, Ingeniería, etc.

  @Column({ type: 'text', nullable: true })
  curriculum: string;

  @Column({ type: 'json', nullable: true })
  prerequisites: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToMany(() => University, (university) => university.careers)
  @JoinTable({
    name: 'career_universities',
    joinColumn: { name: 'careerId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'universityId', referencedColumnName: 'id' },
  })
  universities: University[];
}