import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { supabaseAdmin } from '../../lib/supabase.client';

@Injectable()
export class TransactionsService {
  async findByUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    if (error) throw new BadRequestException('Could not fetch transactions');
    return data;
  }

  async transfer(
    userId: string,
    dto: { fromAccountId: string; toAccountNumber: string; amount: number },
  ) {
    // basic transfer flow
    const { data: fromAcc } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', dto.fromAccountId)
      .single();
    if (!fromAcc) throw new NotFoundException('Source account not found');
    if (fromAcc.user_id !== userId) throw new BadRequestException('Unauthorized');
    if (fromAcc.balance < dto.amount) throw new BadRequestException('Insufficient funds');

    // deduct and credit in a transaction block
    const { error } = await supabaseAdmin.rpc('transfer_funds', {
      from_id: dto.fromAccountId,
      to_account_number: dto.toAccountNumber,
      amount: dto.amount,
    });
    if (error) throw new BadRequestException('Transfer failed');

    // insert transaction record
    await supabaseAdmin
      .from('transactions')
      .insert([
        {
          account_id: dto.fromAccountId,
          type: 'transfer',
          amount: dto.amount,
          recipient_account: dto.toAccountNumber,
          status: 'completed',
        },
      ]);
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'transfer', user_id: userId, ip_address: null }]);

    return { success: true };
  }

  async deposit(userId: string, dto: { accountId: string; amount: number }) {
    const { data: acc } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', dto.accountId)
      .single();
    if (!acc) throw new NotFoundException('Account not found');
    if (acc.user_id !== userId) throw new BadRequestException('Unauthorized');
    const { error } = await supabaseAdmin
      .from('accounts')
      .update({ balance: (acc.balance || 0) + dto.amount })
      .eq('id', dto.accountId);
    if (error) throw new BadRequestException('Deposit failed');
    await supabaseAdmin
      .from('transactions')
      .insert([
        { account_id: dto.accountId, type: 'deposit', amount: dto.amount, status: 'completed' },
      ]);
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'deposit', user_id: userId, ip_address: null }]);
    return { success: true };
  }

  async withdraw(userId: string, dto: { accountId: string; amount: number }) {
    const { data: acc } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', dto.accountId)
      .single();
    if (!acc) throw new NotFoundException('Account not found');
    if (acc.user_id !== userId) throw new BadRequestException('Unauthorized');
    if (acc.balance < dto.amount) throw new BadRequestException('Insufficient funds');
    const { error } = await supabaseAdmin
      .from('accounts')
      .update({ balance: (acc.balance || 0) - dto.amount })
      .eq('id', dto.accountId);
    if (error) throw new BadRequestException('Withdraw failed');
    await supabaseAdmin
      .from('transactions')
      .insert([
        { account_id: dto.accountId, type: 'withdrawal', amount: dto.amount, status: 'completed' },
      ]);
    await supabaseAdmin
      .from('audit_logs')
      .insert([{ action: 'withdraw', user_id: userId, ip_address: null }]);
    return { success: true };
  }
}
