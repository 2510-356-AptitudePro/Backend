import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../users/entities/user.entity';

export interface AuthResult {
  user: User;
  access_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const { identifier, password } = loginDto;
    
    // Find user by username or email
    const user = await this.findUserByIdentifier(identifier);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Cuenta desactivada');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      username: user.username, 
      role: user.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    // Remove password from response
    delete user.password;

    return {
      user,
      access_token,
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
  try {
    const user = await this.usersService.create(registerDto);

    const payload = { 
      sub: user.id, 
      username: user.username, 
      role: user.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    return {
      user,
      access_token,
    };

  } catch (error) {
    if (error instanceof ConflictException) {
      throw error;
    }
    console.error('Error en register:', error); // Debug opcional
    throw new InternalServerErrorException('Ocurrió un error al registrar usuario');
  }
}


  async validateUser(userId: string): Promise<User | null> {
    try {
      return await this.usersService.findOne(userId);
    } catch {
      return null;
    }
  }

  private async findUserByIdentifier(identifier: string): Promise<User | null> {
    // Try to find by email first
    if (identifier.includes('@')) {
      return this.usersService.findByEmail(identifier);
    }
    
    // Otherwise find by username
    return this.usersService.findByUsername(identifier);
  }
}