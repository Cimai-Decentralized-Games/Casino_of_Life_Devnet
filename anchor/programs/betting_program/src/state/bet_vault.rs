use anchor_lang::prelude::*;

#[account]
#[derive(Default, Debug)]
pub struct BetVault {
    pub authority: Pubkey,
    pub balance: u64,
    pub bump: u8,
}

impl BetVault {
    pub const LEN: usize = 8 + 32 + 8 + 1;

    pub fn initialize(&mut self, authority: Pubkey, bump: u8) -> Result<()> {
        self.authority = authority;
        self.balance = 0;
        self.bump = bump;
        Ok(())
    }

    pub fn update_balance(&mut self, new_balance: u64) -> Result<()> {
        self.balance = new_balance;
        Ok(())
    }
}