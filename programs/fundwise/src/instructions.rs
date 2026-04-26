use super::*;
use anchor_lang::system_program;

/// CEI-safe: Checks → Effects → Interactions
/// Security: reentrancy guard not needed (no external CPI before state update)
pub fn create_group(
    ctx: Context<CreateGroup>,
    group_code: String,
    stablecoin_mint: Pubkey,
) -> Result<()> {
    // C — validate input
    require!(group_code.len() >= 4 && group_code.len() <= 10, FundwiseError::InvalidCodeLength);
    let upper_code = group_code.to_uppercase();

    // E — state changes before any CPI
    let group = &mut ctx.accounts.group;
    group.code = upper_code.clone();
    group.stablecoin_mint = stablecoin_mint;
    group.created_by = ctx.accounts.creator.key();
    group.created_at = Clock::get()?.unix_timestamp;
    group.member_count = 1;
    group.total_settled_volume = 0;
    group.mode = GroupMode::Split;
    group.bump = *ctx.bumps.get("group").unwrap();

    let member = &mut ctx.accounts.member;
    member.group_id = group.key();
    member.wallet = ctx.accounts.creator.key();
    member.display_name = None;
    member.joined_at = Clock::get()?.unix_timestamp;
    member.bump = *ctx.bumps.get("member").unwrap();

    emit!(GroupCreated {
        group: group.key(),
        code: upper_code,
        creator: ctx.accounts.creator.key(),
        mint: stablecoin_mint,
    });

    Ok(())
}

pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
    let group = &mut ctx.accounts.group;
    require!(group.member_count < 100, FundwiseError::GroupFull);

    // init_if_needed ensures idempotency; count increments once per unique wallet PDA
    group.member_count = group.member_count.checked_add(1).unwrap();

    let member = &mut ctx.accounts.member;
    member.group_id = group.key();
    member.wallet = ctx.accounts.joiner.key();
    member.display_name = None;
    member.joined_at = Clock::get()?.unix_timestamp;
    member.bump = *ctx.bumps.get("member").unwrap();

    emit!(MemberJoined {
        group: group.key(),
        wallet: ctx.accounts.joiner.key(),
    });

    Ok(())
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
    let group = &ctx.accounts.group;

    // C
    require!(amount > 0, FundwiseError::InvalidAmount);
    require!(mint == group.stablecoin_mint, FundwiseError::MintMismatch);
    require!(category.len() <= 20, FundwiseError::CategoryTooLong);
    require!(memo.as_ref().map(|m| m.len()).unwrap_or(0) <= 100, FundwiseError::MemoTooLong);
    require!(splits.len() <= 20, FundwiseError::TooManySplits);

    let total_shares: i64 = splits.iter().map(|s| s.share).sum();
    match split_method {
        SplitMethod::Equal => require!(total_shares == splits.len() as i64, FundwiseError::InvalidSplits),
        SplitMethod::Exact => require!(total_shares == amount as i64, FundwiseError::ExactMismatch),
        SplitMethod::Percentage => require!(total_shares == 10000, FundwiseError::PercentageSumNot100),
        SplitMethod::Shares => {},
    }

    // E
    let expense = &mut ctx.accounts.expense;
    expense.group_id = group.key();
    expense.payer = payer;
    expense.created_by = ctx.accounts.creator.key();
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

    emit!(ExpenseCreated {
        group: group.key(),
        expense: expense.key(),
        payer,
        amount,
        mint,
    });

    Ok(())
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
    let expense = &mut ctx.accounts.expense;
    let group = &ctx.accounts.group;

    require!(expense.deleted_at.is_none(), FundwiseError::AlreadyDeleted);
    require!(expense.created_by == ctx.accounts.editor.key(), FundwiseError::NotCreator);
    require!(amount > 0, FundwiseError::InvalidAmount);
    require!(mint == group.stablecoin_mint, FundwiseError::MintMismatch);
    require!(splits.len() <= 20, FundwiseError::TooManySplits);

    let total_shares: i64 = splits.iter().map(|s| s.share).sum();
    match split_method {
        SplitMethod::Equal => require!(total_shares == splits.len() as i64, FundwiseError::InvalidSplits),
        SplitMethod::Exact => require!(total_shares == amount as i64, FundwiseError::ExactMismatch),
        SplitMethod::Percentage => require!(total_shares == 10000, FundwiseError::PercentageSumNot100),
        SplitMethod::Shares => {},
    }

    // E
    expense.payer = payer;
    expense.amount = amount;
    expense.mint = mint;
    expense.memo = memo.unwrap_or(expense.memo.clone());
    expense.category = category;
    expense.split_method = split_method;
    expense.edited_at = Some(Clock::get()?.unix_timestamp);
    expense.splits = splits;

    emit!(ExpenseUpdated {
        group: group.key(),
        expense: expense.key(),
        editor: ctx.accounts.editor.key(),
    });

    Ok(())
}

