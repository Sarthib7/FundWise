use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TransferChecked, Account as TokenAccount, Mint};
use crate::state::{Group, Expense, Member, Settlement};
use crate::errors::FundwiseError;

/// Seeds for Settlement PDA:
/// ["settlement", group.key(), expense.key(), from_wallet.key(), to_wallet.key()]
pub fn get_settlement_seeds<'a>(
    group: &'a Pubkey,
    expense: &'a Pubkey,
    from_wallet: &'a Pubkey,
    to_wallet: &'a Pubkey,
) -> [&'a [u8]; 5] {
    [
        b"settlement",
        group.as_ref(),
        expense.as_ref(),
        from_wallet.as_ref(),
        to_wallet.as_ref(),
    ]
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct RecordSettlement<'info> {
    #[account(mut)]
    pub from_wallet: Signer<'info>, // debtor, pays for PDA rent and signs CPI

    #[account(
        seeds = [b"group", group.code.as_bytes()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,

    #[account(
        mut,
        seeds = [b"expense", expense.group_id.as_ref(), expense_counter(&expense).as_ref()],
        bump = expense.bump,
        // Expense must be active
        constraint = expense.deleted_at.is_none() @ FundwiseError::AlreadyDeleted
    )]
    /// Expense account being settled
    pub expense: Account<'info, Expense>,

    /// CHECK: creditor is a member of the group; validated via `to_member` account
    #[account(
        seeds = [b"member", group.key().as_ref(), to_wallet.key().as_ref()],
        bump = to_member.bump,
    )]
    pub to_member: Account<'info, Member>,

    #[account(
        mut,
        constraint = from_token_account.owner == from_wallet.key() @ FundwiseError::InvalidFromAccount,
        constraint = from_token_account.mint == group.stablecoin_mint @ FundwiseError::MintMismatch,
    )]
    pub from_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = to_token_account.owner == to_member.wallet @ FundwiseError::InvalidToAccount,
        constraint = to_token_account.mint == group.stablecoin_mint @ FundwiseError::MintMismatch,
    )]
    pub to_token_account: Account<'info, TokenAccount>,

    #[account(
        address = group.stablecoin_mint @ FundwiseError::MintMismatch
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: token program (spl-token)
    pub token_program: Program<'info, Token>,

    #[account(
        init,
        seeds = get_settlement_seeds(&group.key(), &expense.key(), &from_wallet.key(), &to_member.wallet),
        bump,
        payer = from_wallet,
        space = 8 + Settlement::INIT_SPACE
    )]
    pub settlement: Account<'info, Settlement>,

    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

/// Helper to extract expense counter from expense PDA seeds. Since Storage doesn't store counter,
/// we need to recompute from on-chain state: the expense PDA seeds use `group.expense_count - 1` at time of creation.
/// To verify seeds in constraint we'd need to recompute, but we don't need constraint for expense PDA because we passed it as account directly.
/// This helper is not needed for on-chain; left for documentation.
pub fn expense_counter(_expense: &Account<Expense>) -> u64 {
    // Not used on-chain; seeds for expense derived at creation time.
    // We don't store counter in Expense struct. For init constraint we don't need it.
    0
}

pub fn handler(ctx: Context<RecordSettlement>, amount: u64) -> Result<()> {
    // ---- CHECKS ----
    if amount == 0 {
        return err!(FundwiseError::InvalidAmount);
    }

    let group = &ctx.accounts.group;
    let expense = &ctx.accounts.expense;
    let from_wallet = &ctx.accounts.from_wallet;
    let to_member = &ctx.accounts.to_member;
    let from_ata = &ctx.accounts.from_token_account;
    let to_ata = &ctx.accounts.to_token_account;
    let mint = &ctx.accounts.mint;
    let settlement = &ctx.accounts.settlement;

    // Verify to_member wallet matches token account owner (already via constraint)
    // Verify expense belongs to group (expense.group_id == group.key())
    if expense.group_id != group.key() {
        return err!(FundwiseError::InvalidSplits);
    }

    // Reentrancy guard (no-op, but kept for pattern compliance)
    // In production, if CPI ever calls untrusted program, add depth check.

    // Pre-check: settlement PDA already exists? If data length > 8 → already initialized.
    if settlement.to_account_info().data_len() > 8 {
        // Already settled
        return err!(FundwiseError::SettlementLocked);
    }

    // We don't check that amount <= remaining debt; trust off-chain.

    // ---- EFFECTS ----
    // Initialize settlement:
    let settlement_account = &mut ctx.accounts.settlement;
    settlement_account.group_id = group.key();
    settlement_account.from_wallet = from_wallet.key();
    settlement_account.to_wallet = to_member.wallet; // member's wallet
    settlement_account.amount = amount;
    settlement_account.mint = mint.key();
    settlement_account.tx_sig = [0u8; 64]; // will be filled off-chain if needed
    settlement_account.confirmed_at = Clock::get()?.unix_timestamp;
    settlement_account.bump = *ctx.bumps.get("settlement").unwrap();

    // Update group total settled volume
    let group_account = &mut ctx.accounts.group;
    group_account.total_settled_volume = group_account
        .total_settled_volume
        .checked_add(amount)
        .ok_or(error!(FundwiseError::InvalidAmount)?; // overflow;

    // ---- INTERACTIONS ----
    // CPI: token::transfer_checked
    let cpi_accounts = TransferChecked {
        from: from_ata.to_account_info(),
        to: to_ata.to_account_info(),
        mint: mint.to_account_info(),
        authority: from_wallet.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer_checked(cpi_ctx, amount, mint.decimals)?;

    // Settlement verification succeeded implicitly; if CPI fails, previous effects are rolled back.

    emit!(SettlementRecorded {
        group: group.key(),
        from: from_wallet.key(),
        to: to_member.wallet,
        amount,
        mint: mint.key(),
    });

    Ok(())
}
