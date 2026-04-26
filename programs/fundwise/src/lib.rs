use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, Mint, Account as TokenAccount, transfer_checked};
use spl_associated_token_account::get_associated_token_address;

mod state;
mod instructions;
mod errors;

use instructions::*;
use errors::*;

declare_id!("Ai2w51mduD8GjMamzkG17EUQzrELxEmWmKX3GDa2V99r"); // Placeholder — replace after first deploy

#[program]
pub mod fundwise {
    use super::*;

    pub fn create_group(ctx: Context<CreateGroup>, group_code: String, stablecoin_mint: Pubkey) -> Result<()> {
        instructions::create_group(ctx, group_code, stablecoin_mint)
    }

    pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
        instructions::join_group(ctx)
    }

    pub fn add_expense(
        ctx: Context<AddExpense>,
        payer: Pubkey,
        amount: u64,
        mint: Pubkey,
        memo: Option<String>,
        category: String,
        split_method: SplitMethod,
        splits: Vec<SplitEntry>,
    ) -> Result<()> {
        instructions::add_expense(ctx, payer, amount, mint, memo, category, split_method, splits)
    }

    pub fn update_expense(
        ctx: Context<UpdateExpense>,
        payer: Pubkey,
        amount: u64,
        mint: Pubkey,
        memo: Option<String>,
        category: String,
        split_method: SplitMethod,
        splits: Vec<SplitEntry>,
    ) -> Result<()> {
        instructions::update_expense(ctx, payer, amount, mint, memo, category, split_method, splits)
    }

    pub fn delete_expense(ctx: Context<DeleteExpense>) -> Result<()> {
        instructions::delete_expense(ctx)
    }

    pub fn record_settlement(
        ctx: Context<RecordSettlement>,
        from_wallet: Pubkey,
        to_wallet: Pubkey,
        amount: u64,
        mint: Pubkey,
    ) -> Result<()> {
        instructions::record_settlement(ctx, from_wallet, to_wallet, amount, mint)
    }
}

// ============ EVENTS ============

#[event]
pub struct GroupCreated {
    pub group: Pubkey,
    pub code: String,
    pub creator: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct MemberJoined {
    pub group: Pubkey,
    pub wallet: Pubkey,
}

#[event]
pub struct ExpenseCreated {
    pub group: Pubkey,
    pub expense: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
}

#[event]
pub struct ExpenseUpdated {
    pub group: Pubkey,
    pub expense: Pubkey,
    pub editor: Pubkey,
}

#[event]
pub struct ExpenseDeleted {
    pub group: Pubkey,
    pub expense: Pubkey,
    pub deleter: Pubkey,
}

#[event]
pub struct SettlementRecorded {
    pub group: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
}

// Re-export state types for client use
pub use state::{Group, Member, Expense, Settlement, SplitEntry, SplitMethod, GroupMode};

