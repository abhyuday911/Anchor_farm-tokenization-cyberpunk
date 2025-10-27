import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import { FarmTokenization } from "../target/types/farm_tokenization";


describe("farm_initialize hybrid", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FarmTokenization as Program<FarmTokenization>;

  const owner = provider.wallet.publicKey;

  let farmPda: PublicKey;
  let farmSignerPda: PublicKey;
  let farmTokenMint: PublicKey;

  it("Initialize Farm", async () => {
    farmTokenMint = await createMint(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      owner,
      null,
      9
    );

    [farmPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm"), owner.toBuffer()],
      program.programId
    );

    [farmSignerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm-signer"), farmPda.toBuffer()],
      program.programId
    );

    const tx = await program.methods
      .farmInitialize(new anchor.BN(1000))
      .accounts({
        owner,
        farm: farmPda,
        farmTokenMint,
        farmSigner: farmSignerPda,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY
      })
      .rpc();

    console.log("Transaction:", tx);

    const farmState = await program.account.farm.fetch(farmPda);
    expect(farmState.owner.toString()).toEqual(owner.toString());
    expect(farmState.totalShares.toNumber()).toEqual(1000);
    expect(farmState.farmTokenMint.toString()).toEqual(farmTokenMint.toString());
  });
});
