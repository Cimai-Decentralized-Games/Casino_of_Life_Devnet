use anchor_lang::prelude::*;
use anchor_spl::token_2022::ID as TOKEN_2022_PROGRAM_ID;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub struct TokenType(pub u8);

impl TokenType {
    pub const DUMBS: TokenType = TokenType(0);
    pub const RAPR: TokenType = TokenType(1);

    pub fn get_token_program(&self) -> Pubkey {
        TOKEN_2022_PROGRAM_ID
    }
}