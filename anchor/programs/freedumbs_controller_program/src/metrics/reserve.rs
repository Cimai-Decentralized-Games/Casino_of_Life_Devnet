use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct ReserveMetricsCalculator;

impl ReserveMetricsCalculator {
    pub fn calculate_reserve_ratio(
        reserves: u64,
        total_supply: u64,
        current_price: u64
    ) -> Result<u64> {
        let market_cap = FixedPointCalculator::calculate_market_cap(
            total_supply,
            current_price
        )?;

        FixedPointCalculator::calculate_reserve_ratio(
            reserves,
            market_cap
        )
    }

    pub fn calculate_reserve_health(
        current_ratio: u64,
        target_ratio: u64,
        min_ratio: u64
    ) -> Result<ReserveHealth> {
        if current_ratio < min_ratio {
            return Ok(ReserveHealth::Critical);
        }

        let ratio_difference = FixedPointCalculator::calculate_deviation(
            current_ratio,
            target_ratio
        )?;

        match ratio_difference {
            d if d <= 100 => Ok(ReserveHealth::Optimal),
            d if d <= 300 => Ok(ReserveHealth::Adequate),
            _ => Ok(ReserveHealth::Suboptimal)
        }
    }

    pub fn calculate_required_adjustment(
        current_reserves: u64,
        target_reserves: u64
    ) -> Result<ReserveAdjustment> {
        let difference = target_reserves.checked_sub(current_reserves)
            .ok_or(ErrorCode::ArithmeticError)?;

        Ok(ReserveAdjustment {
            amount: difference,
            direction: if target_reserves > current_reserves { 
                AdjustmentDirection::Increase 
            } else { 
                AdjustmentDirection::Decrease 
            }
        })
    }

    pub fn calculate_reserve_target(
        total_supply: u64,
        current_price: u64,
        target_ratio: u64
    ) -> Result<u64> {
        let market_cap = FixedPointCalculator::calculate_market_cap(
            total_supply,
            current_price
        )?;

        FixedPointCalculator::multiply(
            market_cap,
            target_ratio,
            RATIO_PRECISION
        )
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ReserveHealth {
    Optimal,
    Adequate,
    Suboptimal,
    Critical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ReserveAdjustment {
    pub amount: u64,
    pub direction: AdjustmentDirection,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum AdjustmentDirection {
    Increase,
    Decrease,
}