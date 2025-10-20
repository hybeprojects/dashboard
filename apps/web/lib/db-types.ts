// Auto-generated types for Supabase tables (based on provided schema snapshot)
// Use these in the frontend to type Supabase responses.

export type UUID = string;
export type Timestamp = string; // ISO string

export interface Profiles {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  date_of_birth?: string | null; // date
  user_type: 'personal' | 'business';
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  ssn_encrypted?: string | null;
  kyc_status?: 'pending' | 'verified' | 'rejected' | 'under_review' | null;
  kyc_verified_at?: Timestamp | null;
  risk_level?: string | null;
  business_name?: string | null;
  business_tax_id?: string | null;
  business_type?: string | null;
  is_admin?: boolean | null;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}

export interface Accounts {
  id: UUID;
  user_id: UUID;
  account_number: string;
  routing_number?: string | null;
  type: 'checking' | 'savings' | 'business' | 'loan';
  name: string;
  balance: number;
  available_balance: number;
  currency?: string | null;
  status?: string | null;
  interest_rate?: number | null;
  overdraft_limit?: number | null;
  opened_at?: Timestamp | null;
  closed_at?: Timestamp | null;
  transfer_limit_tier?: 'basic' | 'standard' | 'premium' | 'unlimited' | null;
  daily_transfer_limit?: number | null;
  monthly_transfer_limit?: number | null;
  used_daily_limit?: number | null;
  used_monthly_limit?: number | null;
  limit_reset_date?: string | null; // date
  credit_limit?: number | null;
  outstanding_balance?: number | null;
  minimum_payment?: number | null;
  payment_due_date?: string | null; // date
  created_at?: Timestamp | null;
}

export interface Cards {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  card_number_encrypted: string;
  last_four_digits: string;
  card_holder_name: string;
  expiry_month: number;
  expiry_year: number;
  cvv_encrypted: string;
  type: 'debit' | 'credit' | 'virtual';
  status?: 'active' | 'inactive' | 'blocked' | 'expired' | null;
  is_virtual?: boolean | null;
  is_activated?: boolean | null;
  daily_limit?: number | null;
  monthly_limit?: number | null;
  issued_at?: Timestamp | null;
  activated_at?: Timestamp | null;
  credit_limit?: number | null;
  available_credit?: number | null;
  cash_advance_limit?: number | null;
  created_at?: Timestamp | null;
}

export interface Transactions {
  id: UUID;
  account_id: UUID;
  card_id?: UUID | null;
  amount: number;
  type: 'debit' | 'credit' | 'transfer' | 'payment' | 'fee';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | null;
  description: string;
  merchant_name?: string | null;
  merchant_category?: string | null;
  reference?: string | null;
  authorization_code?: string | null;
  sender_account_id?: UUID | null;
  receiver_account_id?: UUID | null;
  receiver_name?: string | null;
  receiver_email?: string | null;
  running_balance: number;
  location?: any | null;
  metadata?: any | null;
  created_at?: Timestamp | null;
}

export interface Transfers {
  id: UUID;
  sender_user_id: UUID;
  receiver_user_id?: UUID | null;
  sender_account_id: UUID;
  receiver_account_id?: UUID | null;
  receiver_email?: string | null;
  receiver_name?: string | null;
  amount: number;
  description?: string | null;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled' | null;
  fee?: number | null;
  transaction_reference?: string | null;
  scheduled_for?: Timestamp | null;
  completed_at?: Timestamp | null;
  created_at?: Timestamp | null;
}

export interface KycDocuments {
  id: UUID;
  user_id: UUID;
  document_type: 'id_card' | 'drivers_license' | 'passport' | 'utility_bill' | 'business_license';
  document_number?: string | null;
  front_image_url: string;
  back_image_url?: string | null;
  selfie_image_url?: string | null;
  verified?: boolean | null;
  verified_by?: UUID | null;
  verified_at?: Timestamp | null;
  rejection_reason?: string | null;
  created_at?: Timestamp | null;
}

export interface KycSubmissions {
  id: UUID;
  submission_id: UUID;
  user_id?: UUID | null;
  email?: string | null;
  full_name: string;
  dob?: string | null;
  ssn_last4?: string | null;
  address?: string | null;
  open_savings?: boolean | null;
  id_front_path?: string | null;
  id_back_path?: string | null;
  proof_path?: string | null;
  status?: string | null;
  review_note?: string | null;
  created_at?: Timestamp | null;
  reviewed_at?: Timestamp | null;
}

