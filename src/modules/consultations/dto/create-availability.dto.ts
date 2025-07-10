import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty({ example: 1, description: 'Día de la semana (0=Domingo, 1=Lunes, etc.)' })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00', description: 'Hora de inicio (HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime debe tener formato HH:mm',
  })
  startTime: string;

  @ApiProperty({ example: '17:00', description: 'Hora de fin (HH:mm)' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime debe tener formato HH:mm',
  })
  endTime: string;

  @ApiPropertyOptional({ example: true, description: 'Si está activo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}