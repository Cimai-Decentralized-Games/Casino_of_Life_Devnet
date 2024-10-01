// useFight.ts
import { useReducer, useCallback, useRef, useEffect } from 'react';
import { fightReducer, FightState, FightAction } from './fightReducer';
import { useSolana } from './useSolana'; // Import the Solana function


const initialState: FightState = {
  status: 'no_fight',
  activeFightId: null,
  activeFightSecureId: null,
  bets: {
    player1: 0,
    player2: 0
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
  const lastFetchedDataRef = useRef<any>(null);
  const { placeSolanaBet } = useSolana();
  

  const initializeFightForBetting = useCallback(async () => {
    if (isInitializingFightRef.current) {
      console.log('Already initializing a fight for betting. Ignoring this call.');
      return;
    }

    isInitializingFightRef.current = true;

    try {
      const response = await fetch('/api/fight/initialize-betting', { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.fight && data.fight.id) {
        dispatch({ 
          type: 'INITIALIZE_FIGHT', 
          payload: { 
            fightId: data.fight.id, 
            secureId: data.fight.secureId,
            status: 'betting_open'
          } 
        });
      } else {
        throw new Error('Invalid fight data returned from API');
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

  const placeBet = useCallback(async (player: 'player1' | 'player2', amount: number) => {
    if (!state.activeFightId) {
      console.error('No active fight to place bet for');
      return;
    }

    try {
      // First, call the Solana function to handle the blockchain transaction
      await placeSolanaBet(state.activeFightId, player, amount);

      // If the Solana transaction is successful, proceed with the API call
      const response = await fetch('/api/betting/place-bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fightId: state.activeFightId, player, amount }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      dispatch({ type: 'UPDATE_BETS', payload: { player, amount: data.newBetAmount } });

      // Fetch the updated fight status after placing the bet
      await fetchAndUpdateFightStatus();

    } catch (error) {
      console.error('Error in placeBet:', error);
      if (error instanceof Error) {
        alert(`Failed to place bet. Error: ${error.message}`);
      } else {
        alert('Failed to place bet. Unknown error occurred.');
      }
    }
  }, [state.activeFightId, placeSolanaBet ]);

  const startFightAfterBetting = useCallback(async () => {
    if (!state.activeFightId || !state.activeFightSecureId) {
      console.error('No active fight to start');
      return;
    }

    try {
      const response = await fetch('/api/fight/start-after-betting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fightId: state.activeFightId, secureId: state.activeFightSecureId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const streamUrl = `http://localhost/hls/stream.m3u8?fightId=${state.activeFightId}`;
      
      dispatch({ 
        type: 'START_FIGHT', 
        payload: { 
          status: 'active', 
          streamUrl: streamUrl,
        } 
      });

      console.log('Fight started, streamUrl set to:', streamUrl);

    } catch (error) {
      console.error('Error in startFightAfterBetting:', error);
      dispatch({ type: 'ERROR', payload: 'Error occurred while starting the fight' });
    }
  }, [state.activeFightId, state.activeFightSecureId ]);

  const fetchAndUpdateFightStatus = useCallback(async () => {
    if (state.activeFightId) {
      try {
        console.log('Fetching fight status for fight:', state.activeFightId);
        const response = await fetch(`/api/fight/update?fightId=${state.activeFightId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const data = await response.json();
        console.log('Received fight data:', data);
        
        if (JSON.stringify(data) !== JSON.stringify(lastFetchedDataRef.current)) {
          console.log('Updating fight state with new data');
          lastFetchedDataRef.current = data;
          dispatch({ type: 'UPDATE_FIGHT_STATUS', payload: data });
        } else {
          console.log('No changes in fight data');
        }
      } catch (error) {
        console.error('Error in fetchAndUpdateFightStatus:', error);
        // Handle the error appropriately, maybe set an error state
        // dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    }
  }, [state.activeFightId, dispatch]);

  useEffect(() => {
    if (state.status !== 'no_fight') {
      const interval = setInterval(fetchAndUpdateFightStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [state.status, fetchAndUpdateFightStatus]);

  return {
    fightState: state,
    initializeFightForBetting,
    placeBet,
    startFightAfterBetting,
    fetchAndUpdateFightStatus,
  };
};