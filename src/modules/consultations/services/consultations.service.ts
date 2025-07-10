import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Consultation } from '../entities/consultation.entity';
import { Availability } from '../entities/availability.entity';
import { User } from '../../users/entities/user.entity';
import { CreateConsultationDto } from '../dto/create-consultation.dto';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { UpdateConsultationDto } from '../dto/update-consultation.dto';
import { ConsultationStatus } from '../../../common/enums/consultation-status.enum';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationOptions, PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectRepository(Consultation)
    private readonly consultationRepository: Repository<Consultation>,
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Consultation methods
  async requestConsultation(studentId: string, createConsultationDto: CreateConsultationDto): Promise<Consultation> {
    const { psychologistId, scheduledDate, ...consultationData } = createConsultationDto;

    // Verify psychologist exists and has correct role
    const psychologist = await this.userRepository.findOne({
      where: { id: psychologistId, role: UserRole.PSYCHOLOGIST, isActive: true },
    });

    if (!psychologist) {
      throw new NotFoundException('Psicólogo no encontrado o no disponible');
    }

    // Parse the scheduled date
    const requestedDate = new Date(scheduledDate);
    
    // Validate that the date is in the future
    if (requestedDate <= new Date()) {
      throw new BadRequestException('La fecha debe ser en el futuro');
    }

    // Check if psychologist is available at the requested time
    const isAvailable = await this.checkPsychologistAvailability(psychologistId, requestedDate);

    if (!isAvailable) {
      throw new BadRequestException('El psicólogo no está disponible en el horario solicitado');
    }

    // Check for existing consultations at the same time (with overlap consideration)
    const consultationStart = new Date(requestedDate);
    const consultationEnd = new Date(requestedDate.getTime() + (consultationData.duration || 60) * 60 * 1000);

    const existingConsultations = await this.consultationRepository.find({
      where: {
        psychologistId,
        status: ConsultationStatus.ACCEPTED,
      },
    });

    // Check for time conflicts
    const hasConflict = existingConsultations.some(consultation => {
      const existingStart = new Date(consultation.scheduledDate);
      const existingEnd = new Date(existingStart.getTime() + consultation.duration * 60 * 1000);
      
      // Check if there's any overlap
      return (consultationStart < existingEnd && consultationEnd > existingStart);
    });

    if (hasConflict) {
      throw new BadRequestException('Ya existe una consulta programada en ese horario');
    }

    const consultation = this.consultationRepository.create({
      studentId,
      psychologistId,
      scheduledDate: requestedDate,
      ...consultationData,
    });

    return this.consultationRepository.save(consultation);
  }

  async findConsultationById(id: string): Promise<Consultation> {
    const consultation = await this.consultationRepository.findOne({
      where: { id },
      relations: ['student', 'psychologist'],
    });

    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }

    return consultation;
  }

  async findStudentConsultations(studentId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Consultation>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.consultationRepository.findAndCount({
      where: { studentId },
      skip,
      take: limit,
      order: { scheduledDate: 'DESC' },
      relations: ['psychologist'],
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        duration: true,
        rating: true,
        createdAt: true,
        psychologist: {
          id: true,
          firstName: true,
          lastName: true,
          bio: true,
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

  async findPsychologistConsultations(psychologistId: string, options: PaginationOptions = {}): Promise<PaginatedResult<Consultation>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.consultationRepository.findAndCount({
      where: { psychologistId },
      skip,
      take: limit,
      order: { scheduledDate: 'DESC' },
      relations: ['student'],
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        duration: true,
        studentNotes: true,
        rating: true,
        createdAt: true,
        student: {
          id: true,
          firstName: true,
          lastName: true,
          grade: true,
          school: true,
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

  async updateConsultation(id: string, updateData: UpdateConsultationDto, userId: string, userRole: UserRole): Promise<Consultation> {
    const consultation = await this.findConsultationById(id);

    // Check permissions
    if (userRole === UserRole.STUDENT && consultation.studentId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar esta consulta');
    }

    if (userRole === UserRole.PSYCHOLOGIST && consultation.psychologistId !== userId) {
      throw new ForbiddenException('No tienes permisos para actualizar esta consulta');
    }

    // Validate status changes
    if (updateData.status) {
      this.validateStatusChange(consultation.status, updateData.status, userRole);
    }

    Object.assign(consultation, updateData);
    return this.consultationRepository.save(consultation);
  }

  async cancelConsultation(id: string, userId: string, userRole: UserRole): Promise<Consultation> {
    const consultation = await this.findConsultationById(id);

    // Check permissions
    if (consultation.studentId !== userId && consultation.psychologistId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permisos para cancelar esta consulta');
    }

    // Check if consultation can be cancelled
    if (consultation.status === ConsultationStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una consulta completada');
    }

    consultation.status = ConsultationStatus.CANCELLED;
    return this.consultationRepository.save(consultation);
  }

  // Availability methods
  async createAvailability(psychologistId: string, createAvailabilityDto: CreateAvailabilityDto): Promise<Availability> {
    // Verify psychologist exists
    const psychologist = await this.userRepository.findOne({
      where: { id: psychologistId, role: UserRole.PSYCHOLOGIST },
    });

    if (!psychologist) {
      throw new NotFoundException('Psicólogo no encontrado');
    }

    // Validate time format
    if (this.timeToMinutes(createAvailabilityDto.startTime) >= this.timeToMinutes(createAvailabilityDto.endTime)) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    // Check for overlapping availability
    const existingAvailabilities = await this.availabilityRepository.find({
      where: {
        psychologistId,
        dayOfWeek: createAvailabilityDto.dayOfWeek,
        isActive: true,
      },
    });

    const newStart = this.timeToMinutes(createAvailabilityDto.startTime);
    const newEnd = this.timeToMinutes(createAvailabilityDto.endTime);

    for (const existing of existingAvailabilities) {
      const existingStart = this.timeToMinutes(existing.startTime);
      const existingEnd = this.timeToMinutes(existing.endTime);

      if ((newStart < existingEnd && newEnd > existingStart)) {
        throw new BadRequestException('Ya tienes disponibilidad en ese horario');
      }
    }

    const availability = this.availabilityRepository.create({
      psychologistId,
      ...createAvailabilityDto,
    });

    return this.availabilityRepository.save(availability);
  }

  async findPsychologistAvailabilities(psychologistId: string): Promise<Availability[]> {
    return this.availabilityRepository.find({
      where: { psychologistId, isActive: true },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async updateAvailability(id: string, updateData: Partial<CreateAvailabilityDto>, psychologistId: string): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id, psychologistId },
    });

    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    Object.assign(availability, updateData);
    return this.availabilityRepository.save(availability);
  }

  async removeAvailability(id: string, psychologistId: string): Promise<void> {
    const availability = await this.availabilityRepository.findOne({
      where: { id, psychologistId },
    });

    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    await this.availabilityRepository.remove(availability);
  }

  async getConsultationStatistics(psychologistId?: string): Promise<any> {
    let query = this.consultationRepository.createQueryBuilder('consultation');

    if (psychologistId) {
      query = query.where('consultation.psychologistId = :psychologistId', { psychologistId });
    }

    const consultations = await query.getMany();

    const statusCounts = {
      [ConsultationStatus.PENDING]: 0,
      [ConsultationStatus.ACCEPTED]: 0,
      [ConsultationStatus.REJECTED]: 0,
      [ConsultationStatus.COMPLETED]: 0,
      [ConsultationStatus.CANCELLED]: 0,
    };

    let totalRating = 0;
    let ratedConsultations = 0;

    consultations.forEach(consultation => {
      statusCounts[consultation.status]++;
      if (consultation.rating) {
        totalRating += consultation.rating;
        ratedConsultations++;
      }
    });

    return {
      total: consultations.length,
      statusCounts,
      averageRating: ratedConsultations > 0 ? totalRating / ratedConsultations : 0,
      completionRate: consultations.length > 0 
        ? (statusCounts[ConsultationStatus.COMPLETED] / consultations.length) * 100 
        : 0,
    };
  }

  // MÉTODO CORREGIDO: Verificación de disponibilidad del psicólogo
  private async checkPsychologistAvailability(psychologistId: string, requestedDate: Date): Promise<boolean> {
    // Convertir a zona horaria de Perú (UTC-5)
    const peruOffset = -5 * 60; // -5 horas en minutos
    const localDate = new Date(requestedDate.getTime() + (peruOffset * 60 * 1000));
    
    const dayOfWeek = localDate.getDay();
    const requestedHours = localDate.getHours();
    const requestedMinutes = localDate.getMinutes();
    const requestedTime = `${requestedHours.toString().padStart(2, '0')}:${requestedMinutes.toString().padStart(2, '0')}`;

    console.log(`Checking availability for:
      - Original UTC date: ${requestedDate.toISOString()}
      - Peru local date: ${localDate.toISOString()}
      - Day of week: ${dayOfWeek}
      - Requested time: ${requestedTime}`);

    // Buscar disponibilidades para ese día
    const availabilities = await this.availabilityRepository.find({
      where: {
        psychologistId,
        dayOfWeek,
        isActive: true,
      },
    });

    console.log(`Found ${availabilities.length} availabilities:`, availabilities.map(a => 
      `${a.startTime} - ${a.endTime}`
    ));

    if (availabilities.length === 0) {
      console.log('No availabilities found for this day');
      return false;
    }

    const requestedMinutesFromMidnight = this.timeToMinutes(requestedTime);

    // Verificar si la hora solicitada cae dentro de alguna disponibilidad
    for (const availability of availabilities) {
      const startMinutes = this.timeToMinutes(availability.startTime);
      const endMinutes = this.timeToMinutes(availability.endTime);

      console.log(`Checking against availability: ${availability.startTime} - ${availability.endTime}
        - Start minutes: ${startMinutes}
        - End minutes: ${endMinutes}
        - Requested minutes: ${requestedMinutesFromMidnight}`);

      // La hora solicitada debe estar dentro del rango de disponibilidad
      // Usamos < en lugar de <= para el final para evitar conflictos en el límite
      if (requestedMinutesFromMidnight >= startMinutes && requestedMinutesFromMidnight < endMinutes) {
        console.log('✓ Time slot is available');
        return true;
      }
    }

    console.log('✗ No matching availability found');
    return false;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private validateStatusChange(currentStatus: ConsultationStatus, newStatus: ConsultationStatus, userRole: UserRole): void {
    // Students can only cancel pending consultations
    if (userRole === UserRole.STUDENT) {
      if (currentStatus !== ConsultationStatus.PENDING || newStatus !== ConsultationStatus.CANCELLED) {
        throw new BadRequestException('Solo puedes cancelar consultas pendientes');
      }
    }

    // Psychologists can accept, reject, or complete consultations
    if (userRole === UserRole.PSYCHOLOGIST) {
      const validTransitions = {
        [ConsultationStatus.PENDING]: [ConsultationStatus.ACCEPTED, ConsultationStatus.REJECTED],
        [ConsultationStatus.ACCEPTED]: [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED],
      };

      const allowedStatuses = validTransitions[currentStatus] || [];
      if (!allowedStatuses.includes(newStatus)) {
        throw new BadRequestException('Transición de estado no válida');
      }
    }
  }

  async getAvailableSlots(psychologistId: string, date: string): Promise<string[]> {
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    // Get psychologist availability for that day
    const availabilities = await this.availabilityRepository.find({
      where: {
        psychologistId,
        dayOfWeek,
        isActive: true,
      },
    });

    if (availabilities.length === 0) {
      return [];
    }

    // Get existing consultations for that date
    const startOfDay = new Date(requestedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(requestedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingConsultations = await this.consultationRepository.find({
      where: {
        psychologistId,
        scheduledDate: Between(startOfDay, endOfDay),
        status: ConsultationStatus.ACCEPTED,
      },
    });

    // Generate available slots from all availabilities
    const slots: string[] = [];
    const slotDuration = 60; // 1 hour slots

    for (const availability of availabilities) {
      const startMinutes = this.timeToMinutes(availability.startTime);
      const endMinutes = this.timeToMinutes(availability.endTime);

      for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
        const slotTime = this.minutesToTime(minutes);
        const slotDateTime = new Date(requestedDate);
        const [hours, mins] = slotTime.split(':').map(Number);
        slotDateTime.setHours(hours, mins, 0, 0);

        // Check if slot is available (not booked and in the future)
        const isBooked = existingConsultations.some(consultation => {
          const consultationTime = new Date(consultation.scheduledDate);
          return Math.abs(consultationTime.getTime() - slotDateTime.getTime()) < 60 * 60 * 1000; // 1 hour window
        });

        if (!isBooked && slotDateTime > new Date()) { // Only future slots
          slots.push(slotTime);
        }
      }
    }

    return slots.sort(); // Sort times
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}