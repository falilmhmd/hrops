import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

import { User } from '../../database/entities/user.entity';
import { Organization } from '../../database/entities/organization.entity';
import { Role } from '../../common/enums/role.enum';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // FR-ADMIN-AUTH-001: Admin Sign Up
  // BR-ADMIN-001: Organization name must be unique
  // BR-ADMIN-002: Email must be unique across platforms
  // BR-ADMIN-003: Email verification mandatory before login
  // ─────────────────────────────────────────────────────────────────────────────
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    // BR-ADMIN-001: Check organization name uniqueness
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: dto.organizationName },
    });
    if (existingOrg) {
      throw new ConflictException(
        `Organization "${dto.organizationName}" already exists`,
      );
    }

    // BR-ADMIN-002: Check email uniqueness
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException(
        `Email "${dto.email}" is already registered`,
      );
    }

    // Create organization
    const organization = this.organizationRepository.create({
      name: dto.organizationName,
    });
    const savedOrg = await this.organizationRepository.save(organization);

    // Generate email verification token (BR-ADMIN-003)
    const verificationToken = randomUUID();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    // Create admin user
    const user = this.userRepository.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email.toLowerCase(),
      phone: dto.phone,
      password: dto.password,
      role: Role.HR_ADMIN,
      organizationId: savedOrg.id,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    const savedUser = await this.userRepository.save(user);

    // Send verification email
    await this.mailService.sendVerificationEmail(
      savedUser.email,
      savedUser.firstName,
      verificationToken,
    );

    // Audit log
    await this.auditService.log({
      action: AuditAction.REGISTER,
      userId: savedUser.id,
      userEmail: savedUser.email,
      organizationId: savedOrg.id,
      ipAddress,
      userAgent,
      description: `New HR Admin registered for organization: ${dto.organizationName}`,
      metadata: {
        organizationId: savedOrg.id,
        organizationName: dto.organizationName,
        role: Role.HR_ADMIN,
      },
    });

    this.logger.log(
      `New admin registered: ${savedUser.email} for org: ${dto.organizationName}`,
    );

    return {
      message:
        'Registration successful! Please check your email to verify your account.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FR-ADMIN-AUTH-002 / FR-EMP-AUTH-001: Login
  // BR-EMP-AUTH-001: Email must be verified
  // BR-EMP-AUTH-002: Account locks after 5 failed attempts
  // ─────────────────────────────────────────────────────────────────────────────
  async login(
    dto: LoginDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase(), isDeleted: false },
    });

    if (!user) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        userEmail: dto.email,
        ipAddress,
        userAgent,
        description: 'Login attempt with non-existent email',
        success: false,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is locked (BR-EMP-AUTH-002)
    if (user.isAccountLocked()) {
      const lockMinutes = this.configService.get<number>(
        'LOCKOUT_DURATION_MINUTES',
        30,
      );
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
        description: 'Login attempt on locked account',
        success: false,
      });
      throw new UnauthorizedException(
        `Account is locked due to multiple failed attempts. Try again after ${lockMinutes} minutes or contact support.`,
      );
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(dto.password);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid email or password');
    }

    // BR-EMP-AUTH-001: Check email verification
    if (!user.isEmailVerified) {
      await this.auditService.log({
        action: AuditAction.LOGIN_FAILED,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
        description: 'Login attempt with unverified email',
        success: false,
      });
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for the verification link.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact HR.',
      );
    }

    // Reset failed login attempts on successful login
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      isLocked: false,
    });
    // Clear lockedUntil via query builder to avoid type issues
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ lockedUntil: () => 'NULL' })
      .where('id = :id', { id: user.id })
      .execute();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token hash
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.userRepository.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    // Audit log
    await this.auditService.log({
      action: AuditAction.LOGIN_SUCCESS,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
      description: `Successful login for ${user.email}`,
      metadata: { role: user.role },
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Email Verification (BR-ADMIN-003 / BR-EMP-AUTH-001)
  // ─────────────────────────────────────────────────────────────────────────────
  async verifyEmail(
    token: string,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified. You can log in.' };
    }

    if (
      user.emailVerificationExpiry &&
      new Date() > user.emailVerificationExpiry
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one.',
      );
    }

    await this.userRepository.update(user.id, {
      isEmailVerified: true,
    });
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        emailVerificationToken: () => 'NULL',
        emailVerificationExpiry: () => 'NULL',
      })
      .where('id = :id', { id: user.id })
      .execute();

    await this.auditService.log({
      action: AuditAction.EMAIL_VERIFIED,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      description: `Email verified for ${user.email}`,
    });

    this.logger.log(`Email verified for: ${user.email}`);

    return {
      message: 'Email verified successfully! You can now log in.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Resend Verification Email
  // ─────────────────────────────────────────────────────────────────────────────
  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
    });

    if (!user || user.isEmailVerified) {
      return {
        message:
          'If this email is registered and unverified, a new verification link has been sent.',
      };
    }

    const verificationToken = randomUUID();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24);

    await this.userRepository.update(user.id, {
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      user.firstName,
      verificationToken,
    );

    return {
      message:
        'If this email is registered and unverified, a new verification link has been sent.',
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Forgot Password
  // ─────────────────────────────────────────────────────────────────────────────
  async forgotPassword(
    dto: ForgotPasswordDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase(), isDeleted: false },
    });

    const successMessage =
      'If this email is registered, a password reset link has been sent.';

    if (!user) {
      return { message: successMessage };
    }

    const resetToken = randomUUID();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    });

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetToken,
    );

    await this.auditService.log({
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      description: `Password reset requested for ${user.email}`,
    });

    return { message: successMessage };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Reset Password
  // ─────────────────────────────────────────────────────────────────────────────
  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiry && new Date() > user.passwordResetExpiry) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new password reset.',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.userRepository.update(user.id, {
      password: hashedPassword,
      failedLoginAttempts: 0,
      isLocked: false,
    });
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({
        passwordResetToken: () => 'NULL',
        passwordResetExpiry: () => 'NULL',
        lockedUntil: () => 'NULL',
        refreshToken: () => 'NULL',
      })
      .where('id = :id', { id: user.id })
      .execute();

    await this.auditService.log({
      action: AuditAction.PASSWORD_RESET_SUCCESS,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      description: `Password reset successful for ${user.email}`,
    });

    this.logger.log(`Password reset for: ${user.email}`);

    return { message: 'Password reset successfully. You can now log in.' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Refresh Token
  // ─────────────────────────────────────────────────────────────────────────────
  async refreshTokens(
    userId: string,
    refreshToken: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);

    await this.userRepository.update(user.id, {
      refreshToken: hashedRefreshToken,
    });

    await this.auditService.log({
      action: AuditAction.TOKEN_REFRESHED,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      description: `Token refreshed for ${user.email}`,
    });

    return tokens;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Logout
  // ─────────────────────────────────────────────────────────────────────────────
  async logout(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (user) {
      await this.userRepository
        .createQueryBuilder()
        .update(User)
        .set({ refreshToken: () => 'NULL' })
        .where('id = :id', { id: userId })
        .execute();

      await this.auditService.log({
        action: AuditAction.LOGOUT,
        userId: user.id,
        userEmail: user.email,
        organizationId: user.organizationId,
        ipAddress,
        userAgent,
        description: `User logged out: ${user.email}`,
      });
    }

    return { message: 'Logged out successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Get Current User Profile
  // ─────────────────────────────────────────────────────────────────────────────
  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isDeleted: false },
      relations: ['organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: jwtExpiresIn as string,
    };
  }

  // Handle failed login attempts and account lockout (BR-EMP-AUTH-002)
  private async handleFailedLogin(
    user: User,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS', 5);
    const lockoutMinutes = this.configService.get<number>(
      'LOCKOUT_DURATION_MINUTES',
      30,
    );

    const newFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newFailedAttempts >= maxAttempts;

    await this.userRepository.update(user.id, {
      failedLoginAttempts: newFailedAttempts,
      isLocked: shouldLock,
    });

    if (shouldLock) {
      const lockedUntil = new Date(
        Date.now() + lockoutMinutes * 60 * 1000,
      );
      await this.userRepository.update(user.id, {
        lockedUntil: lockedUntil,
      });
    }

    await this.auditService.log({
      action: shouldLock
        ? AuditAction.ACCOUNT_LOCKED
        : AuditAction.LOGIN_FAILED,
      userId: user.id,
      userEmail: user.email,
      organizationId: user.organizationId,
      ipAddress,
      userAgent,
      description: shouldLock
        ? `Account locked after ${maxAttempts} failed attempts`
        : `Failed login attempt ${newFailedAttempts}/${maxAttempts}`,
      success: false,
      metadata: { failedAttempts: newFailedAttempts },
    });

    if (shouldLock) {
      this.logger.warn(
        `Account locked: ${user.email} after ${maxAttempts} failed attempts`,
      );
    }
  }

  private sanitizeUser(user: User): Partial<User> {
    const {
      password,
      emailVerificationToken,
      emailVerificationExpiry,
      passwordResetToken,
      passwordResetExpiry,
      refreshToken,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ...sanitized
    } = user as any;
    return sanitized;
  }
}
