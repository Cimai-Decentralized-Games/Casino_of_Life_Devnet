use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct FeeCalculator;

impl FeeCalculator {
    pub fn calculate_fee(amount: u64, rate: u64) -> Result<u64> {
        let fee = FixedPointCalculator::multiply(
            amount,
            rate,
            FEE_PRECISION
        )?;
        Ok(fee)
    }

    pub fn calculate_protocol_share(
        accumulated_fees: u64,
        protocol_share: u64,
    ) -> Result<u64> {
        let share = FixedPointCalculator::multiply(
            accumulated_fees,
            protocol_share,
            SHARE_PRECISION
        )?;
        Ok(share)
    }

    pub fn calculate_agent_share(
        accumulated_fees: u64,
        agent_share: u64,
    ) -> Result<u64> {
        let share = FixedPointCalculator::multiply(
            accumulated_fees,
            agent_share,
            SHARE_PRECISION
        )?;
        Ok(share)
    }

    pub fn validate_fee_rate(rate: u64) -> Result<()> {
        require!(
            rate <= FEE_PRECISION,
            ErrorCode::InvalidCalculation
        );
        Ok(())
    }
}