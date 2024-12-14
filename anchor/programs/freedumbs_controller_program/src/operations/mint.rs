use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    treasury::{Treasury, HealthStatus},
    curve::Curve,
    market::MarketState,
};
use crate::errors::ErrorCode;
use crate::math::FixedPointCalculator;

pub struct MintOperation;

impl MintOperation {
    pub fn execute(
        treasury: &mut Account<Treasury>,
        curve: &Account<Curve>,
        market: &mut Account<MarketState>,
        amount: u64,
    ) -> Result<u64> {
        // Validate conditions first
        Self::validate_conditions(treasury, curve, market)?;

        // Calculate mint amount using curve
        let mint_amount = FixedPointCalculator::calculate_mint_amount(
            amount,
            curve.rates.mint_multiplier,
            curve.slope,
            market.current_price,
            curve.target_price
        )?;

        // Check new reserve ratio
        let new_reserves = treasury.reserve_metrics.total_reserves
            .checked_add(mint_amount)
            .ok_or(ErrorCode::ArithmeticError)?;

        let new_ratio = FixedPointCalculator::calculate_reserve_ratio(
            new_reserves,
            treasury.reserve_metrics.target_reserves
        )?;

        require!(
            new_ratio >= treasury.treasury_config.min_reserve_ratio &&
            new_ratio <= treasury.treasury_config.max_reserve_ratio,
            ErrorCode::InvalidReserveRatio
        );

        // Calculate market impact
        let market_impact = FixedPointCalculator::calculate_market_impact(
            mint_amount,
            market.metrics.liquidity.value,
            curve.rates.slippage_multiplier
        )?;

        // Check price impact
        require!(
            market_impact <= curve.rates.fee_multiplier,
            ErrorCode::ExcessivePriceImpact
        );

        // Process mint operation
        treasury.update_reserves(mint_amount, true)?;

        // Update market metrics
        market.update_metrics(
            market_impact,
            amount,
            Clock::get()?.unix_timestamp.try_into().unwrap()
        )?;

        // Update treasury timing
        treasury.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());

        Ok(mint_amount)
    }

    pub fn validate_conditions(
        treasury: &Account<Treasury>,
        curve: &Account<Curve>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        // Check operation mode
        require!(
            treasury.operation_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );

        // Check health status
        require!(
            treasury.health_status != HealthStatus::Critical,
            ErrorCode::UnhealthyState
        );

        // Check market liquidity
        require!(
            market.metrics.liquidity.value >= market.limits.min_liquidity,
            ErrorCode::InsufficientLiquidity
        );

        // Check timing
        require!(
            treasury.timing.can_act(Clock::get()?.unix_timestamp.try_into().unwrap()),
            ErrorCode::CooldownNotMet
        );

        Ok(())
    }
}