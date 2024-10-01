use anchor_lang::prelude::*;
use crate::state::{Collection, AIAgent, treasury::{Treasury, TREASURY_SEED, COLLECTION_FEE, AGENT_FEE}};
use crate::errors::errors::ErrorCode;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::{
    create_master_edition_v3, create_metadata_accounts_v3, CreateMasterEditionV3,
    CreateMetadataAccountsV3, Metadata,
};
use anchor_spl::token::{mint_to, MintTo, Mint, Token, TokenAccount};
use mpl_token_metadata::types::{Creator, DataV2, Collection as MetadataCollection};

#[derive(Accounts)]
#[instruction(
    id: Pubkey,
    name: String,
    symbol: String,
    uri: String,
    model_hash: [u8; 32],
    collection_id: Pubkey,
    collection_bump: u8
)]
pub struct MintAIAgent<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"ai_agent", id.as_ref()], bump)]
    pub ai_agent: Account<'info, AIAgent>,
    #[account(mut, signer)]
    pub mint: Box<Account<'info, Mint>>,
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub token_account: Box<Account<'info, TokenAccount>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub metadata_program: Program<'info, Metadata>,
    #[account(
        seeds = [b"collection", collection_id.as_ref()],
        bump = collection_bump
    )]
    pub collection: Account<'info, Collection>,
    /// CHECK: We're checking the owner in the instruction
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: We're checking the owner in the instruction
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
}

pub fn mint_ai_agent_handler(
    ctx: Context<MintAIAgent>,
    id: Pubkey,
    name: String,
    symbol: String,
    uri: String,
    model_hash: [u8; 32],
    collection_id: Pubkey,
    collection_bump: u8
) -> Result<()> {
    msg!("Entering mint_ai_agent instruction");
    msg!("AI Agent ID: {}", id);
    msg!("Collection ID: {}", collection_id);
    msg!("Authority: {}", ctx.accounts.authority.key());
    msg!("Payer: {}", ctx.accounts.payer.key());
    msg!("Payer balance: {}", ctx.accounts.payer.lamports());
    msg!("AIAgent::LEN: {}", AIAgent::LEN);
    msg!("ID: {}", id);
    
    msg!("Accessing ai_agent account");
    let ai_agent = &mut ctx.accounts.ai_agent;
    msg!("Accessing collection account");
    let collection = &ctx.accounts.collection;

    msg!("Collection account address: {}", collection.key());
    msg!("Collection ID from account: {}", collection.collection_id);
    msg!("Collection ID passed to instruction: {}", collection_id);
    require!(
        collection.collection_id == collection_id,
        ErrorCode::CollectionMismatch
    );

    msg!("Setting AI Agent fields");
    msg!("Setting name");
    ai_agent.name = name.as_bytes()[..std::cmp::min(name.len(), 32)].try_into().unwrap_or([0; 32]);
    msg!("Setting symbol");
    ai_agent.symbol = symbol.as_bytes()[..std::cmp::min(symbol.len(), 10)].try_into().unwrap_or([0; 10]);
    
    msg!("Setting URI");
    if uri.len() > 200 {
        msg!("Warning: URI truncated to 200 bytes");
        ai_agent.uri = uri[..200].to_string();
    } else {
        ai_agent.uri = uri.clone();
    }
    
    msg!("Setting model_hash");
    ai_agent.model_hash = model_hash;
    msg!("Setting collection");
    ai_agent.collection = collection.key();

    // Initialize error_message as None
    ai_agent.error_message = None;

    // Mint the NFT
    let ai_agent_seeds = &[
        b"ai_agent",
        id.as_ref(),
        &[ctx.bumps.ai_agent],
    ];
    let signer_seeds = &[&ai_agent_seeds[..]];

    msg!("Minting token...");
    match mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.token_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        ),
        1,
    ) {
        Ok(_) => msg!("Token minted successfully"),
        Err(e) => {
            msg!("Error minting token: {:?}", e);
            ai_agent.set_error(format!("Failed to mint token: {:?}", e));
            return Err(e.into());
        }
    }

    msg!("Creating metadata...");
    create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMetadataAccountsV3 {
                metadata: ctx.accounts.metadata.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        ),
        DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0,
            creators: Some(vec![Creator {
                address: ctx.accounts.payer.key(),
                verified: true,
                share: 100,
            }]),
            collection: Some(MetadataCollection {
                verified: false,
                key: ctx.accounts.collection.key(),
            }),
            uses: None,
        },
        true,
        true,
        None,
    )?;

    msg!("Creating master edition...");
    create_master_edition_v3(
        CpiContext::new_with_signer(
            ctx.accounts.metadata_program.to_account_info(),
            CreateMasterEditionV3 {
                edition: ctx.accounts.master_edition.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                update_authority: ctx.accounts.authority.to_account_info(),
                mint_authority: ctx.accounts.authority.to_account_info(),
                payer: ctx.accounts.payer.to_account_info(),
                metadata: ctx.accounts.metadata.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                rent: ctx.accounts.rent.to_account_info(),
            },
            signer_seeds,
        ),
        Some(0),
    )?;

    // If successful, clear any previous errors
    ai_agent.clear_error();

    // Transfer fee
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.treasury.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, AGENT_FEE)?;

    // Update treasury
    let treasury = &mut ctx.accounts.treasury;
    treasury.total_collected = treasury.total_collected.checked_add(AGENT_FEE).unwrap();

    msg!("AI Agent NFT minted successfully");
    Ok(())
}