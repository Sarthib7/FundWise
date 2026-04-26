use anchor_lang::prelude::*;
use crate::state::{Group, Member};
use crate::errors::FundwiseError;

/// Seeds for Member PDA: ["member", group.key().as_ref(), wallet.key().as_ref()]
pub fn get_member_seeds<'a>(
    group: &'a Pubkey,
    wallet: &'a Pubkey,
) -> [&'a [u8]; 3] {
    [b"member", group.as_ref(), wallet.as_ref()]
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub member_wallet: Signer<'info>, // the user joining

    #[account(
        seeds = [b"group", group.code.as_bytes()],
        bump = group.bump,
    )]
    pub group: Account<'info, Group>,

    #[account(
        init,
        seeds = get_member_seeds(&group.key(), &member_wallet.key()),
        bump,
        payer = member_wallet,
        space = 8 + Member::INIT_SPACE
    )]
    pub member: Account<'info, Member>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinGroup>) -> Result<()> {
    // ---- CHECKS ----
    let group = &ctx.accounts.group;

    // Check capacity
    if group.member_count >= 100 {
        return err!(FundwiseError::GroupFull);
    }

    // Check not already member (init would fail if member PDA exists)
    // We rely on anchor init duplicate error, but can pre-check data_len
    let member_data_len = ctx.accounts.member.to_account_info().data_len();
    if member_data_len > 8 {
        // Already initialized
        return err!(FundwiseError::NotMember); // or custom AlreadyMember
    }

    // ---- EFFECTS ----
    let member = &mut ctx.accounts.member;
    member.group_id = group.key();
    member.wallet = ctx.accounts.member_wallet.key();
    member.display_name = None;
    member.joined_at = Clock::get()?.unix_timestamp;
    member.bump = *ctx.bumps.get("member").unwrap();

    // Increment group member count
    let group = &mut ctx.accounts.group;
    group.member_count = group
        .member_count
        .checked_add(1)
        .ok_or(error!(FundwiseError::InvalidAmount)?; // overflow;

    emit!(MemberJoined {
        group: group.key(),
        wallet: ctx.accounts.member_wallet.key(),
    });

    Ok(())
}
