import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(@InjectRepository(Transaction) private txs: Repository<Transaction>) {}
  findRecent() { return this.txs.find({ take: 50, order: { createdAt: 'DESC' } }); }
}
