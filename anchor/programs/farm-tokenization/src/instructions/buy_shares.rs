use anchor_lang::prelude::*;
use anchor_spl::token::{self, transfer, Mint, MintTo, Token, TokenAccount, Transfer};

pub use crate::UserStake;
use crate::{error::ErrorCode, Farm};

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
        init_if_needed,
        payer = payer,
        seeds= [b"user", farm.key().as_ref(), payer.key().as_ref()],
        bump,
        space= 8 + UserStake::INIT_SPACE
    )]
    pub user: Account<'info, UserStake>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

pub fn buy_shares(ctx: Context<BuyShares>, amount: u64, pay_amount: u64) -> Result<()> {
    let farm = &mut ctx.accounts.farm;
    // let farm_signer = &ctx.accounts.farm_signer;
    require!(amount > 0, ErrorCode::InvalidShares);

    let new_minted = farm
        .minted_shares
        .checked_add(amount)
        .ok_or(ErrorCode::Overflow)?;
    require!(
        new_minted <= farm.total_shares,
        ErrorCode::ExceedsTotalSupply
    );

    // payer ata account to farm-payment-vault
    // this tramsaction is approved by user when he will sign the transaction from his wallet.
    let cpi_accounts = Transfer {
        from: ctx.accounts.payer_ata.to_account_info(),
        to: ctx.accounts.farm_payment_vault.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    transfer(CpiContext::new(cpi_program, cpi_accounts), pay_amount)?;

    let farm_key = farm.key();
    // token to payers ata
    let seeds = &[b"farm".as_ref(), farm_key.as_ref(), &[farm.signer_bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts_mint = MintTo {
        mint: ctx.accounts.farm_token_mint.to_account_info(),
        to: ctx.accounts.investor_farm_token_ata.to_account_info(),
        authority: ctx.accounts.farm_signer.to_account_info(),
    };
    token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_mint,
            signer,
        ),
        amount,
    )?;

    // update farm minted-shares
    farm.minted_shares = new_minted;

    // update/create) user stake account
    let user = &mut ctx.accounts.user;
    if user.is_initialized == false {
        user.is_initialized = true;
        user.owner = *ctx.accounts.payer.key;
        user.farm = farm.key();
        user.quantity = 0u32;
        user.debt_claimed = 0u128;
        user.bump = ctx.bumps.user;
    }

    let new_quantity = (user.quantity as u128)
        .checked_add(amount as u128)
        .ok_or(ErrorCode::Overflow)?;
    user.quantity = new_quantity as u32;
    user.debt_claimed = 0;
    Ok(())
}
