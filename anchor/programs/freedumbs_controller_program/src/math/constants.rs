// Precision constants
pub const FEE_PRECISION: u64 = 10_000;     // 100.00%
pub const SHARE_PRECISION: u64 = 10_000;   // 100.00%
pub const RATIO_PRECISION: u64 = 10_000;   // 100.00%
pub const PRICE_PRECISION: u64 = 1_000_000; // 6 decimals
pub const VOLATILITY_PRECISION: u64 = 1_000_000; // 6 decimals

// Calculation constants
pub const SECONDS_PER_DAY: i64 = 86_400;
pub const MAX_RATIO: i64 = 10_000;
pub const MIN_RATIO: i64 = 0;

pub const INITIAL_MINT_MULTIPLIER: u64 = 1000;
pub const INITIAL_BURN_MULTIPLIER: u64 = 1000;
pub const INITIAL_SLIPPAGE_MULTIPLIER: u64 = 100;
pub const INITIAL_FEE_MULTIPLIER: u64 = 300;