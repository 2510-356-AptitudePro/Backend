import {
  Controller,
  Get,
  Post,
  Body,
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
import { TestResultsService } from '../services/test-results.service';
import { SubmitTestDto } from '../dto/submit-test.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { PaginationOptions } from '../../../common/interfaces/pagination.interface';

@ApiTags('Test-Results')
@Controller('test-results')
export class TestResultsController {
  constructor(private readonly testResultsService: TestResultsService) {}

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enviar respuestas de test y obtener resultado' })
  @ApiResponse({ status: 201, description: 'Test enviado y procesado exitosamente' })
  @ApiResponse({ status: 400, description: 'Respuestas inválidas' })
  @ApiResponse({ status: 409, description: 'Test ya completado' })
  submitTest(
    @Body() submitTestDto: SubmitTestDto,
    @CurrentUser() user: User,
  ) {
    return this.testResultsService.submitTest(user.id, submitTestDto);
  }

  @Get('my-results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mis resultados de tests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMyResults(
    @CurrentUser() user: User,
    @Query() options: PaginationOptions,
  ) {
    return this.testResultsService.findByUser(user.id, options);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener estadísticas generales (Solo Psicólogos y Admin)' })
  @ApiQuery({ name: 'testId', required: false, type: String })
  getStatistics(@Query('testId') testId?: string) {
    return this.testResultsService.getStatistics(testId);
  }

  @Get('test/:testId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PSYCHOLOGIST, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener resultados de un test específico (Solo Psicólogos y Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTestResults(
    @Param('testId', ParseUUIDPipe) testId: string,
    @Query() options: PaginationOptions,
  ) {
    return this.testResultsService.findByTest(testId, options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener resultado específico por ID' })
  @ApiResponse({ status: 404, description: 'Resultado no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.testResultsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar resultado (Solo Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.testResultsService.remove(id);
  }
}