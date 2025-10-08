import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(@InjectRepository(Account) private accounts: Repository<Account>) {}
  findAll() { return this.accounts.find(); }
}
