use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The provided collection ID does not match the expected collection.")]
    CollectionIdMismatch,
    #[msg("Invalid name length.")]
    InvalidNameLength,
    #[msg("Invalid symbol length.")]
    InvalidSymbolLength,
    #[msg("Unauthorized access.")]
    Unauthorized,
    #[msg("Insufficient funds.")]
    InsufficientFunds,
    #[msg("Metadata creation failed.")]
    MetadataCreationFailed,
    #[msg("Master edition creation failed.")]
    MasterEditionCreationFailed,
    #[msg("Invalid reinforcement learning strategy")]
    InvalidStrategy,
    #[msg("Collection mismatch")]
    CollectionMismatch,
    #[msg("Invalid account owner")]
    InvalidAccountOwner,
    #[msg("Invalid account size")]
    InvalidAccountSize,
}