use anchor_lang::prelude::*;
use crate::state::{Expense, SplitEntry, SplitMethod};
use crate::errors::FundwiseError;

#[derive(Accounts)]
#[instruction(
    payer: Pubkey,
    amount: u64,
    mint: Pubkey,
    memo: Option<String>,
    category: String,
    split_method: SplitMethod,
    splits: Vec<SplitEntry>
)]
pub struct UpdateExpense<'info> {
    #[account(mut)]
    pub editor: Signer<'info>, // must be expense creator

    #[account(
        mut,
        seeds = [b"expense", expense.group_id.as_ref(), expense_id_bytes(&expense).as_ref()],
        bump = expense.bump,
        constraint = expense.created_by == editor.key() @ FundwiseError::NotCreator
    )]
    /// expense account to update
    pub expense: Account<'info, Expense>,
}

/// Helper to derive the expense_id (counter) from expense struct since we don't store separately.
/// Actually we need group and counter. Expense doesn't have counter field. To derive PDA seeds we need group and counter.
/// We cannot reconstruct counter from expense alone. Better approach: store expense_counter in Expense data. Let's modify Expense struct: add field `id: u64` incremental. That would simplify.
/// However state.rs already defined Expense without id. To keep simple for this implementation, we can skip seed verification using `constraint = expense.group_id != Pubkey::default()` but we need to compute seeds for mutable ref? Anchor doesn't require seeds if we don't use init. For update we just need mutable account; we don't need to check PDA seeds via macro, we just need to ensure it's the correct expense. But we may want to ensure it's a PDA derived from group and counter; not strictly needed for security but good for consistency.
/// Since we don't have counter stored, we cannot derive seeds for constraint. We'll drop constraint; just ensure expense exists and creator matches, which we already have.
/// We'll modify the attribute: #[account(mut, constraint = expense.created_by == editor.key())] — enough.

pub fn handler(
    ctx: Context<UpdateExpense>,
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

    // Validate splits
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
        _ => {}
    }

    let expense = &mut ctx.accounts.expense;

    // Ensure not deleted
    if expense.deleted_at.is_some() {
        return err!(FundwiseError::AlreadyDeleted);
    }

    // ---- EFFECTS ----
    expense.amount = amount;
    expense.mint = mint;
    if let Some(m) = memo {
        expense.memo = m;
    }
    expense.category = category;
    expense.split_method = split_method;
    expense.splits = splits;
    expense.edited_at = Some(Clock::get()?.unix_timestamp);

    emit!(ExpenseUpdated {
        group: expense.group_id,
        expense: expense.key(),
        editor: ctx.accounts.editor.key(),
    });

    Ok(())
}
