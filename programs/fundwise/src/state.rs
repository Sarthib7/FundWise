
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Group {
    #[max_len(10)]
    pub code: String,              // 6-10 chars uppercase invite code
    pub stablecoin_mint: Pubkey,
    pub created_by: Pubkey,
    pub created_at: i64,
    pub member_count: u32,
    pub expense_count: u64,        // sequential expense ID counter
    pub total_settled_volume: u64, // cumulative settled amount (smallest token unit)
    pub mode: GroupMode,
    pub bump: u8,                  // canonical bump
}

#[account]
#[derive(InitSpace)]
pub struct Member {
    pub group_id: Pubkey,
    pub wallet: Pubkey,
    #[max_len(32)]
    pub display_name: Option<String>, // max 32 chars; stored trimmed
    pub joined_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Expense {
    pub group_id: Pubkey,
    pub payer: Pubkey,
    pub created_by: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    #[max_len(100)]
    pub memo: String,            // max 100 chars
    #[max_len(20)]
    pub category: String,        // max 20 chars
    pub split_method: SplitMethod,
    pub created_at: i64,
    pub edited_at: Option<i64>,
    pub deleted_at: Option<i64>,
    #[max_len(20)]
    pub splits: Vec<SplitEntry>, // inline for MVP; limit 20
    pub bump: u8,
}

impl Expense {
    /// Calculate required account space including splits vector overhead
    pub fn space(split_count: usize) -> usize {
        8 +  // discriminator
        32 +  // group_id
        32 +  // payer
        32 +  // created_by
        8 +   // amount
        32 +  // mint
        4 + 100 +   // memo (4-byte len + max 100)
        4 + 20 +    // category (4-byte len + max 20)
        1 +   // split_method enum (1 byte)
        8 +   // created_at (i64)
        1 + 8 +  // edited_at (option tag + i64)
        1 + 8 +  // deleted_at (option tag + i64)
        4 +   // splits vec length u32
        split_count * std::mem::size_of::<SplitEntry>() +
        1     // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub struct SplitEntry {
    pub wallet: Pubkey,
    pub share: i64, // exact amount (base units) OR percentage (bp * 100) OR shares count
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

#[account]
#[derive(InitSpace)]
pub struct Settlement {
    pub group_id: Pubkey,
    pub from_wallet: Pubkey,
    pub to_wallet: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub tx_sig: [u8; 64],      // raw Solana tx signature (64 bytes)
    pub confirmed_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum GroupMode {
    Split,
    Fund,
}
