use anchor_lang::prelude::*;
use crate::state::bet::Bet;

pub const USER_BETTING_ACCOUNT_SEED: &[u8] = b"user-bet-account";

#[account]
pub struct UserBettingAccount {
    pub owner: Pubkey,              // The owner of this betting account
    pub active_bet: Option<Bet>,    // The single active bet (if any)
    pub total_bets_placed: u64,     // Total number of bets placed
    pub total_dumbs_wagered: u64,   // Total DUMBS tokens wagered
    pub total_rapr_wagered: u64,    // Total RAPR tokens wagered
    pub total_winnings: u64,        // Total winnings across all bets
    pub last_bet_timestamp: i64,    // Timestamp of the last bet placed
    pub bump: u8,                   // Bump seed for the account
}

impl UserBettingAccount {
    pub const LEN: usize = 8 +      // Discriminator
        32 +                        // owner
        1 + (Bet::LEN) +            // active_bet (Option<Bet>)
        8 +                         // total_bets_placed
        8 +                         // total_dumbs_wagered
        8 +                         // total_rapr_wagered
        8 +                         // total_winnings
        8 +                         // last_bet_timestamp
        1;                          // bump

    /// Initializes the UserBettingAccount
    pub fn initialize(&mut self, owner: Pubkey, bump: u8) -> Result<()> {
        self.owner = owner;
        self.active_bet = None;
        self.total_bets_placed = 0;
        self.total_dumbs_wagered = 0;
        self.total_rapr_wagered = 0;
        self.total_winnings = 0;
        self.last_bet_timestamp = 0;
        self.bump = bump;
        Ok(())
    }

    /// Removes the active bet (if it exists)
    pub fn remove_active_bet(&mut self) -> Result<()> {
        self.active_bet = None;
        Ok(())
    }

    /// Updates the total winnings
    pub fn update_winnings(&mut self, winnings: u64) -> Result<()> {
        self.total_winnings = self.total_winnings.checked_add(winnings).unwrap();
        Ok(())
    }

    /// Updates the total wagered amount for the given token type
    pub fn update_wagered_amount(&mut self, amount: u64, token_type: crate::state::betting_state::TokenType) -> Result<()> {
        match token_type {
            crate::state::betting_state::TokenType::DUMBS => {
                self.total_dumbs_wagered = self.total_dumbs_wagered.checked_add(amount).unwrap();
            }
            crate::state::betting_state::TokenType::RAPR => {
                self.total_rapr_wagered = self.total_rapr_wagered.checked_add(amount).unwrap();
            }
        }
        Ok(())
    }

    /// Adds a new active bet (replaces the existing one if any)
    pub fn add_active_bet(&mut self, bet: Bet) -> Result<()> {
        self.active_bet = Some(bet);
        self.total_bets_placed = self.total_bets_placed.checked_add(1).unwrap();
        self.last_bet_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

impl Default for UserBettingAccount {
    fn default() -> Self {
        Self {
            owner: Pubkey::default(),
            active_bet: None,
            total_bets_placed: 0,
            total_dumbs_wagered: 0,
            total_rapr_wagered: 0,
            total_winnings: 0,
            last_bet_timestamp: 0,
            bump: 0,
        }
    }
}