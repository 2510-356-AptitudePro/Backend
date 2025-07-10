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
import { TestsService } from '../services/tests.service';
import { CreateTestDto } from '../dto/create-test.dto';
import { UpdateTestDto } from '../dto/update-test.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

import { User } from '../../users/entities/user.entity';
import { PaginationOptions } from '../../../common/interfaces/pagination.interface';
import { TestType } from 'src/common/enums/test-type.enum';

@ApiTags('Tests')
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un nuevo test (Solo Psicólogos y Admin)' })
  @ApiResponse({ status: 201, description: 'Test creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(
    @Body() createTestDto: CreateTestDto,
    @CurrentUser() user: User,
  ) {
    return this.testsService.create(createTestDto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener todos los tests activos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() options: PaginationOptions) {
    return this.testsService.findAll(options);
  }

  @Get('my-tests')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mis tests creados' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyTests(
    @CurrentUser() user: User,
    @Query() options: PaginationOptions,
  ) {
    return this.testsService.getMyTests(user.id, options);
  }

  @Get('type/:type')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener tests por tipo' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findByType(
    @Param('type') type: TestType,
    @Query() options: PaginationOptions,
  ) {
    return this.testsService.findByType(type, options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener test completo por ID (para administración)' })
  @ApiResponse({ status: 404, description: 'Test no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testsService.findOne(id);
  }

  @Get(':id/take')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener test para realizar (sin respuestas correctas)' })
  @ApiResponse({ status: 404, description: 'Test no encontrado' })
  findOneForTaking(@Param('id', ParseUUIDPipe) id: string) {
    return this.testsService.findOneForTaking(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar test' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTestDto: UpdateTestDto,
    @CurrentUser() user: User,
  ) {
    return this.testsService.update(id, updateTestDto, user.id, user.role);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Activar/Desactivar test' })
  toggleActive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.testsService.toggleActive(id, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar test' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.testsService.remove(id, user.id, user.role);
  }
}