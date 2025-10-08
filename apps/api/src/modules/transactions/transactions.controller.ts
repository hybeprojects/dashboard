import { Controller, Get } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}
  @Get('recent') recent() { return this.svc.findRecent(); }
}
