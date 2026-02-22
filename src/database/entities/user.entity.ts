import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../common/enums/role.enum';
import { Organization } from './organization.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ==================== PERSONAL INFORMATION ====================
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  mobileNumber: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth: Date;

  @Column({ nullable: true })
  maritalStatus: string;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  nationality: string;

  // Address fields
  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipcode: string;

  // ==================== PROFESSIONAL INFORMATION ====================
  @Column({ nullable: true })
  employeeId: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  employmentType: string;

  @Column({ nullable: true })
  officialEmail: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  designation: string;

  @Column({ nullable: true })
  workingDays: string;

  @Column({ nullable: true, type: 'date' })
  dateOfJoining: Date;

  @Column({ nullable: true })
  officeLocation: string;

  @Column({ nullable: true })
  reportingManagerId: string;

  // ==================== DOCUMENTS ====================
  @Column({ nullable: true, type: 'text' })
  appointmentLetter: string;

  @Column({ nullable: true, type: 'text' })
  salarySlips: string;

  @Column({ nullable: true, type: 'text' })
  relievingLetter: string;

  @Column({ nullable: true, type: 'text' })
  experienceLetter: string;

  @Column({ nullable: true, type: 'text' })
  certificateLetter: string;

  // ==================== ACCOUNT ACCESS ====================
  @Column({ nullable: true })
  slackId: string;

  @Column({ nullable: true })
  skypeId: string;

  @Column({ nullable: true })
  githubId: string;

  // ==================== SYSTEM FIELDS ====================
  @Column()
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.EMPLOYEE,
  })
  role: Role;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, { nullable: true, eager: false })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  // Email Verification
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  emailVerificationExpiry: Date;

  // Password Reset
  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true, type: 'timestamp' })
  passwordResetExpiry: Date;

  // Account Lockout (BR-EMP-AUTH-002)
  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockedUntil: Date;

  @Column({ default: false })
  isLocked: boolean;

  // Refresh Token
  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  // Soft Delete (BR-EMP-ADMIN-004)
  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  profilePicture: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual getter for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Hash password before insert/update
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Validate password
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // Check if account is locked
  isAccountLocked(): boolean {
    if (!this.isLocked) return false;
    if (this.lockedUntil && new Date() > this.lockedUntil) {
      return false; // Lock expired
    }
    return true;
  }
}