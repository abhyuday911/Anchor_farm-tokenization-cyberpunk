import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAccount,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { FarmTokenization } from "../target/types/farm_tokenization";

describe("Farm lifecycle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FarmTokenization as Program<FarmTokenization>;

  const payer = provider.wallet;
  const farmOwnerPubKey = payer.publicKey;

  let farmPda: PublicKey;
  let farmSignerPda: PublicKey;
  let farmTokenMintPda: PublicKey;
  let farmPaymentVault: PublicKey;
  let farmRevenueVault: PublicKey;
  let paymentMint: PublicKey;

  let buyer: anchor.web3.Keypair;
  let buyerPaymentAta: PublicKey;

  beforeAll(async () => {
    [farmPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm"), farmOwnerPubKey.toBuffer()],
      program.programId
    );

    [farmSignerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm"), farmPda.toBuffer()],
      program.programId
    );

    [farmTokenMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm_token_mint"), farmPda.toBuffer()], program.programId
    );

    [farmPaymentVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment-vault"), farmPda.toBuffer()],
      program.programId
    );

    [farmRevenueVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("revenue-vault"), farmPda.toBuffer()],
      program.programId
    );


    paymentMint = await createMint(
      provider.connection,
      (payer as anchor.Wallet).payer,
      farmOwnerPubKey,
      null,
      6
    );

    buyer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 2e9)
    );

    buyerPaymentAta = await createAccount(
      provider.connection,
      (payer as anchor.Wallet).payer,
      paymentMint,
      buyer.publicKey
    );

    await mintTo(
      provider.connection,
      (payer as anchor.Wallet).payer,
      paymentMint,
      buyerPaymentAta,
      farmOwnerPubKey,
      1_000_000_000
    );
  });

  it("initializes the Farm", async () => {
    await program.methods
      .farmInitialize("Ramesh Farm",new anchor.BN(1_000_000), new anchor.BN(100))
      .accounts({
        owner: farmOwnerPubKey,
        farm: farmPda,
        farmSigner: farmSignerPda,
        paymentMint,
        farmPaymentVault,
        farmRevenueVault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([(payer as anchor.Wallet).payer])
      .rpc();

    const farmAccount = await program.account.farm.fetch(farmPda);
    expect(farmAccount.owner.toString()).toBe(farmOwnerPubKey.toString());
    expect(farmAccount.totalShares.toNumber()).toBe(1_000_000);
    expect(farmAccount.pricePerShare.toNumber()).toBe(100);


  });

  it("buys shares", async () => {
    const amount = new anchor.BN(500);
    const payAmount = new anchor.BN(50_000);

    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), farmPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .shareBuying(amount, payAmount)
      .accounts({
        farm: farmPda,
        farmSigner: farmSignerPda,
        payer: buyer.publicKey,
        payerAta: buyerPaymentAta,
        farmPaymentVault,
        farmTokenMint: farmTokenMintPda,
        user: userPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer])
      .rpc();

    const farmAccount = await program.account.farm.fetch(farmPda);
    expect(farmAccount.mintedShares.toNumber()).toBe(500);

    const userStake = await program.account.userStake.fetch(userPda);
    expect(userStake.owner.toBase58()).toBe(buyer.publicKey.toBase58());
    expect(userStake.quantity).toBe(500);
  });

  it("fail if amount == 0", async () => {
    const tx = program.methods
      .shareBuying(new anchor.BN(0), new anchor.BN(100))
      .accounts({
        farm: farmPda,
        farmSigner: farmSignerPda,
        payer: buyer.publicKey,
        payerAta: buyerPaymentAta,
        farmPaymentVault,
        farmTokenMint: farmTokenMintPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer]);

    await expect(tx.rpc()).rejects.toThrow("InvalidShares");
  });
});
