import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
}
