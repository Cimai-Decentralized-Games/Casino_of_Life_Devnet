use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount is too small")]
    DepositTooSmall,
    #[msg("Bet amount is too large")]
    BetTooLarge,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Exceeds liquidity limit")]
    ExceedsLiquidityLimit,
    #[msg("Bet is already settled")]
    BetAlreadySettled,
    #[msg("Invalid fight ID")]
    InvalidFightId,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient funds in the treasury")]
    InsufficientTreasuryFunds,
    #[msg("Insufficient funds in the SOL vault")]
    InsufficientSolVaultFunds,
    #[msg("Invalid transfer amount")]
    InvalidTransferAmount,
    #[msg("Treasury balance below minimum required")]
    TreasuryBalanceBelowMinimum,
    #[msg("Invalid bet state")]
    InvalidBetState,
    #[msg("Invalid odds")]
    InvalidOdds,
    #[msg("Invalid authority")]
    InvalidAuthority,
    #[msg("Calculation overflow")]
    CalculationOverflow,
    #[msg("Invalid account")]
    InvalidAccount,
    #[msg("Bet not settled")]
    BetNotSettled,
}