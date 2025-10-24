use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer, TokenAccount, Token, Mint};

declare_id!("GHuCcWrLwTwyPaP6gJT9WaRXPDDZ2Fqm24FdeTYx5mc6");

#[program]
pub mod token_transfer_pool {
    use super::*;

    // Transfer SPL tokens from user to pool address
    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        // Create transfer CPI context
        let cpi_accounts = Transfer {
            from: ctx.accounts.from_token_account.to_account_info(),
            to: ctx.accounts.to_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        // Perform the token transfer via CPI (Cross Program Invocation)
        token::transfer(
            CpiContext::new(cpi_program, cpi_accounts),
            amount,
        )?;

        // Emit event for successful transfer
        emit!(TokenTransferEvent {
            from: ctx.accounts.user.key(),
            to: ctx.accounts.to_token_account.key(),
            amount,
            mint: ctx.accounts.mint.key(),
        });

        Ok(())
    }

    // Initialize a new pool for a group
    pub fn initialize_pool(ctx: Context<InitializePool>, group_id: String) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.group_id = group_id;
        pool.authority = ctx.accounts.authority.key();
        pool.total_deposited = 0;
        pool.created_at = Clock::get()?.unix_timestamp;

        emit!(PoolInitializedEvent {
            pool: pool.key(),
            group_id: pool.group_id.clone(),
            authority: pool.authority,
        });

        Ok(())
    }
}

// Define the accounts required for this instruction
#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // The user sending tokens

    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>, // User's token account (source)

    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>, // Pool token account (destination)

    pub mint: Account<'info, Mint>, // The token mint being transferred

    pub token_program: Program<'info, Token>, // SPL Token program
}

// Define the accounts required for pool initialization
#[derive(Accounts)]
#[instruction(group_id: String)]
pub struct InitializePool<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 8 + 8 + 64, // discriminator + group_id + authority + total_deposited + created_at + group_id string
        seeds = [b"pool", group_id.as_bytes()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// Pool account structure
#[account]
pub struct Pool {
    pub group_id: String,
    pub authority: Pubkey,
    pub total_deposited: u64,
    pub created_at: i64,
}

// Events
#[event]
pub struct TokenTransferEvent {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
}

#[event]
pub struct PoolInitializedEvent {
    pub pool: Pubkey,
    pub group_id: String,
    pub authority: Pubkey,
}

