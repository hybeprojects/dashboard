// This file is generated from your Supabase schema
// Do not edit manually — regenerate using scripts/generate-supabase-types.js

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string;
          account_number: string;
          routing_number: string | null;
          type: any;
          name: string;
          balance: number;
          available_balance: number;
          currency: string | null;
          status: string | null;
          interest_rate: number | null;
          overdraft_limit: number | null;
          opened_at: string | null;
          closed_at: string | null;
          transfer_limit_tier: any | null;
          daily_transfer_limit: number | null;
          monthly_transfer_limit: number | null;
          used_daily_limit: number | null;
          used_monthly_limit: number | null;
          limit_reset_date: string | null;
          credit_limit: number | null;
          outstanding_balance: number | null;
          minimum_payment: number | null;
          payment_due_date: string | null;
          created_at: string | null;
          owner_id: string;
        };
        Insert: Partial<Database['public']['Tables']['accounts']['Row']>;
        Update: Partial<Database['public']['Tables']['accounts']['Row']>;
      };
      kyc_submissions: {
        Row: {
          id: string;
          submission_id: string;
          user_id: string | null;
          email: string | null;
          full_name: string;
          dob: string | null;
          ssn_last4: string | null;
          address: string | null;
          open_savings: boolean | null;
          id_front_path: string | null;
          id_back_path: string | null;
          proof_path: string | null;
          status: string | null;
          review_note: string | null;
          created_at: string | null;
          reviewed_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['kyc_submissions']['Row']>;
        Update: Partial<Database['public']['Tables']['kyc_submissions']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          phone: string | null;
          date_of_birth: string | null;
          user_type: any;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          ssn_encrypted: string | null;
          kyc_status: any | null;
          kyc_verified_at: string | null;
          risk_level: string | null;
          business_name: string | null;
          business_tax_id: string | null;
          business_type: string | null;
          created_at: string | null;
          updated_at: string | null;
          is_admin: boolean;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      transactions: {
        Row: {
          id: string;
          account_id: string;
          card_id: string | null;
          amount: number;
          type: any;
          status: any | null;
          description: string;
          merchant_name: string | null;
          merchant_category: string | null;
          reference: string | null;
          authorization_code: string | null;
          sender_account_id: string | null;
          receiver_account_id: string | null;
          receiver_name: string | null;
          receiver_email: string | null;
          running_balance: number;
          location: string | null;
          metadata: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['transactions']['Row']>;
        Update: Partial<Database['public']['Tables']['transactions']['Row']>;
      };
    };
  };
}