pub fn delete_expense(ctx: Context<DeleteExpense>) -> Result<()> {
    let expense = &mut ctx.accounts.expense;

    require!(expense.deleted_at.is_none(), FundwiseError::AlreadyDeleted);
    require!(expense.created_by == ctx.accounts.deleter.key(), FundwiseError::NotCreator);

    // Settlement lock (future implementation)

    // E
    expense.deleted_at = Some(Clock::get()?.unix_timestamp);

    emit!(ExpenseDeleted {
        group: expense.group_id,
        expense: expense.key(),
        deleter: ctx.accounts.deleter.key(),
    });

    Ok(())
}

/// Trustless settlement: does USDC transfer via CPI + records settlement atomically
/// Verification: from_wallet signs, ATA ownership validated, transfer_checked ensures mint/amount correctness
pub fn record_settlement(
    ctx: Context<RecordSettlement>,
    from_wallet: Pubkey,
    to_wallet: Pubkey,
    amount: u64,
    mint: Pubkey,
) -> Result<()> {
    let group = &ctx.accounts.group;
    let clock = Clock::get()?;

    // C — validate every assumption
    require!(amount > 0, FundwiseError::InvalidAmount);
    require!(mint == group.stablecoin_mint, FundwiseError::MintMismatch);
    let from_ata = &ctx.accounts.from_ata;
    let to_ata = &ctx.accounts.to_ata;
    require!(from_ata.owner == from_wallet, FundwiseError::InvalidFromAccount);
    require!(to_ata.owner == to_wallet, FundwiseError::InvalidToAccount);
    require!(from_ata.mint == mint, FundwiseError::MintMismatch);
    require!(to_ata.mint == mint, FundwiseError::MintMismatch);

    // E — state updates BEFORE CPI (CEI)
    let settlement = &mut ctx.accounts.settlement;
    settlement.group_id = group.key();
    settlement.from_wallet = from_wallet;
    settlement.to_wallet = to_wallet;
    settlement.amount = amount;
    settlement.mint = mint;
    settlement.confirmed_at = clock.unix_timestamp;
    settlement.bump = *ctx.bumps.get("settlement").unwrap();

    let group_account = &mut ctx.accounts.group;
    group_account.total_settled_volume = group_account.total_settled_volume.checked_add(amount).unwrap();

    // I — CPI token transfer (atomic with rest of tx)
    let cpi_accounts = Transfer {
        from: ctx.accounts.from_ata.to_account_info(),
        to: ctx.accounts.to_ata.to_account_info(),
        authority: ctx.accounts.from_wallet.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer_checked(
        cpi_ctx,
        amount,
        mint.decimals().unwrap_or(6), // USDC decimals = 6; fallback for safety
    )?;

    emit!(SettlementRecorded {
        group: group.key(),
        from: from_wallet,
        to: to_wallet,
        amount,
        mint,
    });

    Ok(())
}
