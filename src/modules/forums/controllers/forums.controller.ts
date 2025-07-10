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
import { ForumsService } from '../services/forums.service';
import { CreateForumDto } from '../dto/create-forum.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';
import { User } from '../../users/entities/user.entity';
import { PaginationOptions } from '../../../common/interfaces/pagination.interface';

@ApiTags('Forums')
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService) {}

  // Forum endpoints
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nuevo foro (Solo Admin)' })
  @ApiResponse({ status: 201, description: 'Foro creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Foro ya existe' })
  createForum(@Body() createForumDto: CreateForumDto) {
    return this.forumsService.createForum(createForumDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener todos los foros' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAllForums(@Query() options: PaginationOptions) {
    return this.forumsService.findAllForums(options);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener estadísticas de foros' })
  getStatistics() {
    return this.forumsService.getForumStatistics();
  }

  @Get('my-activity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener mi actividad en foros' })
  getMyActivity(@CurrentUser() user: User) {
    return this.forumsService.getUserForumActivity(user.id);
  }

  @Get('search/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar posts' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchPosts(
    @Query('q') query: string,
    @Query() options: PaginationOptions,
  ) {
    return this.forumsService.searchPosts(query, options);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener foro por ID' })
  @ApiResponse({ status: 404, description: 'Foro no encontrado' })
  findForumById(@Param('id', ParseUUIDPipe) id: string) {
    return this.forumsService.findForumById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar foro (Solo Admin)' })
  updateForum(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<CreateForumDto>,
  ) {
    return this.forumsService.updateForum(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar foro (Solo Admin)' })
  removeForum(@Param('id', ParseUUIDPipe) id: string) {
    return this.forumsService.removeForum(id);
  }

  // Post endpoints
  @Post(':forumId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear nuevo post en foro' })
  @ApiResponse({ status: 201, description: 'Post creado exitosamente' })
  createPost(
    @Param('forumId', ParseUUIDPipe) forumId: string,
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    // Ensure forumId matches the route parameter
    createPostDto.forumId = forumId;
    return this.forumsService.createPost(createPostDto, user.id);
  }

  @Get(':forumId/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener posts de un foro' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findForumPosts(
    @Param('forumId', ParseUUIDPipe) forumId: string,
    @Query() options: PaginationOptions,
  ) {
    return this.forumsService.findForumPosts(forumId, options);
  }

  @Get('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener post por ID' })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  findPostById(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.forumsService.findPostById(postId);
  }

  @Patch('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar post' })
  updatePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() updateData: Partial<CreatePostDto>,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.updatePost(postId, updateData, user.id, user.role);
  }

  @Delete('posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar post' })
  removePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.removePost(postId, user.id, user.role);
  }

  @Patch('posts/:postId/pin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Fijar/Desfijar post (Solo Admin)' })
  togglePostPin(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.forumsService.togglePostPin(postId);
  }

  @Patch('posts/:postId/lock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Bloquear/Desbloquear post (Solo Admin)' })
  togglePostLock(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.forumsService.togglePostLock(postId);
  }

  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Dar like a post' })
  likePost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.likePost(postId, user.id);
  }

  // Comment endpoints
  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear comentario en post' })
  @ApiResponse({ status: 201, description: 'Comentario creado exitosamente' })
  createComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    // Ensure postId matches the route parameter
    createCommentDto.postId = postId;
    return this.forumsService.createComment(createCommentDto, user.id);
  }

  @Get('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener comentarios de un post' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findPostComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query() options: PaginationOptions,
  ) {
    return this.forumsService.findPostComments(postId, options);
  }

  @Patch('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar comentario' })
  updateComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body('content') content: string,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.updateComment(commentId, content, user.id, user.role);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar comentario' })
  removeComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.removeComment(commentId, user.id, user.role);
  }

  @Post('comments/:commentId/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Dar like a comentario' })
  likeComment(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.forumsService.likeComment(commentId, user.id);
  }
}