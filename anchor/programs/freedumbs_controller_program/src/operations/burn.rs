use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,  
    treasury::Treasury,
    curve::Curve,
    market::MarketState,
};
use crate::errors::ErrorCode;
use crate::math::FixedPointCalculator;

pub struct BurnOperation;

impl BurnOperation {
    pub fn execute(
        treasury: &mut Account<Treasury>,
        curve: &Account<Curve>,
        market: &mut Account<MarketState>,
        amount: u64,
    ) -> Result<u64> {
        // Validate conditions first
        Self::validate_conditions(treasury, curve, market)?;

        // Check amount bounds
        require!(
            amount >= market.limits.min_trade_size &&
            amount <= market.limits.max_trade_size,
            ErrorCode::InvalidAmount
        );

        // Calculate burn amount using curve
        let burn_amount = FixedPointCalculator::calculate_burn_amount(
            amount,
            curve.rates.burn_multiplier,
            curve.slope,
            market.current_price,
            curve.target_price
        )?;

        // Calculate market impact
        let market_impact = FixedPointCalculator::calculate_market_impact(
            burn_amount,
            market.metrics.liquidity.value,
            curve.rates.slippage_multiplier
        )?;

        // Check price impact
        require!(
            market_impact <= curve.rates.fee_multiplier,
            ErrorCode::ExcessivePriceImpact
        );

        // Check reserves after burn
        let new_reserves = treasury.reserve_metrics.total_reserves
            .checked_sub(burn_amount)
            .ok_or(ErrorCode::ArithmeticError)?;

        require!(
            new_reserves >= treasury.reserve_metrics.minimum_reserves,
            ErrorCode::InsufficientReserves
        );

        // Process burn operation
        treasury.update_reserves(burn_amount, false)?;

        // Update market metrics
        market.update_metrics(
            market_impact,
            amount,
            Clock::get()?.unix_timestamp.try_into().unwrap()
        )?;

        Ok(burn_amount)
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

        // Check reserve ratio
        let current_ratio = treasury.reserve_metrics.reserve_ratio;
        require!(
            current_ratio >= treasury.treasury_config.min_reserve_ratio &&
            current_ratio <= treasury.treasury_config.max_reserve_ratio,
            ErrorCode::InvalidReserveRatio
        );

        // Check timing
        require!(
            treasury.timing.can_act(Clock::get()?.unix_timestamp.try_into().unwrap()),
            ErrorCode::CooldownNotMet
        );

        Ok(())
    }
}