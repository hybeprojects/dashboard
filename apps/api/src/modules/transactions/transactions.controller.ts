import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../../security/jwt.guard';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly svc: TransactionsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: any) {
    return this.svc.findByUser(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  transfer(@Req() req: any, @Body() dto: CreateTransferDto) {
    return this.svc.transfer(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  deposit(@Req() req: any, @Body() dto: CreateDepositDto) {
    return this.svc.deposit(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('withdraw')
  withdraw(@Req() req: any, @Body() dto: CreateWithdrawalDto) {
    return this.svc.withdraw(req.user.sub, dto);
  }
}
