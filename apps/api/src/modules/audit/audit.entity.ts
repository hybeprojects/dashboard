import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  action!: string;

  @ManyToOne(() => User)
  user!: User;

  @Column()
  ip_address!: string;

  @CreateDateColumn()
  timestamp!: Date;
}