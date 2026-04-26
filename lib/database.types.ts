export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string
          code: string
          name: string
          mode: "split" | "fund"
          stablecoin_mint: string
          created_by: string
          created_at: string
          funding_goal: number | null
          approval_threshold: number | null
          multisig_address: string | null
          treasury_address: string | null
        }
        Insert: {
          id?: string
          code?: string
          name: string
          mode?: "split" | "fund"
          stablecoin_mint: string
          created_by: string
          created_at?: string
          funding_goal?: number | null
          approval_threshold?: number | null
          multisig_address?: string | null
          treasury_address?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          mode?: "split" | "fund"
          stablecoin_mint?: string
          created_by?: string
          created_at?: string
          funding_goal?: number | null
          approval_threshold?: number | null
          multisig_address?: string | null
          treasury_address?: string | null
        }
      }
      members: {
        Row: {
          id: string
          group_id: string
          wallet: string
          display_name: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          wallet: string
          display_name?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          wallet?: string
          display_name?: string | null
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          payer: string
          created_by: string
          amount: number
          mint: string
          memo: string | null
          category: string
          split_method: "equal" | "exact" | "shares" | "percentage"
          created_at: string
          edited_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          payer: string
          created_by: string
          amount: number
          mint: string
          memo?: string | null
          category?: string
          split_method?: "equal" | "exact" | "shares" | "percentage"
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          payer?: string
          created_by?: string
          amount?: number
          mint?: string
          memo?: string | null
          category?: string
          split_method?: "equal" | "exact" | "shares" | "percentage"
          created_at?: string
          edited_at?: string | null
          deleted_at?: string | null
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          wallet: string
          share: number
        }
        Insert: {
          id?: string
          expense_id: string
          wallet: string
          share: number
        }
        Update: {
          id?: string
          expense_id?: string
          wallet?: string
          share?: number
        }
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_wallet: string
          to_wallet: string
          amount: number
          mint: string
          tx_sig: string
          confirmed_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_wallet: string
          to_wallet: string
          amount: number
          mint: string
          tx_sig: string
          confirmed_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          from_wallet?: string
          to_wallet?: string
          amount?: number
          mint?: string
          tx_sig?: string
          confirmed_at?: string
        }
      }
      contributions: {
        Row: {
          id: string
          group_id: string
          member_wallet: string
          amount: number
          mint: string
          tx_sig: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          member_wallet: string
          amount: number
          mint: string
          tx_sig: string
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          member_wallet?: string
          amount?: number
          mint?: string
          tx_sig?: string
          created_at?: string
        }
      }
      proposals: {
        Row: {
          id: string
          group_id: string
          proposer_wallet: string
          recipient_wallet: string
          amount: number
          mint: string
          memo: string | null
          status: "pending" | "approved" | "executed" | "rejected" | "cancelled"
          tx_sig: string | null
          created_at: string
          executed_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          proposer_wallet: string
          recipient_wallet: string
          amount: number
          mint: string
          memo?: string | null
          status?: "pending" | "approved" | "executed" | "rejected" | "cancelled"
          tx_sig?: string | null
          created_at?: string
          executed_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          proposer_wallet?: string
          recipient_wallet?: string
          amount?: number
          mint?: string
          memo?: string | null
          status?: "pending" | "approved" | "executed" | "rejected" | "cancelled"
          tx_sig?: string | null
          created_at?: string
          executed_at?: string | null
        }
      }
      proposal_approvals: {
        Row: {
          id: string
          proposal_id: string
          member_wallet: string
          approved_at: string
        }
        Insert: {
          id?: string
          proposal_id: string
          member_wallet: string
          approved_at?: string
        }
        Update: {
          id?: string
          proposal_id?: string
          member_wallet?: string
          approved_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      update_expense_with_splits: {
        Args: {
          p_expense_id: string
          p_actor_wallet: string
          p_payer: string
          p_amount: number
          p_mint: string
          p_memo: string | null
          p_category: string | null
          p_split_method: "equal" | "exact" | "shares" | "percentage"
          p_splits: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      group_mode: "split" | "fund"
      split_method: "equal" | "exact" | "shares" | "percentage"
      proposal_status: "pending" | "approved" | "executed" | "rejected" | "cancelled"
    }
  }
}
