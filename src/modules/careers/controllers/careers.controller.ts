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
import { CareersService } from '../services/careers.service';
import { CreateCareerDto } from '../dto/create-career.dto';
import { CreateUniversityDto } from '../dto/create-university.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { PaginationOptions } from '../../../common/interfaces/pagination.interface';

@ApiTags('Careers')
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  // Career endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nueva carrera (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Carrera creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Carrera ya existe' })
  createCareer(@Body() createCareerDto: CreateCareerDto) {
    return this.careersService.createCareer(createCareerDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener todas las carreras' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllCareers(@Query() options: PaginationOptions) {
    return this.careersService.findAllCareers(options);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar carreras por término' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchCareers(
    @Query('q') query: string,
    @Query() options: PaginationOptions,
  ) {
    return this.careersService.searchCareers(query, options);
  }

  @Get('field/:field')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener carreras por campo de estudio' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findCareersByField(
    @Param('field') field: string,
    @Query() options: PaginationOptions,
  ) {
    return this.careersService.findCareersByField(field, options);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener recomendaciones de carreras basadas en habilidades' })
  @ApiQuery({ name: 'skills', required: true, type: String, description: 'Habilidades separadas por coma' })
  getRecommendations(@Query('skills') skillsString: string) {
    const skills = skillsString.split(',').map(skill => skill.trim());
    return this.careersService.getCareerRecommendations(skills);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener carrera por ID' })
  @ApiResponse({ status: 404, description: 'Carrera no encontrada' })
  findCareerById(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.findCareerById(id);
  }

  @Get(':id/universities')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener universidades que ofrecen una carrera' })
  getUniversitiesByCareer(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.getUniversitiesByCareer(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar carrera (Solo Admin)' })
  updateCareer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateCareerDto>,
  ) {
    return this.careersService.updateCareer(id, updateData);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activar/Desactivar carrera (Solo Admin)' })
  toggleCareerStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.toggleCareerStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar carrera (Solo Admin)' })
  removeCareer(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.removeCareer(id);
  }

  // University endpoints
  @Post('universities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nueva universidad (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Universidad creada exitosamente' })
  @ApiResponse({ status: 409, description: 'Universidad ya existe' })
  createUniversity(@Body() createUniversityDto: CreateUniversityDto) {
    return this.careersService.createUniversity(createUniversityDto);
  }

  @Get('universities/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener todas las universidades' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllUniversities(@Query() options: PaginationOptions) {
    return this.careersService.findAllUniversities(options);
  }

  @Get('universities/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener universidad por ID' })
  @ApiResponse({ status: 404, description: 'Universidad no encontrada' })
  findUniversityById(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.findUniversityById(id);
  }

  @Get('universities/:id/careers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener carreras de una universidad' })
  getCareersByUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.getCareersByUniversity(id);
  }

  @Patch('universities/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar universidad (Solo Admin)' })
  updateUniversity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateUniversityDto>,
  ) {
    return this.careersService.updateUniversity(id, updateData);
  }

  @Delete('universities/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar universidad (Solo Admin)' })
  removeUniversity(@Param('id', ParseUUIDPipe) id: string) {
    return this.careersService.removeUniversity(id);
  }
}