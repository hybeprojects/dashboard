export type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  userType: 'personal' | 'business';
  createdAt: string;
};

export type Account = {
  id: string;
  userId: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'business';
  balance: number;
  createdAt: string;
};

export type Transaction = {
  id: string;
  accountId: string;
  amount: number;
  type: 'debit' | 'credit';
  description?: string | null;
  createdAt: string;
  reference?: string | null;
};