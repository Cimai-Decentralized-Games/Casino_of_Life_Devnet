use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, RatioCalculator, constants::*};
use crate::errors::ErrorCode;
use crate::state::modes::OperationMode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum MarketTrend {
    Neutral,
    Bullish,
    Bearish,
    Volatile,
    Stable,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeTracking {
    pub last_update: u64,
    pub last_action: u64,
    pub cooldown_period: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct MetricWindow {
    pub start_time: u64,
    pub duration: u64,
    pub value: u64,
    pub count: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct MarketMetrics {
    pub volatility: MetricWindow,
    pub volume: MetricWindow,
    pub liquidity: MetricWindow,
    pub unique_traders: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct MarketLimits {
    pub min_trade_size: u64,
    pub max_trade_size: u64,
    pub max_price_impact: u64,
    pub min_liquidity: u64,
}

#[account]
pub struct MarketState {
    // Authority
    pub authority: Pubkey,
    pub bump: u8,

    // Market Status
    pub current_price: u64,
    pub previous_price: u64,
    pub market_trend: MarketTrend,
    pub operation_mode: OperationMode,
    
    // Metrics
    pub metrics: MarketMetrics,
    pub limits: MarketLimits,
    
    // Reserve Management
    pub current_reserve_ratio: u64,
    pub target_reserve_ratio: u64,
    pub min_reserve_ratio: u64,
    
    // Time Tracking
    pub timing: TimeTracking,
}

impl MarketState {
    pub const SPACE: usize = 8 +     // discriminator
        32 +                         // authority
        1 +                          // bump
        8 +                          // current_price
        8 +                          // previous_price
        1 +                          // market_trend
        1 +                          // operation_mode
        MarketMetrics::SIZE +        // metrics
        MarketLimits::SIZE +         // limits
        8 +                          // current_reserve_ratio
        8 +                          // target_reserve_ratio
        8 +                          // min_reserve_ratio
        TimeTracking::SIZE;          // timing

    pub fn update_metrics(
        &mut self,
        price_impact: u64,
        volume: u64,
        timestamp: u64,
    ) -> Result<()> {
        // Update volatility metrics
        self.metrics.volatility.update(price_impact, timestamp);
        
        // Update volume metrics
        self.metrics.volume.update(volume, timestamp);
        
        // Update market trend
        self.update_market_trend()?;
        
        // Update timing
        self.timing.update(timestamp);
        
        Ok(())
    }

    pub fn update_market_trend(&mut self) -> Result<()> {
        let avg_volatility = self.metrics.volatility.average().unwrap_or(0);
        let avg_volume = self.metrics.volume.average().unwrap_or(0);

        self.market_trend = match (avg_volatility, avg_volume) {
            (v, _) if v > VOLATILITY_THRESHOLD => MarketTrend::Volatile,
            (_, v) if v > VOLUME_THRESHOLD => {
                if self.current_price > self.previous_price {
                    MarketTrend::Bullish
                } else {
                    MarketTrend::Bearish
                }
            },
            (v, _) if v < STABILITY_THRESHOLD => MarketTrend::Stable,
            _ => MarketTrend::Neutral,
        };

        Ok(())
    }

    pub fn validate_trade(&self, amount: u64) -> Result<()> {
        require!(
            amount >= self.limits.min_trade_size &&
            amount <= self.limits.max_trade_size,
            ErrorCode::InvalidTradeSize
        );

        let price_impact = RatioCalculator::calculate_price_impact(
            amount,
            self.metrics.liquidity.value
        )?;

        require!(
            price_impact <= self.limits.max_price_impact,
            ErrorCode::ExcessivePriceImpact
        );

        Ok(())
    }

    pub fn update_after_mint(
        &mut self,
        mint_amount: u64,
        trade_amount: u64,
    ) -> Result<()> {
        self.previous_price = self.current_price;
        
        // Update metrics
        self.update_metrics(
            mint_amount,
            trade_amount,
            Clock::get()?.unix_timestamp as u64
        )?;

        Ok(())
    }

    pub fn update_after_burn(
        &mut self,
        burn_amount: u64,
        trade_amount: u64,
    ) -> Result<()> {
        self.previous_price = self.current_price;
        
        // Update metrics
        self.update_metrics(
            burn_amount,
            trade_amount,
            Clock::get()?.unix_timestamp as u64
        )?;

        Ok(())
    }
}

// Constants for market trend determination
const VOLATILITY_THRESHOLD: u64 = 500;  // 5% with RATIO_PRECISION
const VOLUME_THRESHOLD: u64 = 1000;     // Significant volume
const STABILITY_THRESHOLD: u64 = 100;   // 1% with RATIO_PRECISION

impl MarketMetrics {
    pub const SIZE: usize = MetricWindow::SIZE * 3 + 8; // 3 windows + unique_traders
}

impl MarketLimits {
    pub const SIZE: usize = 8 * 4; // 4 u64 fields
}

impl TimeTracking {
    pub const SIZE: usize = 8 * 3; // 3 u64 fields

    pub fn can_act(&self, current_time: u64) -> bool {
        current_time.saturating_sub(self.last_action) >= self.cooldown_period
    }

    pub fn update(&mut self, current_time: u64) {
        self.last_update = current_time;
        self.last_action = current_time;
    }
}

impl MetricWindow {
    pub const SIZE: usize = 8 * 4; // 4 u64 fields

    pub fn reset(&mut self, current_time: u64) {
        self.start_time = current_time;
        self.value = 0;
        self.count = 0;
    }

    pub fn update(&mut self, value: u64, current_time: u64) {
        if current_time.saturating_sub(self.start_time) >= self.duration {
            self.reset(current_time);
        }
        self.value = self.value.saturating_add(value);
        self.count = self.count.saturating_add(1);
    }

    pub fn average(&self) -> Option<u64> {
        if self.count == 0 {
            None
        } else {
            Some(self.value.checked_div(self.count).unwrap_or(0))
        }
    }
}

impl Default for MetricWindow {
    fn default() -> Self {
        Self {
            start_time: 0,
            duration: 0,
            value: 0,
            count: 0,
        }
    }
}

impl Default for TimeTracking {
    fn default() -> Self {
        Self {
            last_update: 0,
            last_action: 0,
            cooldown_period: 0,
        }
    }
}

impl Default for MarketState {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            bump: 0,
            current_price: 0,
            previous_price: 0,
            market_trend: MarketTrend::Neutral,
            operation_mode: OperationMode::default(),
            metrics: MarketMetrics {
                volatility: MetricWindow::default(),
                volume: MetricWindow::default(),
                liquidity: MetricWindow::default(),
                unique_traders: 0,
            },
            limits: MarketLimits {
                min_trade_size: 0,
                max_trade_size: u64::MAX,
                max_price_impact: 1000, // 10%
                min_liquidity: 0,
            },
            current_reserve_ratio: 0,
            target_reserve_ratio: 0,
            min_reserve_ratio: 0,
            timing: TimeTracking::default(),
        }
    }
}