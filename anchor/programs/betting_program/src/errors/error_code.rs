use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Account Already Initialized")]
    AccountAlreadyInitialized,

    #[msg("Not Initialized")]
    NotInitialized,


    #[msg("Invalid account data")]
    InvalidAccountData,
    
    #[msg("Calculation overflow occurred")]
    CalculationOverflow,
    
    #[msg("Invalid account provided")]
    InvalidAccount,

    #[msg("Invalid bettor")]
    InvalidBettor,

    #[msg("Bet Already Placed")]
    BetAlreadyPlaced,
    
    #[msg("Bet already settled")]
    BetAlreadySettled,
    
    #[msg("Bet not settled yet")]
    BetNotSettled,

    #[msg("Bet not found")]
    BetNotFound,
    
    #[msg("Invalid fight ID")]
    InvalidFightId,
    
    #[msg("Insufficient balance")]
    InsufficientBalance,
    
    #[msg("Swap amount too low")]
    SwapAmountTooLow,
    
    #[msg("Swap amount too high")]
    SwapAmountTooHigh,
    
    #[msg("No RAPR tokens to stake")]
    NoRaprToStake,

    #[msg("Invalid RAPR Multiplier")]
    InvalidRaprMultiplier,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Bet is to large")]
    BetTooLarge,

    #[msg("Invalid Amount")]
    InvalidAmount,

    #[msg("Invalid Owner")]
    InvalidOwner,

    #[msg("Invalid Treasury")]
    InvalidTreasury,

    #[msg("Program is Paused")]
    ProgramPaused,

    #[msg("Invalid Program ID")]
    InvalidProgramId,

    #[msg("Invalid Associated Token Account")]
    InvalidAssociatedTokenAccount,

    #[msg("Missing Account Bump")]
    MissingAccountBump,

    #[msg("Deposit amount is too low")]
    DepositAmountTooLow,

    #[msg("Deposit amount is too high")]
    DepositAmountTooHigh,

    #[msg("Invalid Odds")]
    InvalidOdds,

    #[msg("Insufficient SOL Balance")]
    InsufficientSolBalance,

    #[msg("Amount is too small")]
    AmountTooSmall,

    #[msg("Amount is too large")]
    AmountTooLarge,

    #[msg("Invalid Token Type")]
    InvalidTokenType,

    #[msg("Invalid Mint")]
    InvalidMint,
}
