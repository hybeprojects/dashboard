import { Controller, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly svc: AccountsService) {}
  @Get() all() { return this.svc.findAll(); }
}
