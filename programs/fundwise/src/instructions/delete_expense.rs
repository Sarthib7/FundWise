use anchor_lang::prelude::*;
use crate::state::Expense;
use crate::errors::FundwiseError;

#[derive(Accounts)]
pub struct DeleteExpense<'info> {
    #[account(mut)]
    pub deleter: Signer<'info>, // must be expense creator

    #[account(
        mut,
        constraint = expense.created_by == deleter.key() @ FundwiseError::NotCreator
    )]
    pub expense: Account<'info, Expense>,
}

pub fn handler(ctx: Context<DeleteExpense>) -> Result<()> {
    // ---- CHECKS ----
    // Already not deleted checked in constraint? No, we check here.
    let expense = &mut ctx.accounts.expense;
    if expense.deleted_at.is_some() {
        return err!(FundwiseError::AlreadyDeleted);
    }

    // ---- EFFECTS ----
    expense.deleted_at = Some(Clock::get()?.unix_timestamp);

    emit!(ExpenseDeleted {
        group: expense.group_id,
        expense: expense.key(),
        deleter: ctx.accounts.deleter.key(),
    });

    Ok(())
}
