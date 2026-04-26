use anchor_lang::prelude::*;
use crate::state::Group;
use crate::errors::FundwiseError;

/// Seeds for Group PDA: ["group", group_code.as_bytes()]
pub fn get_group_seeds<'a>(group_code: &'a str) -> [&'a [u8]; 2] {
    [b"group", group_code.as_bytes()]
}

#[derive(Accounts)]
#[instruction(group_code: String, stablecoin_mint: Pubkey)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub payer: Signer<'info>, // pays for group account rent

    #[account(
        init,
        seeds = get_group_seeds(group_code.as_str()),
        bump,
        payer = payer,
        space = 8 + Group::INIT_SPACE
    )]
    pub group: Account<'info, Group>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateGroup>,
    group_code: String,
    stablecoin_mint: Pubkey,
) -> Result<()> {
    // ---- CHECKS ----
    // Code length: 4-10 chars (enforced by #[account] init space? No, custom)
    if group_code.len() < 4 || group_code.len() > 10 {
        return err!(FundwiseError::InvalidCodeLength);
    }
    // Ensure uppercase alphanumeric
    if !group_code.chars().all(|c| c.is_ascii_uppercase() && c.is_alphanumeric()) {
        return err!(FundwiseError::InvalidCodeLength);
    }

    // Reentrancy guard (belt-and-suspenders)
    // No CPI in this instruction, but check anyway for consistency
    // assert_not_reentrant(ctx)?; // optional; no sysvar

    // ---- EFFECTS ----
    let group = &mut ctx.accounts.group;
    let clock = Clock::get()?;

    group.code = group_code;
    group.stablecoin_mint = stablecoin_mint;
    group.created_by = ctx.accounts.payer.key();
    group.created_at = clock.unix_timestamp;
    group.member_count = 1; // creator is first member (creator implicitly joins? We'll auto-join later via separate instruction; keep 0 for now to require explicit join)
    // For now: creator not auto member; they must join separately. Keep 0.
    group.member_count = 0;
    group.expense_count = 0;
    group.total_settled_volume = 0;
    group.mode = crate::state::GroupMode::Split;
    group.bump = *ctx.bumps.get("group").unwrap();

    // Emit event
    emit!(GroupCreated {
        group: group.key(),
        code: group_code,
        creator: ctx.accounts.payer.key(),
        mint: stablecoin_mint,
    });

    Ok(())
}
