import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}