export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = 'checking' | 'savings' | 'credit' | 'loan'
export type TransferLimitTier = 'basic' | 'premium' | 'business' | 'enterprise'
export type CardType = 'debit' | 'credit' | 'virtual'
export type CardStatus = 'active' | 'inactive' | 'blocked' | 'expired'
export type KycStatus = 'pending' | 'verified' | 'rejected' | 'under_review'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type TransactionType = 'transfer' | 'deposit' | 'withdrawal' | 'payment' | 'fee'
export type UserType = 'individual' | 'business' | 'admin'
export type ProfileUpdateStatus = 'pending' | 'approved' | 'rejected'
export type DocumentType = 'passport' | 'drivers_license' | 'national_id'

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          owner_id: string
          account_number: string
          routing_number: string | null
          type: AccountType
          name: string
          balance: number
          available_balance: number
          currency: string | null
          status: string | null
          interest_rate: number | null
          overdraft_limit: number | null
          opened_at: string | null
          closed_at: string | null
          transfer_limit_tier: TransferLimitTier | null
          daily_transfer_limit: number | null
          monthly_transfer_limit: number | null
          used_daily_limit: number | null
          used_monthly_limit: number | null
          limit_reset_date: string | null
          credit_limit: number | null
          outstanding_balance: number | null
          minimum_payment: number | null
          payment_due_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          owner_id: string
          account_number: string
          routing_number?: string | null
          type: AccountType
          name: string
          balance?: number
          available_balance?: number
          currency?: string | null
          status?: string | null
          interest_rate?: number | null
          overdraft_limit?: number | null
          opened_at?: string | null
          closed_at?: string | null
          transfer_limit_tier?: TransferLimitTier | null
          daily_transfer_limit?: number | null
          monthly_transfer_limit?: number | null
          used_daily_limit?: number | null
          used_monthly_limit?: number | null
          limit_reset_date?: string | null
          credit_limit?: number | null
          outstanding_balance?: number | null
          minimum_payment?: number | null
          payment_due_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          owner_id?: string
          account_number?: string
          routing_number?: string | null
          type?: AccountType
          name?: string
          balance?: number
          available_balance?: number
          currency?: string | null
          status?: string | null
          interest_rate?: number | null
          overdraft_limit?: number | null
          opened_at?: string | null
          closed_at?: string | null
          transfer_limit_tier?: TransferLimitTier | null
          daily_transfer_limit?: number | null
          monthly_transfer_limit?: number | null
          used_daily_limit?: number | null
          used_monthly_limit?: number | null
          limit_reset_date?: string | null
          credit_limit?: number | null
          outstanding_balance?: number | null
          minimum_payment?: number | null
          payment_due_date?: string | null
          created_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          account_id: string
          card_id: string | null
          amount: number
          type: TransactionType
          status: TransactionStatus
          description: string
          merchant_name: string | null
          merchant_category: string | null
          reference: string | null
          authorization_code: string | null
          sender_account_id: string | null
          receiver_account_id: string | null
          receiver_name: string | null
          receiver_email: string | null
          running_balance: number
          location: Json | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          account_id: string
          card_id?: string | null
          amount: number
          type: TransactionType
          status?: TransactionStatus
          description: string
          merchant_name?: string | null
          merchant_category?: string | null
          reference?: string | null
          authorization_code?: string | null
          sender_account_id?: string | null
          receiver_account_id?: string | null
          receiver_name?: string | null
          receiver_email?: string | null
          running_balance: number
          location?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          account_id?: string
          card_id?: string | null
          amount?: number
          type?: TransactionType
          status?: TransactionStatus
          description?: string
          merchant_name?: string | null
          merchant_category?: string | null
          reference?: string | null
          authorization_code?: string | null
          sender_account_id?: string | null
          receiver_account_id?: string | null
          receiver_name?: string | null
          receiver_email?: string | null
          running_balance?: number
          location?: Json | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      transfers: {
        Row: {
          id: string
          sender_user_id: string
          receiver_user_id: string | null
          sender_account_id: string
          receiver_account_id: string | null
          receiver_email: string | null
          receiver_name: string | null
          amount: number
          description: string | null
          status: TransactionStatus
          fee: number | null
          transaction_reference: string | null
          scheduled_for: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          sender_user_id: string
          receiver_user_id?: string | null
          sender_account_id: string
          receiver_account_id?: string | null
          receiver_email?: string | null
          receiver_name?: string | null
          amount: number
          description?: string | null
          status?: TransactionStatus
          fee?: number | null
          transaction_reference?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          sender_user_id?: string
          receiver_user_id?: string | null
          sender_account_id?: string
          receiver_account_id?: string | null
          receiver_email?: string | null
          receiver_name?: string | null
          amount?: number
          description?: string | null
          status?: TransactionStatus
          fee?: number | null
          transaction_reference?: string | null
          scheduled_for?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone: string | null
          date_of_birth: string | null
          user_type: UserType
          address_line1: string | null
          address_line2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string | null
          ssn_encrypted: string | null
          kyc_status: KycStatus
          kyc_verified_at: string | null
          risk_level: string | null
          business_name: string | null
          business_tax_id: string | null
          business_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          date_of_birth?: string | null
          user_type: UserType
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          ssn_encrypted?: string | null
          kyc_status?: KycStatus
          kyc_verified_at?: string | null
          risk_level?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          business_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          date_of_birth?: string | null
          user_type?: UserType
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string | null
          ssn_encrypted?: string | null
          kyc_status?: KycStatus
          kyc_verified_at?: string | null
          risk_level?: string | null
          business_name?: string | null
          business_tax_id?: string | null
          business_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_transfer_with_limits: {
        Args: {
          from_account_id: string
          to_account_id: string
          amount: number
        }
        Returns: { success: boolean; message: string }
      }
    }
    Enums: {
      account_type: AccountType
      transfer_limit_tier: TransferLimitTier
      card_type: CardType
      card_status: CardStatus
      kyc_status: KycStatus
      transaction_status: TransactionStatus
      transaction_type: TransactionType
      user_type: UserType
      profile_update_status: ProfileUpdateStatus
      document_type: DocumentType
    }
  }
}
