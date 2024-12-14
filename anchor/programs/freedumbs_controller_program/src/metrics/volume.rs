use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct VolumeMetricsCalculator;

impl VolumeMetricsCalculator {
    pub fn calculate_volume_metrics(
        current_volume: u64,
        historical_volumes: &[u64],
        time_window: u64
    ) -> Result<VolumeMetrics> {
        let average_volume = Self::calculate_average_volume(historical_volumes)?;
        let volume_trend = Self::calculate_volume_trend(
            current_volume,
            average_volume
        )?;
        
        let volatility = Self::calculate_volume_volatility(
            historical_volumes,
            time_window
        )?;

        Ok(VolumeMetrics {
            current_volume,
            average_volume,
            volume_trend,
            volatility,
            last_update: Clock::get()?.unix_timestamp as u64,
        })
    }

    pub fn calculate_volume_depth(
        volume_metrics: &VolumeMetrics,
        total_supply: u64
    ) -> Result<u64> {
        FixedPointCalculator::calculate_reserve_ratio(
            volume_metrics.average_volume,
            total_supply
        )
    }

    fn calculate_average_volume(historical_volumes: &[u64]) -> Result<u64> {
        if historical_volumes.is_empty() {
            return Err(ErrorCode::InsufficientVolumeHistory.into());
        }

        FixedPointCalculator::calculate_mean(historical_volumes)
    }

    fn calculate_volume_trend(
        current_volume: u64,
        average_volume: u64
    ) -> Result<u64> {
        FixedPointCalculator::calculate_deviation(
            current_volume,
            average_volume
        )
    }

    fn calculate_volume_volatility(
        historical_volumes: &[u64],
        time_window: u64
    ) -> Result<u64> {
        if historical_volumes.len() < 2 {
            return Err(ErrorCode::InsufficientVolumeHistory.into());
        }

        let returns: Result<Vec<u64>> = historical_volumes
            .windows(2)
            .map(|window| {
                FixedPointCalculator::calculate_return(
                    window[1], // current
                    window[0]  // previous
                )
            })
            .collect();

        FixedPointCalculator::calculate_volatility(
            &returns?,
            time_window
        )
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct VolumeMetrics {
    pub current_volume: u64,       // Raw token amount
    pub average_volume: u64,       // Raw token amount
    pub volume_trend: u64,         // With RATIO_PRECISION
    pub volatility: u64,           // With RATIO_PRECISION
    pub last_update: u64,          // Unix timestamp
}

impl VolumeMetrics {
    pub fn update(
        &mut self,
        new_volume: u64,
        historical_volumes: &[u64],
        time_window: u64
    ) -> Result<()> {
        let updated_metrics = VolumeMetricsCalculator::calculate_volume_metrics(
            new_volume,
            historical_volumes,
            time_window
        )?;

        *self = updated_metrics;
        Ok(())
    }

    pub fn add_volume(&mut self, additional_volume: u64) -> Result<()> {
        self.current_volume = self.current_volume
            .checked_add(additional_volume)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        self.last_update = Clock::get()?.unix_timestamp as u64;
        Ok(())
    }
}