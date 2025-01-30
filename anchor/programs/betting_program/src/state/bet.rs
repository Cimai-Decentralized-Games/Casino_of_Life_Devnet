use anchor_lang::prelude::*;
use super::betting_state::TokenType;
use crate::errors::error_code::ErrorCode;

pub const BET_SEED: &[u8] = b"bet";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct Bet {
    pub bettor: Pubkey,
    pub token_type: TokenType,
    // Bet details
    pub amount: u32,           // Original bet amount (after fees)
    pub fight_id: u32,
    pub odds: u16,            // In basis points (e.g., 150 = 1.5x)
    pub potential_payout: u32, // Maximum possible payout
    // Fee tracking
    pub fee_amount: u32,      // Fee paid at bet placement
    // Status
    pub timestamp: i64,
    pub settled: bool,
    pub won: bool,
    pub settlement_timestamp: i64,
    pub actual_payout: u32,
    // If RAPR bet, track multiplier used
    pub rapr_multiplier: u16,
    pub bump: u8,
}

impl Bet {
    pub const LEN: usize = 8 + // discriminator
        32 + // bettor
        1 + // token_type
        4 + // amount
        4 + // fight_id
        2 + // odds
        4 + // potential_payout
        4 + // fee_amount
        8 + // timestamp
        1 + // settled
        1 + // won
        8 + // settlement_timestamp
        4 + // actual_payout
        2 + // rapr_multiplier
        1; // bump

    pub fn initialize(
        &mut self,
        bettor: Pubkey,
        token_type: TokenType,
        amount: u32,
        fee_amount: u32,
        fight_id: u32,
        odds: u16,
        rapr_multiplier: Option<u16>,
        bump: u8,
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(odds > 0, ErrorCode::InvalidOdds);
        if token_type == TokenType::RAPR {
            require!(rapr_multiplier.is_some(), ErrorCode::InvalidRaprMultiplier);
        }

        self.bettor = bettor;
        self.token_type = token_type;
        self.amount = amount;
        self.fee_amount = fee_amount;
        self.fight_id = fight_id;
        self.odds = odds;
        
        // Calculate potential payout based on token type
        let base_payout = (amount as u64)
            .checked_mul(odds as u64)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationOverflow)? as u32;

        self.potential_payout = match token_type {
            TokenType::RAPR => {
                base_payout
                    .checked_mul(rapr_multiplier.unwrap() as u32)
                    .ok_or(ErrorCode::CalculationOverflow)?
            },
            TokenType::DUMBS => base_payout,
        };

        self.timestamp = Clock::get()?.unix_timestamp;
        self.settled = false;
        self.won = false;
        self.settlement_timestamp = 0;
        self.actual_payout = 0;
        self.rapr_multiplier = rapr_multiplier.unwrap_or(0);
        self.bump = bump;
        Ok(())
    }

    pub fn settle(&mut self, won: bool) -> Result<()> {
        require!(!self.settled, ErrorCode::BetAlreadySettled);
        
        self.settled = true;
        self.won = won;
        self.settlement_timestamp = Clock::get()?.unix_timestamp;
        
        Ok(())
    }

    pub fn get_duration(&self) -> Result<i64> {
        Ok(self.settlement_timestamp - self.timestamp)
    }
}

impl Default for Bet {
    fn default() -> Self {
        Self {
           bettor: Pubkey::default(),
            token_type: TokenType::DUMBS,
            amount: 0,
            fight_id: 0,
            odds: 0,
            potential_payout: 0,
            fee_amount: 0,
            timestamp: 0,
            settled: false,
            won: false,
            settlement_timestamp: 0,
            actual_payout: 0,
            rapr_multiplier: 0,
            bump: 0
        }
    }
}