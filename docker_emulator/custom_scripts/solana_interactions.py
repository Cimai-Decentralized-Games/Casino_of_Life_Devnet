import asyncio
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Confirmed

async def async_record_save_state_on_chain(state_hash, p1_health, p2_health, round_number, p1_score, p2_score, game_clock):
    async with AsyncClient("https://api.devnet.solana.com") as client:
        await client.is_connected()
        
        # Construct and send transaction to your Solana program
        # This is a placeholder - you'll need to implement the actual transaction logic
        transaction = await construct_record_save_state_transaction(
            state_hash, p1_health, p2_health, round_number, p1_score, p2_score, game_clock
        )
        await client.send_transaction(transaction, commitment=Confirmed)

def record_save_state_on_chain(state_hash, p1_health, p2_health, round_number, p1_score, p2_score, game_clock):
    asyncio.run(async_record_save_state_on_chain(state_hash, p1_health, p2_health, round_number, p1_score, p2_score, game_clock))

# You'll need to implement this function based on your Solana program structure
async def construct_record_save_state_transaction(state_hash, p1_health, p2_health, round_number, p1_score, p2_score, game_clock):
    # Implement the logic to construct the Solana transaction here
    pass