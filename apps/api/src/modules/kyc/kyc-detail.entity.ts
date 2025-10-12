import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('kyc_details')
export class KycDetail {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column() userId!: string;
  @ManyToOne(() => User, { eager: true }) user!: User;
  @Column() accountType!: string;
  // Personal details
  @Column({ nullable: true }) fullName?: string;
  @Column({ nullable: true }) dob?: string;
  @Column({ nullable: true }) ssnEncrypted?: string;
  ssn?: string;
  @Column({ nullable: true }) address?: string;
  // Business details
  @Column({ nullable: true }) businessName?: string;
  @Column({ nullable: true }) taxIdEncrypted?: string;
  taxId?: string;
  @Column({ nullable: true }) businessAddress?: string;
  // Common fields
  @Column({ default: 'pending' }) status!: string;
  @Column({ type: 'json', nullable: true }) files?: { key: string; url: string }[];
  @Column({ nullable: true }) rejectReason?: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}