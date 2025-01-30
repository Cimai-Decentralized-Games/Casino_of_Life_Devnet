use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022},
    associated_token::AssociatedToken,
    token_interface::{Mint as MintInterface, TokenAccount},
};

use spl_associated_token_account::{instruction as associated_token_2022_instruction, get_associated_token_address};
use spl_token_2022::ID as TOKEN_2022_PROGRAM_ID;
use crate::errors::error_code::ErrorCode;


pub fn create_token2022_account(ctx: Context<CreateToken2022Account>) -> Result<()> {
    msg!("Creating Token-2022 associated token account");

    // Derive the ATA address
    let ata_address = get_associated_token_address(&ctx.accounts.authority.key(), &ctx.accounts.mint.key());

    // Ensure the provided ATA account matches the derived address
    require_keys_eq!(
        ata_address,
        ctx.accounts.ata_account.key(),
        ErrorCode::InvalidAssociatedTokenAccount
    );

    // Create the instruction to create the ATA
    let create_ata_ix = associated_token_2022_instruction::create_associated_token_account(
        &ctx.accounts.payer.key(),     // payer
        &ctx.accounts.authority.key(), // owner
        &ctx.accounts.mint.key(),      // mint
        &TOKEN_2022_PROGRAM_ID,        // token program
    );

    // Prepare the accounts for the instruction
    let account_infos = vec![
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.ata_account.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.associated_token_program.to_account_info(),
    ];

    // Invoke the instruction
    anchor_lang::solana_program::program::invoke(
        &create_ata_ix,
        &account_infos,
    )?;

    msg!("Token-2022 associated token account created successfully!");
    Ok(())
}

#[derive(Accounts)]
pub struct CreateToken2022Account<'info> {
    /// Payer: The account that pays for the creation of the associated token account
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: The authority can be any Solana Pubkey because the ATA account will be owned by this account.
    pub authority: UncheckedAccount<'info>,

    /// Mint: The token mint for which the associated token account is being created
    pub mint: InterfaceAccount<'info, MintInterface>,

    /// CHECK: The associated token account can be any valid ATA of the provided mint. This will be validated.
    #[account(mut)]
    pub ata_account: UncheckedAccount<'info>,

    /// System Program: The Solana System Program
    pub system_program: Program<'info, System>,

    /// Token Program: The Token-2022 Program
    pub token_program: Program<'info, Token2022>,

    /// Associated Token Program: The Associated Token Account Program
    pub associated_token_program: Program<'info, AssociatedToken>,
}
