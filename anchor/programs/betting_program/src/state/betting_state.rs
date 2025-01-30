use anchor_lang::prelude::*;
use crate::errors::error_code::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TokenType {
    DUMBS,
    RAPR,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum FightOutcome {
    Fighter1Wins,
    Fighter2Wins,
    Draw,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetType {
    WinnerPrediction,
    RoundPrediction,
    MethodOfVictory,
}

#[account]
pub struct BettingState {
    pub authority: Pubkey,
    pub dumbs_mint: Pubkey,
    pub rapr_mint: Pubkey,
    pub bet_vault: Pubkey,      // DUMBS vault
    pub rapr_vault: Pubkey,     // Separate RAPR vault
    pub treasury: Pubkey,
    pub sol_vault: Pubkey,
    pub house_fee: u32,
    pub rapr_multiplier: u64,
    pub sol_dumbs_rate: u64,
    pub sol_rapr_rate: u64,
    pub total_bets_placed: u64,
    pub total_bets_settled: u64,
    pub total_dumbs_wagered: u64,
    pub total_rapr_wagered: u64,
    pub total_dumbs_won: u64,
    pub total_rapr_won: u64,
    pub total_fees_collected: u64,
    pub total_potential_payout: u64,
    pub total_dumbs_in_circulation: u64,
    pub total_rapr_in_circulation: u64,
    pub max_bet: u64,
    pub is_paused: bool,
    pub bump: u8,
    pub bet_vault_bump: u8,
    pub rapr_vault_bump: u8,
}

impl Default for BettingState {
    fn default() -> Self {
       Self {
           authority: Pubkey::default(),
           dumbs_mint: Pubkey::default(),
           rapr_mint: Pubkey::default(),
           bet_vault: Pubkey::default(),
           rapr_vault: Pubkey::default(),
           treasury: Pubkey::default(),
           sol_vault: Pubkey::default(),
           house_fee: 0,
           rapr_multiplier: 0,
           sol_dumbs_rate: 0,
           sol_rapr_rate: 0,
           total_bets_placed: 0,
           total_bets_settled: 0,
           total_dumbs_wagered: 0,
           total_rapr_wagered: 0,
           total_dumbs_won: 0,
           total_rapr_won: 0,
           total_fees_collected: 0,
           total_potential_payout: 0,
           total_dumbs_in_circulation: 0,
           total_rapr_in_circulation: 0,
           max_bet: 0,
           is_paused: false,
           bump: 0,
           bet_vault_bump: 0,
           rapr_vault_bump:0
       }
   }
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub token_type: TokenType,
    pub amount: u32,           // Original bet amount (after fees)
    pub fight_id: u32,
    pub odds: u16,            // In basis points (e.g., 150 = 1.5x)
    pub potential_payout: u32, // Maximum possible payout
    pub fee_amount: u32,      // Fee paid at bet placement
    pub timestamp: i64,
    pub settled: bool,
    pub won: bool,
    pub settlement_timestamp: i64,
    pub actual_payout: u32,
    pub rapr_multiplier: u16,
    pub bump: u8,
}

#[account]
pub struct FightEpoch {
    pub epoch_id: u32,
    pub fight_id: String,
    pub start_time: i64,
    pub end_time: i64,
    pub total_bets: u64,
    pub total_dumbs_bet: u64,
    pub total_rapr_bet: u64,
    pub bump: u8,
}

impl BettingState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // dumbs_mint
        32 + // rapr_mint
        32 + // bet_vault
        32 + // rapr_vault
        32 + // treasury
        32 + // sol_vault
        4 + // house_fee 
        8 + // rapr_multiplier 
        8 + // sol_dumbs_rate
        8 + // sol_rapr_rate
        8 + // total_bets_placed
        8 + // total_bets_settled
        8 + // total_dumbs_wagered
        8 + // total_rapr_wagered
        8 + // total_dumbs_won
        8 + // total_rapr_won
        8 + // total_fees_collected
        8 + // total_potential_payout
        8 + // total_dumbs_in_circulation
        8 + // total_rapr_in_circulation
        8 + // max_bet
        1 + // is_paused
        1 + // bump
        1 + // bet_vault_bump
        1; // rapr_vault_bump
        

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        dumbs_mint: Pubkey,
        rapr_mint: Pubkey,
        bet_vault: Pubkey,
        rapr_vault: Pubkey,
        treasury: Pubkey,
        sol_vault: Pubkey,
        house_fee: u32,
        rapr_multiplier: u64,
        sol_dumbs_rate: u64,
        sol_rapr_rate: u64,
        max_bet: u64,
        bump: u8,
    ) {
        self.authority = authority;
        self.dumbs_mint = dumbs_mint;
        self.rapr_mint = rapr_mint;
        self.bet_vault = bet_vault;
        self.rapr_vault = rapr_vault;
        self.treasury = treasury;
        self.sol_vault = sol_vault;
        self.house_fee = house_fee;
        self.rapr_multiplier = rapr_multiplier;
        self.sol_dumbs_rate = sol_dumbs_rate;
        self.sol_rapr_rate = sol_rapr_rate;
        self.total_bets_placed = 0;
        self.total_bets_settled = 0;
        self.total_dumbs_wagered = 0;
        self.total_rapr_wagered = 0;
        self.total_dumbs_won = 0;
        self.total_rapr_won = 0;
        self.total_fees_collected = 0;
        self.total_potential_payout = 0;
        self.total_dumbs_in_circulation = 0;
        self.total_rapr_in_circulation = 0;
        self.max_bet = max_bet;
        self.is_paused = false;
        self.bump = bump;
    }

   pub fn is_initialized(&self) -> bool {
        self.authority != Pubkey::default()
            && self.dumbs_mint != Pubkey::default()
            && self.treasury != Pubkey::default()
            && self.bet_vault != Pubkey::default()
    }

    
    pub fn calculate_fee(&self, amount: u64) -> Result<u64> {
        Ok(amount
            .checked_mul(self.house_fee as u64)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::CalculationOverflow)?)
    }

    pub fn calculate_odds(&self, base_odds: u64, token_type: TokenType) -> Result<u64> {
        match token_type {
            TokenType::DUMBS => Ok(base_odds),
            TokenType::RAPR => {
                Ok(base_odds
                    .checked_mul(self.rapr_multiplier as u64)
                    .ok_or(ErrorCode::CalculationOverflow)?
                    .checked_div(100)
                    .ok_or(ErrorCode::CalculationOverflow)?)
            }
        }
    }

   pub fn handle_sol_deposit(
        &mut self,
        amount: u64, // Amount in lamports of SOL
    ) -> Result<(u64, u64)> {  // Returns (fee, dumbs_to_mint in lamports of DUMB)
        // Calculate fee (2.5% = 250/10000)
        let fee = self.calculate_fee(amount)?;
    
        // Subtract the fee from the deposit amount
        let deposit_amount = amount
            .checked_sub(fee)
            .ok_or(ErrorCode::CalculationOverflow)?;
    
        // Calculate DUMBs to mint in lamports of DUMB
        // Since 1 SOL = 1000 DUMBs, and both SOL and DUMB use 9 decimal places,
        // the conversion factor is 1000.
        let dumbs_to_mint = deposit_amount
            .checked_mul(self.sol_dumbs_rate)
            .ok_or(ErrorCode::CalculationOverflow)?;
    
        // Update state
        self.total_fees_collected = self.total_fees_collected
            .checked_add(fee)
            .ok_or(ErrorCode::CalculationOverflow)?;
    
        self.total_dumbs_in_circulation = self.total_dumbs_in_circulation
            .checked_add(dumbs_to_mint)
            .ok_or(ErrorCode::CalculationOverflow)?;
    
        Ok((fee, dumbs_to_mint))
    }

    pub fn mint_dumbs_for_win(
        &mut self,
        amount: u32,
        token_type: TokenType,
    ) -> Result<u32> {  // Returns amount to mint
        let dumbs_to_mint = match token_type {
            TokenType::DUMBS => amount,
            TokenType::RAPR => {
                amount
                    .checked_mul(self.rapr_multiplier as u32)
                    .ok_or(ErrorCode::CalculationOverflow)?
            }
        };

        // Update circulation
        self.total_dumbs_in_circulation = self.total_dumbs_in_circulation
            .checked_add(dumbs_to_mint as u64)
            .ok_or(ErrorCode::CalculationOverflow)?;

        Ok(dumbs_to_mint)
    }

    pub fn validate_sol_deposit(
        &self,
        amount: u64,
    ) -> Result<()> {
        // Add any validation logic here
        if amount == 0 {
            return Err(ErrorCode::InvalidAmount.into());
        }

        if self.is_paused {
            return Err(ErrorCode::ProgramPaused.into());
        }

        // Calculate resulting DUMBS and ensure it won't overflow
        let fee = self.calculate_fee(amount)?;
        let deposit_amount = amount
            .checked_sub(fee)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        let _dumbs_to_mint = deposit_amount
            .checked_mul(self.sol_dumbs_rate)
            .ok_or(ErrorCode::CalculationOverflow)?;

        Ok(())
    }

    pub fn initialize_vaults(&mut self, bet_vault: Pubkey, rapr_vault: Pubkey) -> Result<()> {
        self.bet_vault = bet_vault;
        self.rapr_vault = rapr_vault;
        Ok(())
    }
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
                    .checked_mul(rapr_multiplier.unwrap_or(0) as u32)
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
}

impl FightEpoch {
    pub const LEN: usize = 8 +    // discriminator
        4 +                       // epoch_id
        32 +                      // fight_id (String)
        8 +                       // start_time
        8 +                       // end_time
        8 +                       // total_bets
        8 +                       // total_dumbs_bet
        8 +                       // total_rapr_bet
        1;                        // bump
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeBumps {
    pub betting_state: u8,
    pub bet_vault: u8,
    pub treasury: u8,
}