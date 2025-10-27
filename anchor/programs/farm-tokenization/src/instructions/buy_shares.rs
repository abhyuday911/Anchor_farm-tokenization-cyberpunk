use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};

use crate::Farm;
pub use crate::UserStake;

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut)]
    pub farm: Account<'info, Farm>,

    /// CHECK: PDA Signer
    pub farm_signer: UncheckedAccount<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    // we deduct money from here.
    #[account(mut)]
    pub payer_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub farm_payment_vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub farm_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub investor_farm_token_ata: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds= [b"user", farm.key().as_ref(), payer.key().as_ref()],
        bump,
        space= 8 + UserStake::INIT_SPACE
    )]
    pub user: Account<'info, UserStake>,
    pub system_program: Program<'info, System>,
}

pub fn buy_shares() -> Result<()> {
    Ok(())
}
