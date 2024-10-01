use anchor_lang::prelude::*;

#[account]
pub struct AIAgent {
    pub id: Pubkey,
    pub name: [u8; 32],
    pub symbol: [u8; 10],
    pub uri: String,
    pub model_hash: [u8; 32],
    pub collection: Pubkey,
    pub error_message: Option<String>, // New field for error messages
}

impl AIAgent {
    pub const LEN: usize = 8 + // discriminator
        32 + // id (Pubkey)
        32 + // name
        10 + // symbol
        4 + 200 + // uri (String has a 4-byte length prefix, assuming max 200 bytes for content)
        32 + // model_hash
        32 + // collection (Pubkey)
        1 + 4 + 200; // Option<String> (1 byte for the Option, 4 for String length, 200 for content)

    pub fn set_error(&mut self, message: String) {
        self.error_message = Some(message);
    }

    pub fn clear_error(&mut self) {
        self.error_message = None;
    }
}