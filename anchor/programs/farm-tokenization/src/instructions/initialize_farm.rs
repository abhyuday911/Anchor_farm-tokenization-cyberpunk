use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

pub use crate::states::Farm;
#[derive(Accounts)]
pub struct InitializeFarm<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [b"farm", owner.key().as_ref()],
        bump,
        payer = owner,
        space = 8 + Farm::INIT_SPACE,
    )]
    pub farm: Account<'info, Farm>,

    #[account(
        init_if_needed,
        payer = owner,
        mint::decimals = 6,
        mint::authority = farm_signer.key(),
        mint::freeze_authority = farm_signer.key(),
        seeds = [b"farm_token_mint",farm.key().as_ref()],
        bump
    )]
    pub farm_token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        seeds = [b"farm", farm.key().as_ref()],
        bump,
        payer = owner,
        space = 8,
    )]
    /// CHECK: PDA signer
    pub farm_signer: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        token::mint = payment_mint,
        token::authority = farm_signer,
        seeds = [b"payment-vault", farm.key().as_ref()],
        bump,
        payer = owner
    )]
    pub farm_payment_vault: Account<'info, TokenAccount>,

    pub payment_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        token::mint = farm_token_mint,
        token::authority = farm_signer,
        seeds = [b"revenue-vault", farm.key().as_ref()],
        bump,
        payer = owner
    )]
    pub farm_revenue_vault: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_farm(
    ctx: Context<InitializeFarm>,
    total_shares: u64,
    price_per_share: u64,
) -> Result<()> {
    let farm = &mut ctx.accounts.farm;
    farm.owner = *ctx.accounts.owner.key;
    farm.farm_token_mint = ctx.accounts.farm_token_mint.key();

    farm.payment_mint = ctx.accounts.payment_mint.key();
    farm.farm_payment_vault = ctx.accounts.farm_payment_vault.key();
    farm.farm_revenue_vault = ctx.accounts.farm_revenue_vault.key();

    farm.total_shares = total_shares;
    farm.minted_shares = 0;
    farm.price_per_share = price_per_share;

    farm.account_revenue_per_share = 0;
    farm.bump = ctx.bumps.farm;
    farm.signer_bump = ctx.bumps.farm_signer;

    Ok(())
}
