import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Career } from 'src/modules/careers/entities/career.entity';
import { University } from 'src/modules/careers/entities/university.entity';
import { Availability } from 'src/modules/consultations/entities/availability.entity';
import { Consultation } from 'src/modules/consultations/entities/consultation.entity';
import { ForumComment } from 'src/modules/forums/entities/forum-comment.entity';
import { ForumPost } from 'src/modules/forums/entities/forum-post.entity';
import { Forum } from 'src/modules/forums/entities/forum.entity';
import { Answer } from 'src/modules/test-results/entities/answer.entity';
import { TestResult } from 'src/modules/test-results/entities/test-result.entity';
import { Question } from 'src/modules/tests/entities/question.entity';
import { Test } from 'src/modules/tests/entities/test.entity'; // ← AQUÍ ESTÁ LA CORRECCIÓN
import { User } from 'src/modules/users/entities/user.entity';
import { Option } from 'src/modules/tests/entities/option.entity';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get('DB_HOST'),
      port: this.configService.get('DB_PORT'),
      username: this.configService.get('DB_USERNAME'),
      password: this.configService.get('DB_PASSWORD'),
      database: this.configService.get('DB_NAME'),
      entities: [
        User,
        Test,
        Question,
        Option,
        TestResult,
        Answer,
        Career,
        University,
        Consultation,
        Availability,
        Forum,
        ForumPost,
        ForumComment,
      ],
      synchronize: this.configService.get('NODE_ENV') === 'development',
      logging: this.configService.get('NODE_ENV') === 'development',
    };
  }
}