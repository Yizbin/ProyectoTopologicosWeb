import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, LoginResponse } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegistroDto } from './dto/registro.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  async registro(@Body() registroDto: RegistroDto): Promise<LoginResponse> {
    return this.authService.registro(registroDto);
  }

  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  async obtenerPerfil(@CurrentUser() user: any): Promise<any> {
    return user;
  }
}
