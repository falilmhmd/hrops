import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum HolidayType {
    PUBLIC = 'public',
    OPTIONAL = 'optional',
}

@Entity('holidays')
export class Holiday {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ type: 'date' })
    date: Date;

    @Column({
        type: 'enum',
        enum: HolidayType,
        default: HolidayType.PUBLIC,
    })
    type: HolidayType;

    @Column({ nullable: true })
    location: string;

    @Column({ type: 'simple-array', nullable: true })
    locations: string[];

    @Column({ default: true })
    isRecurring: boolean;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: true, eager: false })
    @JoinColumn({ name: 'organizationId' })
    organization: Organization;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}