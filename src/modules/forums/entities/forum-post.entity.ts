import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Forum } from './forum.entity';
import { User } from '../../users/entities/user.entity';
import { ForumComment } from './forum-comment.entity';


@Entity('forum_posts')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 300 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column('uuid')
  authorId: string;

  @Column('uuid')
  forumId: string;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.forumPosts)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => Forum, (forum) => forum.posts)
  @JoinColumn({ name: 'forumId' })
  forum: Forum;

  @OneToMany(() => ForumComment, (comment) => comment.post)
  comments: ForumComment[];

  get commentCount(): number {
    return this.comments?.length || 0;
  }
}