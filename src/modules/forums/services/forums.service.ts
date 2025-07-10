import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Forum } from '../entities/forum.entity';
import { ForumPost } from '../entities/forum-post.entity';
import { ForumComment } from '../entities/forum-comment.entity';
import { CreateForumDto } from '../dto/create-forum.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationOptions, PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(Forum)
    private readonly forumRepository: Repository<Forum>,
    @InjectRepository(ForumPost)
    private readonly postRepository: Repository<ForumPost>,
    @InjectRepository(ForumComment)
    private readonly commentRepository: Repository<ForumComment>,
  ) {}

  // Forum methods
  async createForum(createForumDto: CreateForumDto): Promise<Forum> {
    // Check if forum already exists
    const existingForum = await this.forumRepository.findOne({
      where: { name: createForumDto.name },
    });

    if (existingForum) {
      throw new ConflictException('Ya existe un foro con este nombre');
    }

    const forum = this.forumRepository.create(createForumDto);
    return this.forumRepository.save(forum);
  }

  async findAllForums(options: PaginationOptions = {}): Promise<PaginatedResult<Forum>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.forumRepository.findAndCount({
      where: { isActive: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Add post count for each forum
    const forumsWithCounts = await Promise.all(
      data.map(async (forum) => {
        const postCount = await this.postRepository.count({
          where: { forumId: forum.id },
        });
        return { ...forum, postCount };
      }),
    );

    return {
      data: forumsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForumById(id: string): Promise<Forum> {
    const forum = await this.forumRepository.findOne({
      where: { id },
    });

    if (!forum) {
      throw new NotFoundException('Foro no encontrado');
    }

    return forum;
  }

  async updateForum(id: string, updateData: Partial<CreateForumDto>): Promise<Forum> {
    const forum = await this.findForumById(id);
    Object.assign(forum, updateData);
    return this.forumRepository.save(forum);
  }

  async removeForum(id: string): Promise<void> {
    const forum = await this.findForumById(id);
    
    // Check if forum has posts
    const postCount = await this.postRepository.count({
      where: { forumId: id },
    });

    if (postCount > 0) {
      throw new ConflictException('No se puede eliminar un foro que tiene posts');
    }

    await this.forumRepository.remove(forum);
  }

  // Post methods
  async createPost(createPostDto: CreatePostDto, authorId: string): Promise<ForumPost> {
    // Verify forum exists
    await this.findForumById(createPostDto.forumId);

    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
    });

    return this.postRepository.save(post);
  }

  async findForumPosts(forumId: string, options: PaginationOptions = {}): Promise<PaginatedResult<ForumPost>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // Verify forum exists
    await this.findForumById(forumId);

    const [data, total] = await this.postRepository.findAndCount({
      where: { forumId },
      skip,
      take: limit,
      order: { isPinned: 'DESC', createdAt: 'DESC' },
      relations: ['author'],
      select: {
        id: true,
        title: true,
        views: true,
        likes: true,
        isPinned: true,
        isLocked: true,
        createdAt: true,
        author: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    // Add comment count for each post
    const postsWithCounts = await Promise.all(
      data.map(async (post) => {
        const commentCount = await this.commentRepository.count({
          where: { postId: post.id },
        });
        return { ...post, commentCount };
      }),
    );

    return {
      data: postsWithCounts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPostById(id: string): Promise<ForumPost> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: ['author', 'forum'],
    });

    if (!post) {
      throw new NotFoundException('Post no encontrado');
    }

    // Increment view count
    post.views += 1;
    await this.postRepository.save(post);

    return post;
  }

  async searchPosts(query: string, options: PaginationOptions = {}): Promise<PaginatedResult<ForumPost>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepository.findAndCount({
     where: [
       { title: Like(`%${query}%`) },
       { content: Like(`%${query}%`) },
     ],
     skip,
     take: limit,
     order: { createdAt: 'DESC' },
     relations: ['author', 'forum'],
     select: {
       id: true,
       title: true,
       content: true,
       views: true,
       likes: true,
       createdAt: true,
       author: {
         id: true,
         username: true,
         firstName: true,
         lastName: true,
       },
       forum: {
         id: true,
         name: true,
       },
     },
   });

   return {
     data,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async updatePost(id: string, updateData: Partial<CreatePostDto>, userId: string, userRole: UserRole): Promise<ForumPost> {
   const post = await this.findPostById(id);

   // Check permissions
   if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
     throw new ForbiddenException('No tienes permisos para actualizar este post');
   }

   if (post.isLocked && userRole !== UserRole.ADMIN) {
     throw new ForbiddenException('Este post está bloqueado');
   }

   Object.assign(post, updateData);
   return this.postRepository.save(post);
 }

 async removePost(id: string, userId: string, userRole: UserRole): Promise<void> {
   const post = await this.findPostById(id);

   // Check permissions
   if (post.authorId !== userId && userRole !== UserRole.ADMIN) {
     throw new ForbiddenException('No tienes permisos para eliminar este post');
   }

   await this.postRepository.remove(post);
 }

 async togglePostPin(id: string): Promise<ForumPost> {
   const post = await this.findPostById(id);
   post.isPinned = !post.isPinned;
   return this.postRepository.save(post);
 }

 async togglePostLock(id: string): Promise<ForumPost> {
   const post = await this.findPostById(id);
   post.isLocked = !post.isLocked;
   return this.postRepository.save(post);
 }

 async likePost(id: string, userId: string): Promise<ForumPost> {
   const post = await this.findPostById(id);
   
   // In a real implementation, you'd want to track which users liked which posts
   // to prevent multiple likes from the same user
   post.likes += 1;
   return this.postRepository.save(post);
 }

 // Comment methods
 async createComment(createCommentDto: CreateCommentDto, authorId: string): Promise<ForumComment> {
   // Verify post exists and is not locked
   const post = await this.findPostById(createCommentDto.postId);
   
   if (post.isLocked) {
     throw new ForbiddenException('No se pueden agregar comentarios a un post bloqueado');
   }

   // If it's a reply, verify parent comment exists
   if (createCommentDto.parentCommentId) {
     const parentComment = await this.commentRepository.findOne({
       where: { id: createCommentDto.parentCommentId },
     });

     if (!parentComment) {
       throw new NotFoundException('Comentario padre no encontrado');
     }
   }

   const comment = this.commentRepository.create({
     ...createCommentDto,
     authorId,
   });

   return this.commentRepository.save(comment);
 }

 async findPostComments(postId: string, options: PaginationOptions = {}): Promise<PaginatedResult<ForumComment>> {
   const { page = 1, limit = 20 } = options;
   const skip = (page - 1) * limit;

   // Verify post exists
   await this.findPostById(postId);

   const [data, total] = await this.commentRepository.findAndCount({
     where: { postId, parentCommentId: IsNull() }, // Only top-level comments
     skip,
     take: limit,
     order: { createdAt: 'ASC' },
     relations: ['author'],
     select: {
       id: true,
       content: true,
       likes: true,
       createdAt: true,
       author: {
         id: true,
         username: true,
         firstName: true,
         lastName: true,
       },
     },
   });

   // Get replies for each comment
   const commentsWithReplies = await Promise.all(
     data.map(async (comment) => {
       const replies = await this.commentRepository.find({
         where: { parentCommentId: comment.id },
         order: { createdAt: 'ASC' },
         relations: ['author'],
         select: {
           id: true,
           content: true,
           likes: true,
           createdAt: true,
           author: {
             id: true,
             username: true,
             firstName: true,
             lastName: true,
           },
         },
       });
       return { ...comment, replies };
     }),
   );

   return {
     data: commentsWithReplies,
     total,
     page,
     limit,
     totalPages: Math.ceil(total / limit),
   };
 }

 async findCommentById(id: string): Promise<ForumComment> {
   const comment = await this.commentRepository.findOne({
     where: { id },
     relations: ['author', 'post'],
   });

   if (!comment) {
     throw new NotFoundException('Comentario no encontrado');
   }

   return comment;
 }

 async updateComment(id: string, content: string, userId: string, userRole: UserRole): Promise<ForumComment> {
   const comment = await this.findCommentById(id);

   // Check permissions
   if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
     throw new ForbiddenException('No tienes permisos para actualizar este comentario');
   }

   comment.content = content;
   return this.commentRepository.save(comment);
 }

 async removeComment(id: string, userId: string, userRole: UserRole): Promise<void> {
   const comment = await this.findCommentById(id);

   // Check permissions
   if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
     throw new ForbiddenException('No tienes permisos para eliminar este comentario');
   }

   await this.commentRepository.remove(comment);
 }

 async likeComment(id: string, userId: string): Promise<ForumComment> {
   const comment = await this.findCommentById(id);
   
   // In a real implementation, you'd want to track which users liked which comments
   comment.likes += 1;
   return this.commentRepository.save(comment);
 }

 async getForumStatistics(): Promise<any> {
   const totalForums = await this.forumRepository.count({ where: { isActive: true } });
   const totalPosts = await this.postRepository.count();
   const totalComments = await this.commentRepository.count();

   // Most active forums
   const activeForums = await this.forumRepository
     .createQueryBuilder('forum')
     .leftJoin('forum.posts', 'post')
     .select('forum.id', 'id')
     .addSelect('forum.name', 'name')
     .addSelect('COUNT(post.id)', 'postCount')
     .where('forum.isActive = :isActive', { isActive: true })
     .groupBy('forum.id')
     .orderBy('COUNT(post.id)', 'DESC')
     .limit(5)
     .getRawMany();

   // Recent activity
   const recentPosts = await this.postRepository.find({
     take: 5,
     order: { createdAt: 'DESC' },
     relations: ['author', 'forum'],
     select: {
       id: true,
       title: true,
       createdAt: true,
       author: {
         id: true,
         username: true,
         firstName: true,
         lastName: true,
       },
       forum: {
         id: true,
         name: true,
       },
     },
   });

   return {
     totals: {
       forums: totalForums,
       posts: totalPosts,
       comments: totalComments,
     },
     activeForums,
     recentPosts,
   };
 }

 async getUserForumActivity(userId: string): Promise<any> {
   const userPosts = await this.postRepository.count({ where: { authorId: userId } });
   const userComments = await this.commentRepository.count({ where: { authorId: userId } });

   const recentPosts = await this.postRepository.find({
     where: { authorId: userId },
     take: 5,
     order: { createdAt: 'DESC' },
     relations: ['forum'],
     select: {
       id: true,
       title: true,
       views: true,
       likes: true,
       createdAt: true,
       forum: {
         id: true,
         name: true,
       },
     },
   });

   const recentComments = await this.commentRepository.find({
     where: { authorId: userId },
     take: 5,
     order: { createdAt: 'DESC' },
     relations: ['post'],
     select: {
       id: true,
       content: true,
       likes: true,
       createdAt: true,
       post: {
         id: true,
         title: true,
       },
     },
   });

   return {
     totals: {
       posts: userPosts,
       comments: userComments,
     },
     recentPosts,
     recentComments,
   };
 }
}