import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const verificationUrl = `${frontendUrl}/auth/verify-email?token=${token}`;

    const mailOptions = {
      from: `"HRMS" <${this.configService.get<string>('MAIL_FROM', 'noreply@hrms.com')}>`,
      to: email,
      subject: 'Verify Your HRMS Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #2563EB; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .body { padding: 30px; }
            .body p { color: #555; line-height: 1.6; }
            .btn { display: inline-block; background: #2563EB; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 HRMS Platform</h1>
            </div>
            <div class="body">
              <h2>Welcome, ${name}!</h2>
              <p>Thank you for registering with HRMS. Please verify your email address to activate your account.</p>
              <p>Click the button below to verify your email:</p>
              <a href="${verificationUrl}" class="btn">Verify Email Address</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #2563EB;">${verificationUrl}</p>
              <p><strong>This link expires in 24 hours.</strong></p>
              <p>If you did not create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HRMS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      // Don't throw - email failure shouldn't block registration
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${token}`;

    const mailOptions = {
      from: `"HRMS" <${this.configService.get<string>('MAIL_FROM', 'noreply@hrms.com')}>`,
      to: email,
      subject: 'Reset Your HRMS Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #DC2626; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .body { padding: 30px; }
            .body p { color: #555; line-height: 1.6; }
            .btn { display: inline-block; background: #DC2626; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
            </div>
            <div class="body">
              <h2>Hello, ${name}!</h2>
              <p>We received a request to reset your HRMS account password.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" class="btn">Reset Password</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #DC2626;">${resetUrl}</p>
              <p><strong>This link expires in 1 hour.</strong></p>
              <p>If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HRMS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    tempPassword: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );

    const mailOptions = {
      from: `"HRMS" <${this.configService.get<string>('MAIL_FROM', 'noreply@hrms.com')}>`,
      to: email,
      subject: 'Welcome to HRMS – Your Account is Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #059669; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .body { padding: 30px; }
            .body p { color: #555; line-height: 1.6; }
            .credentials { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin: 20px 0; }
            .btn { display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to HRMS!</h1>
            </div>
            <div class="body">
              <h2>Hello, ${name}!</h2>
              <p>Your HRMS account has been created. Here are your login credentials:</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>
              <p>Please log in and change your password immediately.</p>
              <a href="${frontendUrl}/auth/login" class="btn">Login to HRMS</a>
              <p style="color: #DC2626;"><strong>⚠️ For security, please change your password after first login.</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HRMS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
    }
  }

  async sendInvitationEmail(
    email: string,
    name: string,
    tempPassword: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:4200',
    );

    const mailOptions = {
      from: `"HRMS" <${this.configService.get<string>('MAIL_FROM', 'noreply@hrms.com')}>`,
      to: email,
      subject: 'You Have Been Invited to HRMS',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: #059669; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .body { padding: 30px; }
            .body p { color: #555; line-height: 1.6; }
            .credentials { background: #f0fdf4; border: 1px solid #86efac; border-radius: 6px; padding: 16px; margin: 20px 0; }
            .btn { display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
            .footer { background: #f8f8f8; padding: 20px; text-align: center; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 You Have Been Invited to HRMS!</h1>
            </div>
            <div class="body">
              <h2>Hello, ${name}!</h2>
              <p>You have been invited to join the HRMS platform. Here are your login credentials:</p>
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>
              <p>Please log in and change your password immediately.</p>
              <a href="${frontendUrl}/auth/login" class="btn">Login to HRMS</a>
              <p style="color: #DC2626;"><strong>⚠️ For security, please change your password after first login.</strong></p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} HRMS Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
    }
  }
}