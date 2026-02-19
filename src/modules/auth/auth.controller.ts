import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ResponseDto } from '../../common/dto/response.dto';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { BusinessException } from '../../common/exceptions/business.exception';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/register
  // FR-ADMIN-AUTH-001: Admin Sign Up
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new organization & HR Admin',
    description:
      'FR-ADMIN-AUTH-001: Creates organization + HR Admin account. Sends verification email. BR-ADMIN-001: Org name unique. BR-ADMIN-002: Email unique.',
  })
  @ApiResponse({ status: 201, description: 'Registration successful. Verification email sent.' })
  @ApiResponse({ status: 409, description: 'Organization or email already exists.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.register(dto, ipAddress, userAgent);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Registration successful. Verification email sent.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/register',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/login
  // FR-ADMIN-AUTH-002 / FR-EMP-AUTH-001: Login
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email & password',
    description:
      'FR-EMP-AUTH-001: Authenticates user. BR-EMP-AUTH-001: Email must be verified. BR-EMP-AUTH-002: Locks after 5 failed attempts.',
  })
  @ApiResponse({ status: 200, description: 'Login successful. Returns JWT tokens.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials / account locked / email not verified.' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.login(dto, ipAddress, userAgent);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Login successful. Returns JWT tokens.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/login',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /auth/verify-email?token=xxx
  // BR-ADMIN-003 / BR-EMP-AUTH-001: Email verification
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'BR-ADMIN-003: Verifies email using token sent during registration.',
  })
  @ApiQuery({ name: 'token', description: 'Email verification token', required: true })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async verifyEmail(@Query('token') token: string, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const result = await this.authService.verifyEmail(token, ipAddress);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/verify-email',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/resend-verification
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend email verification link',
    description: 'Resends verification email if account is unverified.',
  })
  @ApiResponse({ status: 200, description: 'Verification email sent (if applicable).' })
  async resendVerification(@Body('email') email: string) {
    const result = await this.authService.resendVerificationEmail(email);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Verification email sent (if applicable).',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/resend-verification',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/forgot-password
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Sends password reset link to registered email.',
  })
  @ApiResponse({ status: 200, description: 'Reset email sent (if email exists).' })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const result = await this.authService.forgotPassword(dto, ipAddress);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Reset email sent (if email exists).',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/forgot-password',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/reset-password
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password using token',
    description: 'Resets password using the token received via email.',
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const result = await this.authService.resetPassword(dto, ipAddress);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Password reset successfully.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/reset-password',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/refresh
  // ─────────────────────────────────────────────────────────────────────────────
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Returns new access & refresh tokens using a valid refresh token.',
  })
  @ApiResponse({ status: 200, description: 'Tokens refreshed.' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
  async refreshTokens(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const result = await this.authService.refreshTokens(userId, refreshToken, ipAddress);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Tokens refreshed.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/refresh',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /auth/logout
  // ─────────────────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Logout current user',
    description: 'Invalidates refresh token and logs the logout event.',
  })
  @ApiResponse({ status: 200, description: 'Logged out successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    const ipAddress = req.ip || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const result = await this.authService.logout(user.id, ipAddress, userAgent);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Logged out successfully.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/logout',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // GET /auth/me
  // ─────────────────────────────────────────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user profile.',
  })
  @ApiResponse({ status: 200, description: 'User profile returned.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfile(@CurrentUser() user: User) {
    const result = await this.authService.getProfile(user.id);
    return new ResponseDto({
      success: true,
      statusCode: HttpStatus.OK,
      message: 'User profile returned.',
      data: result,
      timestamp: new Date().toISOString(),
      path: '/auth/me',
    });
  }
}
