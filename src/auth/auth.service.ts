import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuthDto } from './dto/auth.dto.js';
import { Role } from '../users/entities/user.entity.js';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // Регистрация
  async signUp(dto: AuthDto): Promise<Tokens> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException(
        'Пользователь с таким email уже существует',
      );
    }

    const hashedPassword = await this.hashData(dto.password);
    const newUser = await this.usersService.create(dto.email, hashedPassword);

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email,
      newUser.role,
    );
    await this.updateRefreshTokenHash(newUser.id, tokens.refreshToken);

    return tokens;
  }

  // Вход
  async signIn(dto: AuthDto): Promise<Tokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new ForbiddenException('Неверный email или пароль');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new ForbiddenException('Неверный email или пароль');
    }

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  // Выход
  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  // Вспомогательный метод: хеширование строк
  private async hashData(data: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(data, saltRounds);
  }

  // Вспомогательный метод: сохранение хеша refresh-токена в БД
  private async updateRefreshTokenHash(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hash = await this.hashData(refreshToken);
    await this.usersService.updateRefreshTokenHash(userId, hash);
  }

  // Вспомогательный метод: генерация пары токенов
  private async getTokens(
    userId: string,
    email: string,
    role: Role,
  ): Promise<Tokens> {
    const jwtPayload = {
      sub: userId, // стандартное поле JWT для ID пользователя
      email,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m', // короткий срок жизни
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d', // долгий срок жизни
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
