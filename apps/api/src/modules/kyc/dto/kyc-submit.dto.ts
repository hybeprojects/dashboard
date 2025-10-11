import { IsOptional, IsString, IsNumber, IsIn, ValidateIf } from 'class-validator';

export class KycSubmitDto {
  @IsOptional()
  @IsString()
  userId?: string | null;

  @IsString()
  @IsIn(['personal', 'business'])
  accountType!: string;

  // Personal fields
  @ValidateIf((o) => o.accountType === 'personal')
  @IsString()
  fullName?: string;

  @ValidateIf((o) => o.accountType === 'personal')
  @IsString()
  dob?: string;

  @ValidateIf((o) => o.accountType === 'personal')
  @IsString()
  ssn?: string;

  @ValidateIf((o) => o.accountType === 'personal')
  @IsString()
  address?: string;

  // Business fields
  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  businessName?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  businessAddress?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  taxId?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsNumber()
  annualIncome?: number;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  depositAccountNumber?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  routingNumber?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsNumber()
  initialDeposit?: number;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  representativeName?: string;

  @ValidateIf((o) => o.accountType === 'business')
  @IsString()
  representativeSsn?: string;
}
