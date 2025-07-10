import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ForumPost } from './forum-post.entity';
import { User } from '../../users/entities/user.entity';

@Entity('forum_comments')
export class ForumComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column('uuid')
  authorId: string;

  @Column('uuid')
  postId: string;

  @Column('uuid', { nullable: true })
  parentCommentId: string;

  @Column({ default: 0 })
  likes: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.forumComments)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @ManyToOne(() => ForumPost, (post) => post.comments)
  @JoinColumn({ name: 'postId' })
  post: ForumPost;

  @ManyToOne(() => ForumComment, { nullable: true })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: ForumComment;
}