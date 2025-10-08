import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => User, { eager: true }) owner!: User;
  @Column() type!: string; // checking, savings
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 }) balance!: string;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
