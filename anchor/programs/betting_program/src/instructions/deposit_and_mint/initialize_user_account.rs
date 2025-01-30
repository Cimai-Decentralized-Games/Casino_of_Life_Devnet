use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022},
    associated_token::AssociatedToken,
    token_interface::{Mint as MintInterface, TokenAccount},
};

use crate::instructions::deposit_and_mint::create_user_account::{CreateToken2022Account, create_token2022_account, CreateToken2022AccountBumps}; 
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
pub struct InitializeUserAccount<'info> {
    /// Payer: The account that pays for the creation of the associated token account
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: User Token Account: The new associated token account to be created and a valid ATA of the provided mint. This will be validated.
    #[account(mut)]
    pub user_token_account: UncheckedAccount<'info>,

    /// CHECK: The authority can be any Solana Pubkey because the ATA account will be owned by this account. The wallet address that will own the associated token account
    pub authority: UncheckedAccount<'info>,

    /// Mint: The token mint for which the associated token account is being created
    pub mint: InterfaceAccount<'info, MintInterface>,

    /// Token Program: The Token-2022 Program
    pub token_program: Program<'info, Token2022>,

    /// Associated Token Program: The Associated Token Account Program
    pub associated_token_program: Program<'info, AssociatedToken>,

    /// System Program: The Solana System Program
    pub system_program: Program<'info, System>,
}

pub fn initialize_user_account(ctx: Context<InitializeUserAccount>) -> Result<()> {
    // Check if the user token account already exists
    if !ctx.accounts.user_token_account.to_account_info().data_is_empty() {
        msg!("ATA for user already exists");
        return Err(ErrorCode::AccountAlreadyInitialized.into());
    }

    msg!("Creating Token-2022 account for user");
    msg!("Token Program ID: {}", ctx.accounts.token_program.key());
    msg!("Authority: {}", ctx.accounts.authority.key());
    msg!("Mint: {}", ctx.accounts.mint.to_account_info().key());
    
    let mut create_account_ctx = CreateToken2022Account {
        payer: ctx.accounts.payer.clone(),
        authority: ctx.accounts.authority.clone(),
        mint: ctx.accounts.mint.clone(),
        ata_account: ctx.accounts.user_token_account.clone(),
        system_program: ctx.accounts.system_program.clone(),
        token_program: ctx.accounts.token_program.clone(),
        associated_token_program: ctx.accounts.associated_token_program.clone(),
    };
     let account_infos = vec![
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.user_token_account.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        ctx.accounts.associated_token_program.to_account_info(),
    ];
    let bumps = CreateToken2022AccountBumps {};

    let new_ctx = Context::new(
        ctx.program_id,
        &mut create_account_ctx,
        &account_infos,
        bumps
    );
    // Call the `create_token2022_account` function with the new Context instance
    create_token2022_account(new_ctx)?;

    msg!("Token-2022 account created successfully");
    Ok(())
}