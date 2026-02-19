import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { AuditAction } from '../../common/enums/audit-action.enum';

export interface CreateAuditLogDto {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  organizationId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  description?: string;
  success?: boolean;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: CreateAuditLogDto): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        action: data.action,
        userId: data.userId,
        userEmail: data.userEmail,
        organizationId: data.organizationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata,
        description: data.description,
        success: data.success !== undefined ? data.success : true,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Audit logging should never break the main flow
      this.logger.error('Failed to create audit log', error);
    }
  }

  async findByUser(userId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByOrganization(
    organizationId: string,
    limit = 100,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByAction(action: AuditAction, limit = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { action },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
