import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareersService } from './services/careers.service';
import { CareersController } from './controllers/careers.controller';
import { Career } from './entities/career.entity';
import { University } from './entities/university.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Career, University])],
  controllers: [CareersController],
  providers: [CareersService],
  exports: [CareersService],
})
export class CareersModule {}