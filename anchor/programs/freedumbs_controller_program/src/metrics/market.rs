use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct MarketMetricsCalculator;

impl MarketMetricsCalculator {
    pub fn calculate_volatility(
        price_history: &[u64],
        time_window: u64
    ) -> Result<u64> {
        let variance = Self::calculate_price_variance(price_history)?;
        FixedPointCalculator::annualize_volatility(
            variance,
            time_window,
            VOLATILITY_PRECISION
        )
    }

    pub fn calculate_liquidity_depth(
        reserve_amount: u64,
        market_cap: u64,
        current_price: u64
    ) -> Result<u64> {
        FixedPointCalculator::calculate_liquidity_depth(
            reserve_amount,
            current_price,
            market_cap
        )
    }

    pub fn calculate_market_impact(
        operation_size: u64,
        liquidity_depth: u64,
        slippage_factor: u64
    ) -> Result<u64> {
        FixedPointCalculator::calculate_market_impact(
            operation_size,
            liquidity_depth,
            slippage_factor
        )
    }

    fn calculate_price_variance(price_history: &[u64]) -> Result<u64> {
        if price_history.is_empty() {
            return Err(ErrorCode::InsufficientPriceHistory.into());
        }

        let mean = FixedPointCalculator::calculate_mean(price_history)?;
        FixedPointCalculator::calculate_variance(
            price_history,
            mean
        )
    }
}