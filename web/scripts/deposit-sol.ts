import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import * as fs from 'fs';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';

const PROGRAM_ID = new PublicKey('5FwvYgAChMwMsBrmSKBBZeWRGX27p62G3o3UsBQjhVJZ');

async function main() {
    // Load your admin keypair
    const adminKeypairFile = fs.readFileSync('/Users/caballoloko/.config/solana/new_program_keypair.json');
    const adminKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(adminKeypairFile.toString())));

    // Setup connection and provider
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const wallet = new Wallet(adminKeypair);
    const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
    });

    // Create program with imported IDL
    const program = getBettingProgram(provider);

    // Find PDAs
    const [bettingState] = PublicKey.findProgramAddressSync(
        [Buffer.from("betting_state")],
        PROGRAM_ID
    );
    const [solVault] = PublicKey.findProgramAddressSync(
        [Buffer.from("sol_vault")],
        PROGRAM_ID
    );
    const [dumbsMint] = PublicKey.findProgramAddressSync(
        [Buffer.from("dumbs_mint")],
        PROGRAM_ID
    );
    const [treasury] = PublicKey.findProgramAddressSync(
        [Buffer.from("treasury")],
        PROGRAM_ID
    );

    // Get admin's DUMBS ATA
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, adminKeypair.publicKey);

    console.log('Accounts:');
    console.log('Admin:', adminKeypair.publicKey.toBase58());
    console.log('Betting State:', bettingState.toBase58());
    console.log('SOL Vault:', solVault.toBase58());
    console.log('DUMBS Mint:', dumbsMint.toBase58());
    console.log('Treasury:', treasury.toBase58());
    console.log('User DUMBS Account:', userDumbsAccount.toBase58());

    try {
        // Amount in lamports (1 SOL = 1000000000 lamports)
        const depositAmount = new BN(1000000000); // 1 SOL

        console.log('Depositing', depositAmount.toString(), 'lamports...');

        const tx = await program.methods
            .depositSol(depositAmount)
            .accounts({
                depositor: adminKeypair.publicKey,
                solVault: solVault,
                dumbsMint: dumbsMint,
                userDumbsAccount: userDumbsAccount,
                bettingState: bettingState,
                treasury: treasury,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            } as any)
            .rpc();

        console.log('Transaction successful:', tx);

        // Check balances
        const solBalance = await connection.getBalance(adminKeypair.publicKey);
        const dumbsBalance = await connection.getTokenAccountBalance(userDumbsAccount);

        console.log('New balances:');
        console.log('SOL:', solBalance / 1e9);
        console.log('DUMBS:', dumbsBalance.value.uiAmount);

    } catch (error) {
        console.error('Error:', error);
        if ('logs' in error) {
            console.error('Program logs:', error.logs);
        }
    }
}

main().catch(console.error);