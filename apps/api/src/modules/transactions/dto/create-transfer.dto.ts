import { IsString, IsUUID, IsNumber, Min } from 'class-validator';

export class CreateTransferDto {
  @IsUUID() fromAccountId!: string;
  @IsString() toAccountNumber!: string;
  @IsNumber() @Min(0.01) amount!: number;
}
