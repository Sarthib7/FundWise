
use anchor_lang::prelude::*;

#[error_code]
pub enum FundwiseError {
    #[msg("Invalid group code length (4-10 chars)")]
    InvalidCodeLength,
    #[msg("Payer not a group member")]
    NotMember,
    #[msg("Group is full (max 100 members)")]
    GroupFull,
    #[msg("Invalid split configuration")]
    InvalidSplits,
    #[msg("Exact amounts must sum to expense total")]
    ExactMismatch,
    #[msg("Percentage shares must sum to 10000 (100.00%)")]
    PercentageSumNot100,
    #[msg("Expense amount must be positive")]
    InvalidAmount,
    #[msg("Only expense creator can perform this action")]
    NotCreator,
    #[msg("Expense already deleted")]
    AlreadyDeleted,
    #[msg("Settlement lock: this edge has already been settled")]
    SettlementLocked,
    #[msg("Settlement verification failed")]
    SettlementVerificationFailed,
    #[msg("From wallet does not own source token account")]
    InvalidFromAccount,
    #[msg("To wallet does not own destination token account")]
    InvalidToAccount,
    #[msg("Token mint does not match group's stablecoin")]
    MintMismatch,
    #[msg("Insufficient token balance for settlement")]
    InsufficientBalance,
    #[msg("Memo too long (max 100 chars)")]
    MemoTooLong,
    #[msg("Category too long (max 20 chars)")]
    CategoryTooLong,
    #[msg("Too many splits (max 20 per expense)")]
    TooManySplits,
    #[msg("Reentrant call detected")]
    ReentrantCall,
}
