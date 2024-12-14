use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    treasury::Treasury,
    market::MarketState,
    curve::Curve,
};
use crate::errors::ErrorCode;
use crate::metrics::ReserveMetricsCalculator;
use crate::math::FixedPointCalculator;
use crate::metrics::reserve::AdjustmentDirection;

pub struct RebalanceOperation;

impl RebalanceOperation {
    pub fn execute(
        treasury: &mut Account<Treasury>,
        market: &Account<MarketState>,
        curve: &Account<Curve>,
    ) -> Result<()> {
        // Validate conditions first
        Self::validate_conditions(treasury, market)?;

        // Calculate target reserves based on current market state
        let target_reserves = FixedPointCalculator::multiply(
            market.current_price,
            curve.current_supply,
            curve.reserve_ratio
        )?;

        // Calculate required adjustment
        let adjustment = ReserveMetricsCalculator::calculate_required_adjustment(
            treasury.reserve_metrics.total_reserves,
            target_reserves
        )?;

        // Calculate new reserves based on adjustment direction
        let new_reserves = match adjustment.direction {
            AdjustmentDirection::Increase => treasury.reserve_metrics.total_reserves
                .checked_add(adjustment.amount)
                .ok_or(ErrorCode::ArithmeticError)?,
            AdjustmentDirection::Decrease => treasury.reserve_metrics.total_reserves
                .checked_sub(adjustment.amount)
                .ok_or(ErrorCode::ArithmeticError)?,
        };

        // Check new reserve ratio bounds
        let new_ratio = FixedPointCalculator::calculate_reserve_ratio(
            new_reserves,
            treasury.reserve_metrics.target_reserves
        )?;

        require!(
            new_ratio >= treasury.treasury_config.min_reserve_ratio &&
            new_ratio <= treasury.treasury_config.max_reserve_ratio,
            ErrorCode::InvalidReserveRatio
        );

        // Update reserves using the adjustment from metrics::reserve::AdjustmentDirection
        treasury.update_reserves(
            adjustment.amount,
            adjustment.direction == AdjustmentDirection::Increase
        )?;

        // Update timing
        treasury.timing.update(Clock::get()?.unix_timestamp as u64);

        Ok(())
    }

    pub fn validate_conditions(
        treasury: &Account<Treasury>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        // Check operation mode
        require!(
            treasury.operation_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );

        // Check timing
        require!(
            treasury.timing.can_act(Clock::get()?.unix_timestamp as u64),
            ErrorCode::CooldownNotMet
        );

        // Check current reserve ratio
        let current_ratio = treasury.reserve_metrics.reserve_ratio;
        require!(
            current_ratio >= treasury.treasury_config.min_reserve_ratio &&
            current_ratio <= treasury.treasury_config.max_reserve_ratio,
            ErrorCode::InvalidReserveRatio
        );

        Ok(())
    }
}