import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Config (loads .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (NFR-ADMIN-003: response < 2s, throttle abuse)
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),

    // Database
    DatabaseModule,

    // Global modules
    MailModule,
    AuditModule,

    // Feature modules
    AuthModule,
  ],
  providers: [
    // Apply JWT guard globally (NFR-ADMIN-001: RBAC at API level)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Apply Roles guard globally
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
