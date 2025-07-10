import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConsultationsService } from '../services/consultations.service';
import { CreateConsultationDto } from '../dto/create-consultation.dto';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateConsultationDto } from '../dto/update-consultation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { PaginationOptions } from '../../../common/interfaces/pagination.interface';

@ApiTags('Consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  // Consultation endpoints
  @Post('request')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Solicitar consulta (Solo Estudiantes)' })
  @ApiResponse({ status: 201, description: 'Consulta solicitada exitosamente' })
  @ApiResponse({ status: 400, description: 'Horario no disponible' })
  requestConsultation(
    @Body() createConsultationDto: CreateConsultationDto,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.requestConsultation(user.id, createConsultationDto);
  }

  @Get('my-consultations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mis consultas (Solo Estudiantes)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyConsultations(
    @CurrentUser() user: User,
    @Query() options: PaginationOptions,
  ) {
    return this.consultationsService.findStudentConsultations(user.id, options);
  }

  @Get('my-appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mis citas (Solo Psicólogos)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyAppointments(
    @CurrentUser() user: User,
    @Query() options: PaginationOptions,
  ) {
    return this.consultationsService.findPsychologistConsultations(user.id, options);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener estadísticas de consultas' })
  @ApiQuery({ name: 'psychologistId', required: false, type: String })
  getStatistics(
    @Query('psychologistId') psychologistId?: string,
    @CurrentUser() user?: User,
  ) {
    // If psychologist is requesting their own stats
    const targetPsychologistId = user?.role === UserRole.PSYCHOLOGIST ? user.id : psychologistId;
    return this.consultationsService.getConsultationStatistics(targetPsychologistId);
  }

  @Get('available-slots/:psychologistId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener horarios disponibles de un psicólogo' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha en formato YYYY-MM-DD' })
  getAvailableSlots(
    @Param('psychologistId', ParseUUIDPipe) psychologistId: string,
    @Query('date') date: string,
  ) {
    return this.consultationsService.getAvailableSlots(psychologistId, date);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener consulta por ID' })
  @ApiResponse({ status: 404, description: 'Consulta no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.consultationsService.findConsultationById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar consulta' })
  updateConsultation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConsultationDto: UpdateConsultationDto,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.updateConsultation(id, updateConsultationDto, user.id, user.role);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Cancelar consulta' })
  cancelConsultation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.cancelConsultation(id, user.id, user.role);
  }

  // Availability endpoints
  @Post('availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear disponibilidad (Solo Psicólogos)' })
  @ApiResponse({ status: 201, description: 'Disponibilidad creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Conflicto de horarios' })
  createAvailability(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.createAvailability(user.id, createAvailabilityDto);
  }

  @Get('availability/my-schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mi horario de disponibilidad (Solo Psicólogos)' })
  getMyAvailability(@CurrentUser() user: User) {
    return this.consultationsService.findPsychologistAvailabilities(user.id);
  }

  @Get('availability/:psychologistId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener disponibilidad de un psicólogo' })
  getPsychologistAvailability(@Param('psychologistId', ParseUUIDPipe) psychologistId: string) {
    return this.consultationsService.findPsychologistAvailabilities(psychologistId);
  }

  @Patch('availability/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar disponibilidad (Solo Psicólogos)' })
  updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateAvailabilityDto>,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.updateAvailability(id, updateData, user.id);
  }

  @Delete('availability/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar disponibilidad (Solo Psicólogos)' })
  removeAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.consultationsService.removeAvailability(id, user.id);
  }
}