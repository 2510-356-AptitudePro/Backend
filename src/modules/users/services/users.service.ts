import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/pagination.interface';
import { UserRole } from '../../../common/enums/user-role.enum';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { username, email, password, ...userData } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException('Usuario o email ya existe');
    }

    // Hash password
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS', '12'), 10);
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      ...userData,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'username',
        'email',
        'role',
        'firstName',
        'lastName',
        'isActive',
        'createdAt',
      ],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'role',
        'firstName',
        'lastName',
        'dateOfBirth',
        'phone',
        'school',
        'grade',
        'bio',
        'profilePicture',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: { email },
    select: ['id', 'username', 'email', 'password', 'role', 'isActive'],
  });
}


  async findByUsername(username: string): Promise<User | null> {
  return this.userRepository.findOne({
    where: { username },
    select: ['id', 'username', 'email', 'password', 'role', 'isActive'],
  });
}


  async findByRole(
    role: UserRole,
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      where: { role, isActive: true },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'username',
        'email',
        'firstName',
        'lastName',
        'bio',
        'profilePicture',
        'createdAt',
      ],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findOne(id);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password!,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Contraseña actual incorrecta');
    }

    // Hash new password
    const saltRounds = this.configService.get<number>('BCRYPT_ROUNDS', 12);
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    await this.userRepository.update(id, { password: hashedNewPassword });
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.update(id, { isActive: false });
  }

  async activate(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.update(id, { isActive: true });
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async verifyEmail(id: string): Promise<void> {
    await this.userRepository.update(id, { emailVerified: true });
  }
}
