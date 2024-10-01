use anchor_lang::prelude::*;
use structural_convert::StructuralConvert;
use static_assertions::const_assert_eq;

#[account]
#[derive(StructuralConvert)]
pub struct UserAccount {
    pub authority: Pubkey,
    pub bettor: Pubkey,
    pub sol_balance: u64,
    pub dumbs_balance: u64,
}

impl UserAccount {
    pub const LEN: usize = 32 + 32 + 8 + 8;
}

const_assert_eq!(std::mem::size_of::<UserAccount>(), UserAccount::LEN);