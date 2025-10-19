import type { Accounts, Cards, KycDocuments, KycSubmissions, LargeTransactionDocs, LimitTiersConfig, LimitUpgradeRequests, Profiles, ProfilesPublic, Transactions, Transfers, UUID, Timestamp } from '../db-types';

// Standard Supabase JSON type
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TablesInsert<T> = Partial<T>;
export type TablesUpdate<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profiles;
        Insert: TablesInsert<Profiles>;
        Update: TablesUpdate<Profiles>;
        Relationships: [];
      };
      profiles_public: {
        Row: ProfilesPublic;
        Insert: TablesInsert<ProfilesPublic>;
        Update: TablesUpdate<ProfilesPublic>;
        Relationships: [];
      };
      accounts: {
        Row: Accounts;
        Insert: TablesInsert<Accounts>;
        Update: TablesUpdate<Accounts>;
        Relationships: [];
      };
      cards: {
        Row: Cards;
        Insert: TablesInsert<Cards>;
        Update: TablesUpdate<Cards>;
        Relationships: [];
      };
      transactions: {
        Row: Transactions;
        Insert: TablesInsert<Transactions>;
        Update: TablesUpdate<Transactions>;
        Relationships: [];
      };
      transfers: {
        Row: Transfers;
        Insert: TablesInsert<Transfers>;
        Update: TablesUpdate<Transfers>;
        Relationships: [];
      };
      kyc_documents: {
        Row: KycDocuments;
        Insert: TablesInsert<KycDocuments>;
        Update: TablesUpdate<KycDocuments>;
        Relationships: [];
      };
      kyc_submissions: {
        Row: KycSubmissions;
        Insert: TablesInsert<KycSubmissions>;
        Update: TablesUpdate<KycSubmissions>;
        Relationships: [];
      };
      limit_tiers_config: {
        Row: LimitTiersConfig;
        Insert: TablesInsert<LimitTiersConfig>;
        Update: TablesUpdate<LimitTiersConfig>;
        Relationships: [];
      };
      limit_upgrade_requests: {
        Row: LimitUpgradeRequests;
        Insert: TablesInsert<LimitUpgradeRequests>;
        Update: TablesUpdate<LimitUpgradeRequests>;
        Relationships: [];
      };
      large_transaction_docs: {
        Row: LargeTransactionDocs;
        Insert: TablesInsert<LargeTransactionDocs>;
        Update: TablesUpdate<LargeTransactionDocs>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      // enums used across tables
      user_type: Profiles['user_type'];
      account_type: Accounts['type'];
      transaction_type: Transactions['type'];
      transaction_status: NonNullable<Transactions['status']>;
      transfer_status: NonNullable<Transfers['status']>;
      kyc_status: NonNullable<Profiles['kyc_status']>;
      limit_tier: NonNullable<Accounts['transfer_limit_tier']>;
    };
    CompositeTypes: {};
  };
}

// Helper utility types similar to supabase typegen
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsertType<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdateType<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
