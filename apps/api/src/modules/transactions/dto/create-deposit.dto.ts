import { IsUUID, IsNumber, Min } from 'class-validator';

export class CreateDepositDto {
  @IsUUID() accountId!: string;
  @IsNumber() @Min(0.01) amount!: number;
}