import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Notification } from '../notifications/notification.entity';
import { KycDetail } from '../kyc/kyc-detail.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) email!: string;
  @Column() passwordHash!: string;
  @Column({ default: false }) mfaEnabled!: boolean;
  @Column({ type: 'text', nullable: true }) mfaSecret?: string | null;
  @Column({ type: 'text', nullable: true }) firstName?: string | null;
  @Column({ type: 'text', nullable: true }) lastName?: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
  
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Notification[];

  @OneToOne(() => KycDetail, (kycDetail) => kycDetail.user)
  kycDetail!: KycDetail;
}
