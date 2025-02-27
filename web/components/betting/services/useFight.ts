import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { fightReducer, FightState, FightAction } from './fightReducer';
import { useSolana, TokenType } from './useSolana';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';

const initialState: FightState = {
  status: 'no_fight',
  activeFightId: null,
  activeFightSecureId: null,
  bets: {
    player1: 0,
    player2: 0,
    maxBet: 0,
    minBet: 0
  },
  currentState: {
    round: 0,
    p1_health: 100,
    p2_health: 100,
    timestamp: 0
  },
  streamUrl: null,
  winner: null,
};

export const useFight = () => {
  const [state, dispatch] = useReducer(fightReducer, initialState);
  const isInitializingFightRef = useRef(false);
    const { 
        placeBet: handlePlaceBet, 
        handleCashOut: handleSolanaCashOut, 
        handleMintDumbsForWin, 
        connection, 
        walletProvider 
    } = useSolana();
    const [isBetPlaced, setIsBetPlaced] = useState(false);

  const initializeFightForBetting = useCallback(async () => {
    if (isInitializingFightRef.current) {
      console.log('Already initializing a fight for betting. Ignoring this call.');
      return;
    }

    isInitializingFightRef.current = true;

    try {
      const response = await fetch('/api/fight-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initializeFight'
        })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.fight) {
        dispatch({ 
          type: 'INITIALIZE_FIGHT', 
          payload: { 
            fightId: data.fight.fightid,
            secureId: data.fight.secureId,
            status: data.fight.status,
            maxBet: 1000000, // 1M DUMBS
            minBet: 10 // 10 DUMBS
          } 
        });
      }
    } catch (error) {
      console.error('Error initializing fight for betting:', error);
      dispatch({ type: 'ERROR', payload: 'Error initializing fight for betting' });
      if (error instanceof Error) {
        alert(`Failed to initialize fight for betting. Error: ${error.message}`);
      } else {
        alert('Failed to initialize fight for betting. Please try again.');
      }
    } finally {
      isInitializingFightRef.current = false;
    }
  }, []);

  const fetchAndUpdateFightStatus = useCallback(async () => {
    if (state.activeFightId) {
      try {
        console.log('Fetching update for fight:', state.activeFightId);
        
        const response = await fetch('/api/fight-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateState',
            fightId: state.activeFightId
          })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.fight) {
          console.log('Fight update received:', data.fight);
          
          const shouldContinuePolling = 
            data.fight.status !== 'completed' || 
            (data.fight.status === 'completed' && !data.fight.winner);

          dispatch({ 
            type: 'UPDATE_FIGHT_STATUS', 
            payload: data.fight 
          });

          if (data.fight.status === 'completed' && data.fight.winner) {
            console.log('Fight completed with winner:', data.fight.winner);
            // Any end-of-fight cleanup here
          }

          return shouldContinuePolling;
        }
      } catch (error) {
        console.error('Error in fetchAndUpdateFightStatus:', error);
        return false;
      }
    }
    return false;
  }, [state.activeFightId]);

  const placeBet = useCallback(async (player: 'player1' | 'player2', amount: number, tokenType: TokenType) => {
    if (!state.activeFightId || !state.activeFightSecureId) {
      console.error('No active fight to place bet for');
      return;
    }

    // Add bet amount validation
    if (amount < state.bets.minBet || amount > state.bets.maxBet) {
      console.error('Bet amount outside allowed range');
      alert(`Bet amount must be between ${state.bets.minBet} and ${state.bets.maxBet} DUMBS`);
      return;
    }

    try {
      // Call the consolidated placeBet function
      await handlePlaceBet(
        state.activeFightId,
        player,
        amount,
        tokenType,
        state.activeFightSecureId
      );

      // If the transaction is successful, proceed with the API call
      const response = await fetch('/api/fight-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'placeBet',
          fightId: state.activeFightId, 
          player, 
          amount,
          tokenType // Add tokenType to API call
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      dispatch({ 
        type: 'UPDATE_BETS', 
        payload: { 
          player, 
          amount: data.amount,
          tokenType // Add tokenType to dispatch
        } 
      });
       setIsBetPlaced(true);
      await fetchAndUpdateFightStatus();
    } catch (error) {
      console.error('Error in placeBet:', error);
        setIsBetPlaced(false);
      if (error instanceof Error) {
        alert(`Failed to place bet. Error: ${error.message}`);
      } else {
        alert('Failed to place bet. Unknown error occurred.');
      }
    }
  }, [state.activeFightId, state.activeFightSecureId, handlePlaceBet, fetchAndUpdateFightStatus]);

  const startFightAfterBetting = useCallback(async () => {
    if (!state.activeFightId || !state.activeFightSecureId) {
      console.error('No active fight to start', state);
      return;
    }

    console.log('Starting fight after betting');
    
    try {
      const response = await fetch('/api/fight-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'startFight',
          fightId: state.activeFightId, 
          secureId: state.activeFightSecureId 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Start fight response:', data);
      
      // Generate stream URL directly from fightId
      const streamUrl = `https://stream.cimai.biz/hls/${state.activeFightId}/output.m3u8`;
      
      dispatch({ 
        type: 'START_FIGHT', 
        payload: { 
          status: 'in_progress',
          streamUrl: streamUrl 
        } 
      });

    } catch (error) {
      console.error('Error starting fight:', error);
      dispatch({
        type: 'UPDATE_FIGHT_STATUS',
        payload: { status: 'betting_open' }
      });
      alert(error instanceof Error ? error.message : 'Failed to start fight');
    }
  }, [state.activeFightId, state.activeFightSecureId]);

   const handleCashOut = useCallback(async () => {
    if (!state.activeFightSecureId) {
      console.error('No active fight for cashout');
      return;
    }

      try {
        await handleSolanaCashOut(state.activeFightSecureId, state);
      } catch (error) {
        console.error('Error in handleCashOut:', error);
          if (error instanceof Error) {
              alert(`Failed to cash out. Error: ${error.message}`);
          } else {
              alert('Failed to cash out. Unknown error occurred.');
          }
      }
  }, [state, handleSolanaCashOut]);

    const mintDumbsForWin = useCallback(async () => {
         if (!state.activeFightSecureId) {
            console.error('No active fight for minting DUMBS');
            return;
        }

        if (!isBetPlaced) {
           alert('Please place a bet before attempting to mint DUMBS.');
           return;
        }
        
        try {
            await handleMintDumbsForWin(state.activeFightSecureId, state);
        } catch (error) {
            console.error('Error minting dumbs for win:', error);
             if (error instanceof Error) {
              alert(`Failed to Mint DUMBS for win. Error: ${error.message}`);
              } else {
                alert('Failed to Mint DUMBS for win. Unknown error occurred.');
              }
          }
    }, [state, handleMintDumbsForWin, isBetPlaced]);


  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (state.status === 'in_progress') {
      console.log('Starting fight polling');
      
      const poll = () => {
        fetchAndUpdateFightStatus().then(shouldContinue => {
          if (shouldContinue) {
            interval = setTimeout(poll, 1000);
          } else {
            console.log('Stopping fight polling - fight complete or error');
          }
        });
      };

      poll(); // Start polling
    }

    return () => {
      if (interval) {
        console.log('Clearing fight polling interval');
        clearTimeout(interval);
      }
    };
  }, [state.status, fetchAndUpdateFightStatus]);

    useEffect(() => {
        if (state.status === 'completed' && state.winner && state.activeFightSecureId) {
            console.log('Checking for cashout and minting')
            mintDumbsForWin();
        }
    }, [state.status, state.winner, mintDumbsForWin, state.activeFightSecureId]);

  return {
    fightState: state,
    initializeFightForBetting,
    placeBet,
    startFightAfterBetting,
    fetchAndUpdateFightStatus,
    handleCashOut,
    handleMintDumbsForWin: mintDumbsForWin,
    connection,
    walletProvider
  };
};