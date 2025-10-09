import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('kyc_submissions')
export class KycSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ type: 'varchar', default: 'personal' })
  accountType!: string;

  @Column({ type: 'json', nullable: true })
  data?: any;

  @Column({ type: 'json', nullable: true })
  files?: { key: string; url: string }[];

  @Column({ type: 'varchar', default: 'submitted' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
