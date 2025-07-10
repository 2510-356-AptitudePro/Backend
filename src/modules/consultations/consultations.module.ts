import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsService } from './services/consultations.service';
import { ConsultationsController } from './controllers/consultations.controller';
import { Consultation } from './entities/consultation.entity';
import { Availability } from './entities/availability.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation, Availability, User])],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}