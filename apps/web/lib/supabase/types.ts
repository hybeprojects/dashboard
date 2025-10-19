export interface Account {
  id: string;
  type: string;
  accountNumber: string;
  balance: number;
}

export interface Transaction {
  id: string;
  description: string;
  createdAt: string;
  type: 'credit' | 'debit';
  amount: number;
}
