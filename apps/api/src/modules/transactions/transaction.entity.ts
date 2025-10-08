import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { Account } from '../accounts/account.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @ManyToOne(() => Account, { eager: true }) account!: Account;
  @Column() description!: string;
  @Column({ type: 'decimal', precision: 14, scale: 2 }) amount!: string;
  @Column() direction!: 'debit' | 'credit';
  @CreateDateColumn() createdAt!: Date;
}
