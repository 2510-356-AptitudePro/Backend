import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ForumPost } from './forum-post.entity';


@Entity('forums')
export class Forum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => ForumPost, (post) => post.forum)
  posts: ForumPost[];

  get postCount(): number {
    return this.posts?.length || 0;
  }
}