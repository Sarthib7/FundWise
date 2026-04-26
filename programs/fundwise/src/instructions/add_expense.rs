use anchor_lang::prelude::*;
use crate::state::{Group, Expense, Member, SplitEntry, SplitMethod};
use crate::errors::FundwiseError;

/// Seeds for Expense PDA: ["expense", group.key().as_ref(), expense_counter_bytes]
pub fn get_expense_seeds<'a>(
    group: &'a Pubkey,
    expense_count: u64,
) -> [&'a [u8]; 3] {
    let counter_bytes = expense_count.to_le_bytes();
    [b"expense", group.as_ref(), &counter_bytes]
}

#[derive(Accounts)]
#[instruction(payer: Pubkey, amount: u64, mint: Pubkey, memo: Option<String>, category: String, split_method: SplitMethod, splits: Vec<SplitEntry>)]
pub struct AddExpense<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // expense creator, must be group member

    #[account(
        seeds = [b"group", group.code.as_bytes()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,

    // Member account for payer
    #[account(
        seeds = [b"member", group.key().as_ref(), payer.key().as_ref()],
        bump = member.bump,
    )]
    pub member: Account<'info, Member>,

    #[account(
        init,
        seeds = get_expense_seeds(&group.key(), group.expense_count),
        bump,
        payer = payer,
        space = 8 + Expense::space(splits.len())
    )]
    pub expense: Account<'info, Expense>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<AddExpense>,
    payer: Pubkey,
    amount: u64,
    mint: Pubkey,
    memo: Option<String>,
    category: String,
    split_method: SplitMethod,
    splits: Vec<SplitEntry>,
) -> Result<()> {
    // ---- CHECKS ----
    if amount == 0 {
        return err!(FundwiseError::InvalidAmount);
    }
    if memo.as_ref().map_or(false, |m| m.len() > 100) {
        return err!(FundwiseError::MemoTooLong);
    }
    if category.len() > 20 {
        return err!(FundwiseError::CategoryTooLong);
    }
    if splits.len() > 20 {
        return err!(FundwiseError::TooManySplits);
    }

    // Validate splits according to method
    match split_method {
        SplitMethod::Exact => {
            let sum: i64 = splits.iter().map(|s| s.share).sum();
            if sum as u64 != amount {
                return err!(FundwiseError::ExactMismatch);
            }
        }
        SplitMethod::Percentage => {
            let sum: i64 = splits.iter().map(|s| s.share).sum();
            if sum != 10000 {
                return err!(FundwiseError::PercentageSumNot100);
            }
        }
        SplitMethod::Equal => {
            // splits length must be >0; shares ignored
            if splits.is_empty() {
                return err!(FundwiseError::InvalidSplits);
            }
        }
        SplitMethod::Shares => {
            // sum of shares can be arbitrary; individual share amounts derived later off-chain
            if splits.is_empty() {
                return err!(FundwiseError::InvalidSplits);
            }
        }
    }

    // Verify all split wallets are distinct? Not necessary.
    // Could verify that each split wallet is a member of group? Optional.

    let group = &ctx.accounts.group;
    let member = &ctx.accounts.member;

    // Ensure payer is the authority (signer already ctx.accounts.payer which matches member wallet? We'll check member.wallet == payer.key()
    if member.wallet != payer {
        return err!(FundwiseError::NotMember);
    }

    // Reentrancy guard (none here)

    // ---- EFFECTS ----
    let expense = &mut ctx.accounts.expense;
    let current_counter = group.expense_count;

    expense.group_id = group.key();
    expense.payer = payer;
    expense.created_by = payer;
    expense.amount = amount;
    expense.mint = mint;
    expense.memo = memo.unwrap_or_default();
    expense.category = category;
    expense.split_method = split_method;
    expense.created_at = Clock::get()?.unix_timestamp;
    expense.edited_at = None;
    expense.deleted_at = None;
    expense.splits = splits;
    expense.bump = *ctx.bumps.get("expense").unwrap();

    // Increment group expense_count
    let group = &mut ctx.accounts.group;
    group.expense_count = group
        .expense_count
        .checked_add(1)
        .ok_or(error!(FundwiseError::InvalidAmount)?; // overflow

    emit!(ExpenseCreated {
        group: group.key(),
        expense: expense.key(),
        payer,
        amount,
        mint,
    });

    Ok(())
}
