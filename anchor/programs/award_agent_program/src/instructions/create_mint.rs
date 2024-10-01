use anchor_lang::prelude::*;
use anchor_spl::{
    token::{Mint, Token, TokenAccount, MintTo},
    metadata::{create_metadata_accounts_v3, CreateMetadataAccountsV3, Metadata},
};
use mpl_token_metadata::types::DataV2;
use crate::state::Treasury;
use crate::errors::ErrorCode;

pub fn handler(ctx: Context<CreateMint>, uri: String, name: String, symbol: String) -> Result<()> {
    // Set up the PDA as a minter for the DUMBS token
    let seeds = &[b"award_agent_authority".as_ref(), &[ctx.bumps.award_agent_authority]];
    let signer = &[&seeds[..]];

    // Set up metadata for the token (this doesn't create a new supply)
    let data_v2 = DataV2 {
        name: name.clone(),
        symbol: symbol.clone(),
        uri: uri.clone(),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.to_account_info(),
        CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata_account.to_account_info(),
            mint: ctx.accounts.dumbs_token_mint.to_account_info(),
            mint_authority: ctx.accounts.award_agent_authority.to_account_info(),
            payer: ctx.accounts.admin.to_account_info(),
            update_authority: ctx.accounts.award_agent_authority.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
            rent: ctx.accounts.rent.to_account_info(),
        },
        signer,
    );

    create_metadata_accounts_v3(
        cpi_ctx,
        data_v2,
        true,
        true,
        None,
    )?;

    // Collect fee and transfer to treasury
    let fee = 1000; // Define the fee amount
    let cpi_accounts = MintTo {
        mint: ctx.accounts.dumbs_token_mint.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
        authority: ctx.accounts.award_agent_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
    token::mint_to(cpi_ctx, fee)?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreateMint<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: This is the PDA that will have authority to mint/burn DUMBS tokens
    #[account(
        seeds = [b"award_agent_authority"],
        bump,
    )]
    pub award_agent_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub dumbs_token_mint: Account<'info, Mint>,

    /// CHECK: This is the metadata account for the DUMBS token
    #[account(mut)]
    pub metadata_account: UncheckedAccount<'info>,

    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}