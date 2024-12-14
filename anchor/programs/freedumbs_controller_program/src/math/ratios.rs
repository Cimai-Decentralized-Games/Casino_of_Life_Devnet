use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct RatioCalculator;

impl RatioCalculator {
    pub fn calculate_reserve_ratio(
        reserves: u64,
        volume: u64
    ) -> Result<u64> {
        let ratio = FixedPointCalculator::multiply(
            reserves,
            RATIO_PRECISION,
            volume
        )?;
        Ok(ratio)
    }

    pub fn calculate_liquidity_ratio(
        amount: u64,
        total_liquidity: u64
    ) -> Result<u64> {
        let ratio = FixedPointCalculator::multiply(
            amount,
            RATIO_PRECISION,
            total_liquidity
        )?;
        Ok(ratio)
    }

    pub fn validate_ratio(ratio: u64) -> Result<()> {
        require!(
            ratio <= RATIO_PRECISION,
            ErrorCode::InvalidCalculation
        );
        Ok(())
    }

    pub fn calculate_utilization_ratio(
        used: u64,
        total: u64
    ) -> Result<u64> {
        let ratio = FixedPointCalculator::multiply(
            used,
            RATIO_PRECISION,
            total
        )?;
        Ok(ratio)
    }

    pub fn calculate_price_impact(
        amount: u64,
        liquidity: u64
    ) -> Result<u64> {
        let ratio = FixedPointCalculator::multiply(
            amount,
            RATIO_PRECISION,
            liquidity
        )?;
        Ok(ratio)
    }
}