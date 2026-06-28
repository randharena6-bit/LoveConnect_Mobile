import {
  Controller, Post, Body, Get, Patch, UseGuards, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto,
  SetupTwoFactorDto, VerifyTwoFactorDto, ResetPasswordDto,
  OAuthLoginDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.userId, dto.refreshToken);
  }

  @Public()
  @Post('oauth')
  @HttpCode(HttpStatus.OK)
  async oauthLogin(@Body() dto: OAuthLoginDto) {
    return this.authService.handleOAuthLogin(
      dto.provider,
      dto.providerId,
      dto.email,
      dto.name,
      dto.picture,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser('sub') userId: string) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@CurrentUser('sub') userId: string) {
    return this.authService.setupTwoFactor(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enableTwoFactor(@CurrentUser('sub') userId: string, @Body() dto: VerifyTwoFactorDto) {
    return this.authService.enableTwoFactor(userId, dto.token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disableTwoFactor(@CurrentUser('sub') userId: string) {
    return this.authService.disableTwoFactor(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@CurrentUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
