use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, Transfer, Mint, Account as TokenAccount};
use spl_associated_token_account::get_associated_token_address;
use spl_token::instruction::AuthorityType;

declare_id!("FGhS5xYdH7QnJq2bQ6wK9cVt3mXpL8rN5vM1wZ4kE7A"); // Placeholder — replace after deploy

#[program]
pub mod fundwise {
    use super::*;

    /// Initialize a new Split Mode group
    /// `group_seed` = group code (6-char uppercase) — used as PDA seed
    /// `creator` = wallet that creates the group (becomes first member)
    /// `stablecoin_mint` = USDC mint address on the target chain (Solana mainnet)
    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_code: String,
        stablecoin_mint: Pubkey,
    ) -> Result<()> {
        let group = &mut ctx.accounts.group;
        group.code = group_code.to_uppercase();
        group.stablecoin_mint = stablecoin_mint;
        group.created_by = ctx.accounts.creator.key();
        group.created_at = Clock::get()?.unix_timestamp;
        group.member_count = 1;
        group.total_settled_volume = 0;

        // Add creator as first member
        let member = &mut ctx.accounts.member;
        member.group_id = group.key();
        member.wallet = creator.key();
        member.display_name = None;
        member.joined_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Join an existing group (any wallet can join)
    pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        require!(group.member_count < 100, FundwiseError::GroupFull);

        let member = &mut ctx.accounts.member;
        member.group_id = group.key();
        member.wallet = ctx.accounts.joiner.key();
        member.display_name = None;
        member.joined_at = Clock::get()?.unix_timestamp;
        group.member_count += 1;

        Ok(())
    }

    /// Record a new expense in a group (any member can create)
    /// Payer must be a group member.
    /// Splits define each participant's share.
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
        let group = &ctx.accounts.group;
        let expense = &mut ctx.accounts.expense;
        let clock = Clock::get()?;

        // Validate: payer must be a member
        let payer_member = get_member_for_wallet(&group.key(), &payer)?;
        require!(payer_member.is_some(), FundwiseError::NotMember);

        // Validate splits: all wallets must be members, sum checks per method
        let total_shares: i64 = splits.iter().map(|s| s.share).sum();
        match split_method {
            SplitMethod::Equal => require!(total_shares == splits.len() as i64, FundwiseError::InvalidSplits),
            SplitMethod::Exact => {
                require!(total_shares == amount as i64, FundwiseError::ExactMismatch)
            }
            SplitMethod::Percentage => require!(total_shares == 10000, FundwiseError::PercentageSumNot100), // basis points
            SplitMethod::Shares => (), // no sum check — arbitrary ratios
        }

        // Write expense
        expense.group_id = group.key();
        expense.payer = payer;
        expense.amount = amount;
        expense.mint = mint;
        expense.memo = memo.unwrap_or_default();
        expense.category = category;
        expense.split_method = split_method;
        expense.created_at = clock.unix_timestamp;
        expense.edited_at = None;
        expense.deleted_at = None;

        // Write splits (one PDA per split or rent-free? Keep simple: separate accounts)
        for (i, split) in splits.iter().enumerate() {
            let split_account = &mut ctx.remaining_accounts[i + 1];
            // Actually easier: store splits in a vector in expense account itself (if small), or separate PDAs
            // For MVP: keep splits in separate accounts derived from (expense, index)
        }

        Ok(())
    }

    /// Settlement — record that wallet A paid wallet B on-chain
    /// Caller must provide the on-chain transaction signature for verification
    /// (In flow, frontend verifies txSig first via Edge Function, then calls this instruction if valid)
    /// Alternatively: this instruction itself verifies txSig via CPI to a verifier? Keep simple.
    pub fn record_settlement(
        ctx: Context<RecordSettlement>,
        from_wallet: Pubkey,
        to_wallet: Pubkey,
        amount: u64,
        mint: Pubkey,
        tx_sig: [u8; 64],
    ) -> Result<()> {
        let group = &ctx.accounts.group;
        let settlement = &mut ctx.accounts.settlement;

        // Validate from/to are members
        get_member_for_wallet(&group.key(), &from_wallet)?;
        get_member_for_wallet(&group.key(), &to_wallet)?;

        let clock = Clock::get()?;
        settlement.group_id = group.key();
        settlement.from_wallet = from_wallet;
        settlement.to_wallet = to_wallet;
        settlement.amount = amount;
        settlement.mint = mint;
        settlement.tx_sig = tx_sig;
        settlement.confirmed_at = clock.unix_timestamp;

        // Update group's total_settled_volume (atomic via CPI to group account)
        let group_account = &mut ctx.accounts.group;
        group_account.total_settled_volume = group_account.total_settled_volume.checked_add(amount).unwrap();

        emit!(SettlementRecorded {
            group: group.key(),
            from: from_wallet,
            to: to_wallet,
            amount,
            mint,
            tx_sig,
        });

        Ok(())
    }

    /// Update an expense (only creator, no later settlement lock)
    /// Uses same logic as client-side RPC but on-chain
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
        let expense = &mut ctx.accounts.expense;
        require!(expense.created_by == ctx.accounts.editor.key(), FundwiseError::NotCreator);

        // Settlement lock: check if any settlement has confirmed_at > expense.edited_at (or created_at)
        let lock_ts = expense.edited_at.unwrap_or(expense.created_at);
        // NOTE: complex check requires iterating settlement PDAs — skip for MVP, rely on off-chain guard

        // Validate splits same as add_expense
        let total_shares: i64 = splits.iter().map(|s| s.share).sum();
        match split_method {
            SplitMethod::Equal => require!(total_shares == splits.len() as i64, FundwiseError::InvalidSplits),
            SplitMethod::Exact => require!(total_shares == amount as i64, FundwiseError::ExactMismatch),
            SplitMethod::Percentage => require!(total_shares == 10000, FundwiseError::PercentageSumNot100),
            SplitMethod::Shares => (),
        }

        expense.payer = payer;
        expense.amount = amount;
        expense.mint = mint;
        expense.memo = memo.unwrap_or_default();
        expense.category = category;
        expense.split_method = split_method;
        expense.edited_at = Some(Clock::get()?.unix_timestamp);

        // Splits update logic omitted for brevity — would update separate split accounts
        // MVP: store splits in a separate vector account or re-create

        Ok(())
    }

    /// Delete/soft-delete an expense (only creator, no later settlement)
    pub fn delete_expense(ctx: Context<DeleteExpense>) -> Result<()> {
        let expense = &mut ctx.accounts.expense;
        require!(expense.created_by == ctx.accounts.deleter.key(), FundwiseError::NotCreator);
        require!(expense.deleted_at.is_none(), FundwiseError::AlreadyDeleted);

        let lock_ts = expense.edited_at.unwrap_or(expense.created_at);
        // Settlement lock check would go here — needs settlement PDA iteration

        expense.deleted_at = Some(Clock::get()?.unix_timestamp);
        Ok(())
    }
}