export interface LimitTiersConfig {
  tier: 'basic' | 'standard' | 'premium' | 'unlimited';
  daily_limit: number;
  monthly_limit: number;
  description: string;
  requires_verification?: boolean | null;
  min_balance_requirement?: number | null;
  created_at?: Timestamp | null;
}

export interface LimitUpgradeRequests {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  current_tier?: 'basic' | 'standard' | 'premium' | 'unlimited' | null;
  requested_tier?: 'basic' | 'standard' | 'premium' | 'unlimited' | null;
  requested_daily_limit?: number | null;
  requested_monthly_limit?: number | null;
  reason?: string | null;
  income_verification_url?: string | null;
  status?: 'pending' | 'approved' | 'rejected' | null;
  reviewed_by?: UUID | null;
  reviewed_at?: Timestamp | null;
  rejection_reason?: string | null;
  created_at?: Timestamp | null;
}

export interface LargeTransactionDocs {
  id: UUID;
  user_id: UUID;
  account_id: UUID;
  transaction_id?: UUID | null;
  transfer_id?: UUID | null;
  amount: number;
  document_type: string;
  document_url: string;
  description?: string | null;
  verified?: boolean | null;
  verified_by?: UUID | null;
  verified_at?: Timestamp | null;
  created_at?: Timestamp | null;
}

export interface ProfilesPublic {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
}

// Optionally export a DB mapping for convenience with supabase-js generic types
export interface AuditLogs {
  id: UUID;
  actor_id?: UUID | null;
  actor_email?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  changes?: any | null;
  ip?: string | null;
  user_agent?: string | null;
  metadata?: any | null;
  created_at?: Timestamp | null;
}

export interface CardAuthorizations {
  id: UUID;
  card_id: UUID;
  account_id: UUID;
  amount: number;
  merchant_name: string;
  merchant_category?: string | null;
  authorization_code: string;
  is_approved: boolean;
  decline_reason?: string | null;
  location?: any | null;
  created_at?: Timestamp | null;
}

export interface FaceVerificationSessions {
  id: UUID;
  user_id: UUID;
  session_token: string;
  verification_data?: any | null;
  success?: boolean | null;
  confidence_score?: number | null;
  attempts?: number | null;
  completed_at?: Timestamp | null;
  created_at?: Timestamp | null;
}

export interface PendingTransactions {
  id: UUID;
  account_id: UUID;
  card_id?: UUID | null;
  amount: number;
  type: string;
  description: string;
  merchant_name?: string | null;
  authorization_code: string;
  expires_at: Timestamp;
  created_at?: Timestamp | null;
}

export interface ProfileUpdateRequests {
  id: UUID;
  user_id: UUID;
  current_first_name?: string | null;
  current_last_name?: string | null;
  current_date_of_birth?: string | null;
  current_address_line1?: string | null;
  current_city?: string | null;
  current_state?: string | null;
  current_zip_code?: string | null;
  requested_first_name?: string | null;
  requested_last_name?: string | null;
  requested_date_of_birth?: string | null;
  requested_address_line1?: string | null;
  requested_city?: string | null;
  requested_state?: string | null;
  requested_zip_code?: string | null;
  supporting_docs_urls?: string[] | null;
  reason?: string | null;
  status?: string | null;
  reviewed_by?: UUID | null;
  reviewed_at?: Timestamp | null;
  rejection_reason?: string | null;
  created_at?: Timestamp | null;
  updated_at?: Timestamp | null;
}

export interface SecurityEvents {
  id: UUID;
  user_id?: UUID | null;
  event_type: string;
  severity?: string | null;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  location?: any | null;
  is_suspicious?: boolean | null;
  resolved?: boolean | null;
  resolved_at?: Timestamp | null;
  created_at?: Timestamp | null;
}

export interface Database {
  profiles: Profiles;
  accounts: Accounts;
  cards: Cards;
  transactions: Transactions;
  transfers: Transfers;
  kyc_documents: KycDocuments;
  kyc_submissions: KycSubmissions;
  limit_tiers_config: LimitTiersConfig;
  limit_upgrade_requests: LimitUpgradeRequests;
  large_transaction_docs: LargeTransactionDocs;
  audit_logs: AuditLogs;
  card_authorizations: CardAuthorizations;
  face_verification_sessions: FaceVerificationSessions;
  pending_transactions: PendingTransactions;
  profile_update_requests: ProfileUpdateRequests;
  security_events: SecurityEvents;
}
