import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsPhoneNumber,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'johndoe', description: 'Username único del usuario' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Correo electrónico' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.STUDENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.STUDENT;

  @ApiPropertyOptional({ example: 'John', description: 'Nombre del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Apellido del usuario' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: '2000-01-01', description: 'Fecha de nacimiento' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: '+51987654321', description: 'Número de teléfono' })
  @IsOptional()
  @IsPhoneNumber('PE')
  phone?: string;

  @ApiPropertyOptional({ example: 'Colegio San Juan', description: 'Nombre del colegio' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  school?: string;

  @ApiPropertyOptional({ example: 5, description: 'Grado escolar (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  grade?: number;

  @ApiPropertyOptional({ example: 'Estudiante de último año...', description: 'Biografía' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}