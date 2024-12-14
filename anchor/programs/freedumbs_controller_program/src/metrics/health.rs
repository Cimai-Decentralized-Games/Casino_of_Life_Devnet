use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    agent::HealthStatus,
};
use crate::math::{FixedPointCalculator, RatioCalculator, constants::*};
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct HealthMetricsCalculator {
    pub price_stability_score: u64,
    pub reserve_ratio: u64,
    pub volatility: u64,
    pub time_window: u64,
}

impl HealthMetricsCalculator {
    pub fn calculate_price_stability(
        current_price: u64,
        target_price: u64,
        volatility: u64,
        time_window: u64
    ) -> Result<u64> {
        let price_deviation = FixedPointCalculator::calculate_deviation(
            current_price,
            target_price
        )?;

        FixedPointCalculator::calculate_stability_score(
            price_deviation,
            volatility,
            time_window
        )
    }

    pub fn determine_health_status(
        stability_score: u64,
        reserve_ratio: u64,
        thresholds: &HealthThresholds
    ) -> Result<HealthStatus> {
        if stability_score < thresholds.emergency_threshold || 
           reserve_ratio < thresholds.min_reserve_ratio {
            return Ok(HealthStatus::Emergency);
        }

        if stability_score < thresholds.warning_threshold ||
           reserve_ratio < thresholds.warning_reserve_ratio {
            return Ok(HealthStatus::Warning);
        }

        Ok(HealthStatus::Healthy)
    }

    pub fn recommend_operation_mode(
        health_status: HealthStatus,
        current_mode: OperationMode,
        stability_score: u64,
        thresholds: &HealthThresholds
    ) -> Result<OperationMode> {
        match health_status {
            HealthStatus::Emergency => {
                current_mode.transition_to(OperationMode::Emergency)
            },
            HealthStatus::Warning if current_mode == OperationMode::Normal => {
                current_mode.transition_to(OperationMode::Defensive)
            },
            HealthStatus::Healthy if current_mode == OperationMode::Emergency => {
                current_mode.transition_to(OperationMode::Recovery)
            },
            HealthStatus::Healthy if current_mode == OperationMode::Recovery && 
                stability_score > thresholds.recovery_threshold => {
                current_mode.transition_to(OperationMode::Normal)
            },
            _ => Ok(current_mode)
        }
    }

    pub fn calculate_health_metrics(
        &self,
        current_price: u64,
        target_price: u64,
        reserves: u64,
        total_supply: u64
    ) -> Result<(u64, u64)> {
        // Calculate price stability
        let stability_score = Self::calculate_price_stability(
            current_price,
            target_price,
            self.volatility,
            self.time_window
        )?;

        // Calculate reserve ratio
        let reserve_ratio = RatioCalculator::calculate_reserve_ratio(
            reserves,
            total_supply
        )?;

        Ok((stability_score, reserve_ratio))
    }

    pub fn new(
        price_stability_score: u64,
        reserve_ratio: u64,
        volatility: u64,
        time_window: u64,
    ) -> Self {
        Self {
            price_stability_score,
            reserve_ratio,
            volatility,
            time_window,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct HealthThresholds {
    pub emergency_threshold: u64,
    pub warning_threshold: u64,
    pub recovery_threshold: u64,
    pub min_reserve_ratio: u64,
    pub warning_reserve_ratio: u64,
}