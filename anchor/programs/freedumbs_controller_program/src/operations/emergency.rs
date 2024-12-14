use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    treasury::{Treasury, HealthStatus},
    controller::Controller,
    market::MarketState,
};
use crate::errors::ErrorCode;
use crate::metrics::{ReserveMetricsCalculator, reserve::AdjustmentDirection};
use crate::math::{FixedPointCalculator, constants::*};

pub struct EmergencyOperation;

impl EmergencyOperation {
    pub fn execute_emergency_action(
        treasury: &mut Account<Treasury>,
        controller: &mut Account<Controller>,
        market: &Account<MarketState>,
        action_type: EmergencyActionType,
    ) -> Result<()> {
        // Validate emergency conditions first
        Self::validate_emergency_conditions(treasury, controller)?;

        match action_type {
            EmergencyActionType::FreezeTreasury => {
                Self::freeze_treasury(treasury)?;
            },
            EmergencyActionType::EmergencyRebalance => {
                Self::emergency_rebalance(treasury, market)?;
            },
            EmergencyActionType::AdjustParameters => {
                Self::adjust_emergency_parameters(controller)?;
            },
        }

        // Update timing
        treasury.timing.update(Clock::get()?.unix_timestamp as u64);

        Ok(())
    }

    pub fn validate_emergency_conditions(
        treasury: &Account<Treasury>,
        controller: &Account<Controller>,
    ) -> Result<()> {
        // Check emergency conditions
        require!(
            treasury.health_status == HealthStatus::Critical ||
            treasury.reserve_metrics.reserve_ratio < treasury.treasury_config.min_reserve_ratio,
            ErrorCode::EmergencyConditionsNotMet
        );

        // Check mode transition
        require!(
            treasury.operation_mode.can_transition_to(OperationMode::Emergency),
            ErrorCode::InvalidStateTransition
        );

        Ok(())
    }

    fn freeze_treasury(treasury: &mut Account<Treasury>) -> Result<()> {
        // Check current state
        require!(
            !treasury.is_frozen && !treasury.emergency_active,
            ErrorCode::InvalidStateTransition
        );

        // Transition to emergency mode
        treasury.operation_mode = treasury.operation_mode
            .transition_to(OperationMode::Emergency)?;
        
        treasury.is_frozen = true;
        treasury.emergency_active = true;
        
        Ok(())
    }

    fn emergency_rebalance(
        treasury: &mut Account<Treasury>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        // Check emergency mode
        require!(
            treasury.operation_mode.is_emergency(),
            ErrorCode::InvalidOperationMode
        );

        // Calculate target reserves with precision
        let target_reserves = FixedPointCalculator::multiply(
            market.current_price,
            treasury.treasury_config.target_reserve_ratio,
            PRICE_PRECISION
        )?;

        // Calculate adjustment
        let adjustment = ReserveMetricsCalculator::calculate_required_adjustment(
            treasury.reserve_metrics.total_reserves,
            target_reserves
        )?;

        // Check reserve ratio bounds
        let new_ratio = FixedPointCalculator::calculate_reserve_ratio(
            treasury.reserve_metrics.total_reserves,
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
        
        Ok(())
    }

    fn adjust_emergency_parameters(
        controller: &mut Account<Controller>,
    ) -> Result<()> {
        // Transition to emergency mode
        controller.controller_state.current_mode = controller
            .controller_state
            .current_mode
            .transition_to(OperationMode::Emergency)?;

        controller.timing.update(Clock::get()?.unix_timestamp as u64);
        
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum EmergencyActionType {
    FreezeTreasury,
    EmergencyRebalance,
    AdjustParameters,
}