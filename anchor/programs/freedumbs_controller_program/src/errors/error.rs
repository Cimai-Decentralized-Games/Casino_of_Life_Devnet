use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    // General Errors
    #[msg("Arithmetic operation failed")]
    ArithmeticError,
    #[msg("Invalid parameter value provided")]
    InvalidParameter,
    #[msg("Operation timeout exceeded")]
    Timeout,
    #[msg("Account not initialized")]
    NotInitialized,
    #[msg("Bump not found in seeds")]
    BumpNotFound,

    // Authorization Errors
    #[msg("Unauthorized agent type for this operation")]
    UnauthorizedAgentType,
    #[msg("Unauthorized agent for this action")]
    UnauthorizedAgent,
    #[msg("Unauthorized emergency action")]
    UnauthorizedEmergencyAction,
    #[msg("Invalid authority for this operation")]
    InvalidAuthority,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Invalid agent authority")]
    InvalidAgentAuthority,
    #[msg("Unauthorized authority")]
    UnauthorizedAuthority,
    #[msg("Already Initialized")]
    AlreadyInitialized,

    // Market State Errors
    #[msg("Market conditions too unstable for operation")]
    UnstableMarketConditions,
    #[msg("Market volatility exceeds threshold")]
    ExcessiveVolatility,
    #[msg("Insufficient market liquidity")]
    InsufficientLiquidity,
    #[msg("Market conditions not met for operation")]
    MarketConditionsNotMet,
    #[msg("Invalid market trend direction")]
    InvalidMarketTrend,
    #[msg("Invalid Market Relationship")]
    InvalidMarketRelationship,
    #[msg("Operation outside market hours")]
    OutsideMarketHours,
    #[msg("Market time out")]
    MarketTimeout,
    #[msg("Spread exceeds maximum allowed")]
    SpreadTooLarge,
    #[msg("Invalid price")]
    InvalidPrice,
    #[msg("Invalid trade limits")]
    InvalidTradeLimits,
    #[msg("Invalid Trade Size")]
    InvalidTradeSize,

    // Treasury Errors
    #[msg("Insufficient treasury reserves")]
    InsufficientReserves,
    #[msg("Invalid reserve ratio")]
    InvalidReserveRatio,
    #[msg("Reserve ratio change exceeds maximum allowed")]
    ExcessiveRatioChange,
    #[msg("Too early for fee distribution")]
    TooEarlyForDistribution,
    #[msg("Insufficient fees accumulated for distribution")]
    InsufficientFeesForDistribution,
    #[msg("Treasury Timeout")]
    TreasuryTimeout,
    #[msg("Treasury is frozen")]
    TreasuryFrozen,

    // Controller Errors
    #[msg("Invalid operation mode transition")]
    InvalidModeTransition,
    #[msg("Emergency mode active")]
    EmergencyModeActive,
    #[msg("Emergency conditions not met")]
    EmergencyConditionsNotMet,
    #[msg("Controller parameters out of bounds")]
    ControllerParameterOutOfBounds,
    #[msg("Controller not initialized")]
    ControllerNotInitialized,
    #[msg("Invalid operation mode")]
    InvalidOperationMode,

    // Token Operation Errors
    #[msg("Slippage exceeds maximum allowed")]
    SlippageExceeded,
    #[msg("Slippage too high for operation")]
    SlippageTooHigh,
    #[msg("Mint amount exceeds daily limit")]
    MintLimitExceeded,
    #[msg("Burn amount exceeds daily limit")]
    BurnLimitExceeded,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Excessive Price Impact")]
    ExcessivePriceImpact,

    // Agent Operation Errors
    #[msg("Invalid PID parameters")]
    InvalidPIDParameters,
    #[msg("Invalid action bounds")]
    InvalidActionBounds,
    #[msg("Invalid market analysis data")]
    InvalidMarketAnalysis,
    #[msg("Agent performance below threshold")]
    AgentPerformanceBelowThreshold,
    #[msg("Agent not active")]
    AgentNotActive,
    #[msg("Agent unhealthy")]
    AgentUnhealthy,
    #[msg("Invalid Amount")]
    InvalidAmount,

    // Security Errors
    #[msg("Invalid signature")]
    InvalidSignature,
    #[msg("Operation not allowed in current mode")]
    OperationNotAllowed,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Invalid transaction ordering")]
    InvalidTransactionOrder,
    #[msg("Transaction too soon")]
    TransactionTooSoon,
    #[msg("Cooldown period not met")]
    CooldownNotMet,
    #[msg("Operation Paused")]
    OperationPaused,

    // System State Errors
    #[msg("System paused")]
    SystemPaused,
    #[msg("Invalid system state transition")]
    InvalidStateTransition,
    #[msg("System upgrade required")]
    UpgradeRequired,
    #[msg("Invalid timestamp for operation")]
    InvalidTimestamp,
    #[msg("Unhealthy system state")]
    UnhealthyState,

    // Validation Errors
    #[msg("Price deviation exceeds allowed threshold")]
    PriceDeviationTooLarge,
    #[msg("Invalid relationship between accounts")]
    InvalidAccountRelationship,
    #[msg("Invalid confidence score provided")]
    InvalidConfidenceScore,
    #[msg("Bounds exceed limit")]
    BoundsExceedLimit,
    #[msg("Bounds below limit")]
    BoundsBelowLimit,
    #[msg("Invalid bounds provided")]
    InvalidBounds,
    #[msg("Rebalance not needed")]
    RebalanceNotNeeded,
    #[msg("Distribution not ready")]
    DistributionNotReady,
    #[msg("Insufficient fees")]
    InsufficientFees,
    #[msg("Controller unhealthy")]
    ControllerUnhealthy,
    #[msg("Invalid controller relationship")]
    InvalidControllerRelationship,
    #[msg("Invalid agent relationship")]
    InvalidAgentRelationship,
    #[msg("Operation modes misaligned")]
    OperationModesMisaligned,
    #[msg("Emergency state misaligned")]
    EmergencyStateMisaligned,

    // Calculation Errors
    #[msg("Invalid calculation parameters")]
    InvalidCalculation,
    #[msg("Division by zero attempted")]
    DivisionByZero,
    #[msg("Insufficient price history for calculation")]
    InsufficientPriceHistory,
    #[msg("Insufficient volume history for calculation")]
    InsufficientVolumeHistory,
    #[msg("Invalid fee rate provided")]
    InvalidFeeRate,
    #[msg("Invalid ratio value")]
    InvalidRatio,
}