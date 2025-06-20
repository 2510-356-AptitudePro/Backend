import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TestsModule } from './modules/tests/tests.module';
import { TestResultsModule } from './modules/test-results/test-results.module';
import { CareersModule } from './modules/careers/careers.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { ForumsModule } from './modules/forums/forums.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),
    AuthModule,
    UsersModule,
    TestsModule,
    TestResultsModule,
    CareersModule,
    ConsultationsModule,
    ForumsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}