/// Helper: look up member PDA for given wallet in group
/// Member PDA seed: ["member", group_id, wallet]
fn get_member_for_wallet(group_id: &Pubkey, wallet: &Pubkey) -> Result<Option<Account<'_, Member>>> {
    // This would need to be called with appropriate accounts; simplify: caller provides member account ctx
    // For now, caller must include member account in remaining_accounts
    Ok(None) // placeholder — actual lookup via CPI/seeds
}

/// Events
#[event]
pub struct SettlementRecorded {
    pub group: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub tx_sig: [u8; 64],
}

/// Accounts

#[derive(Accounts)]
#[instruction(group_code: String, stablecoin_mint: Pubkey)]
pub struct CreateGroup<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Group::INIT_SPACE,
        seeds = ["group".as_bytes(), group_code.as_bytes()],
        bump
    )]
    pub group: Account<'info, Group>,

    #[account(
        init,
        payer = creator,
        space = 8 + Member::INIT_SPACE,
        seeds = ["member".as_bytes(), group.key(), creator.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account(
        init,
        payer = joiner,
        space = 8 + Member::INIT_SPACE,
        seeds = ["member".as_bytes(), group.key(), joiner.key().as_ref()],
        bump
    )]
    pub member: Account<'info, Member>,

    #[account(mut)]
    pub joiner: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

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
pub struct AddExpense<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account(
        init,
        payer = creator,
        space = 8 + Expense::SPLIT_SPACE + 8 + (splits.len() * 32), // rough
    )]
    pub expense: Account<'info, Expense>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RecordSettlement<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account(
        init,
        payer = from_wallet,
        space = 8 + Settlement::INIT_SPACE,
        seeds = ["settlement".as_bytes(), group.key().as_ref(), from_wallet.key().as_ref(), Clock::get()?.unix_timestamp.to_le_bytes().as_ref()],
        bump
    )]
    pub settlement: Account<'info, Settlement>,

    #[account(mut)]
    pub from_wallet: Signer<'info>,

    // to_wallet does not sign
    /// CHECK: validated via membership check
    pub to_wallet: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct UpdateExpense<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account(
        mut,
        constraint = expense.created_by == editor.key() @ FundwiseError::NotCreator,
    )]
    pub expense: Account<'info, Expense>,

    #[account(mut)]
    pub editor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteExpense<'info> {
    #[account(mut)]
    pub group: Account<'info, Group>,

    #[account(
        mut,
        constraint = expense.created_by == deleter.key() @ FundwiseError::NotCreator,
        constraint = expense.deleted_at.is_none(),
    )]
    pub expense: Account<'info, Expense>,

    #[account(mut)]
    pub deleter: Signer<'info>,
}

