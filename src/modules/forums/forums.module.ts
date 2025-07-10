import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsService } from './services/forums.service';
import { ForumsController } from './controllers/forums.controller';
import { Forum } from './entities/forum.entity';
import { ForumPost } from './entities/forum-post.entity';
import { ForumComment } from './entities/forum-comment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Forum, ForumPost, ForumComment])],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}