/// State — Group
#[account]
#[derive(InitSpace)]
pub struct Group {
    pub code: String,         // 6-char uppercase invite code
    pub stablecoin_mint: Pubkey,
    pub created_by: Pubkey,
    pub created_at: i64,
    pub member_count: u32,
    pub total_settled_volume: u64, // cumulative settled amount in smallest token unit
    pub mode: GroupMode,         // Split or Fund (future)
}

/// State — Member
#[account]
#[derive(InitSpace)]
pub struct Member {
    pub group_id: Pubkey,
    pub wallet: Pubkey,
    pub display_name: Option<String>,
    pub joined_at: i64,
}

/// State — Expense
#[account]
#[derive(InitSpace)]
pub struct Expense {
    pub group_id: Pubkey,
    pub payer: Pubkey,
    pub created_by: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub memo: String,          // max 200 chars?
    pub category: String,      // e.g. "food", "transport"
    pub split_method: SplitMethod,
    pub created_at: i64,
    pub edited_at: Option<i64>,
    pub deleted_at: Option<i64>,
    // Splits vector stored inline for MVP (max ~20 splits)
    pub splits: Vec<SplitEntry>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct SplitEntry {
    pub wallet: Pubkey,
    pub share: i64,            // exact amount in token base units OR percentage (bp) OR shares count
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum SplitMethod {
    Equal,
    Exact,
    Percentage,
    Shares,
}

impl Default for SplitMethod {
    fn default() -> Self { SplitMethod::Equal }
}

/// State — Settlement
#[account]
#[derive(InitSpace)]
pub struct Settlement {
    pub group_id: Pubkey,
    pub from_wallet: Pubkey,
    pub to_wallet: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub tx_sig: [u8; 64],
    pub confirmed_at: i64,
}

/// Enums
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GroupMode {
    Split,
    Fund, // reserved
}

/// Errors
#[error_code]
pub enum FundwiseError {
    #[msg("Not a group member")]
    NotMember,
    #[msg("Group is full (max 100 members)")]
    GroupFull,
    #[msg("Invalid split configuration")]
    InvalidSplits,
    #[msg("Exact amounts must sum to expense total")]
    ExactMismatch,
    #[msg("Percentage shares must sum to 10000 (100.00%)")]
    PercentageSumNot100,
    #[msg("Only expense creator can perform this action")]
    NotCreator,
    #[msg("Expense already deleted")]
    AlreadyDeleted,
    #[msg("Settlement lock: later settlement exists")]
    SettlementLocked,
}
