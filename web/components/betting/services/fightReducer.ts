// fightReducer.ts

export type FightState = {
    status: 'no_fight' | 'betting_open' | 'active' | 'finished' | 'failed';
    activeFightId: string | null;
    activeFightSecureId: string | null;
    bets: {
      player1: number;
      player2: number;
    };
    currentState: {
      round: number;
      p1_health: number;
      p2_health: number;
      timestamp: number;
    };
    streamUrl: string | null;
    winner: string | null;
  };
  
  export type FightAction =
    | { type: 'INITIALIZE_FIGHT'; payload: { fightId: string; secureId: string; status: 'betting_open' } }
    | { type: 'UPDATE_BETS'; payload: { player: 'player1' | 'player2'; amount: number } }
    | { type: 'START_FIGHT'; payload: { status: 'active'; streamUrl: string } }
    | { type: 'UPDATE_FIGHT_STATUS'; payload: Partial<FightState> }
    | { type: 'END_FIGHT'; payload: { status: 'finished'; winner: string } }
    | { type: 'ERROR'; payload: string };
  
  export function fightReducer(state: FightState, action: FightAction): FightState {
    switch (action.type) {
      case 'INITIALIZE_FIGHT':
        return {
          ...state,
          status: action.payload.status,
          activeFightId: action.payload.fightId,
          activeFightSecureId: action.payload.secureId,
          bets: { player1: 0, player2: 0 },
          currentState: {
            round: 0,
            p1_health: 100,
            p2_health: 100,
            timestamp: Date.now()
          },
          streamUrl: null,
          winner: null
        };
      case 'UPDATE_BETS':
        return {
          ...state,
          bets: {
            ...state.bets,
            [action.payload.player]: action.payload.amount
          }
        };
      case 'START_FIGHT':
        return {
          ...state,
          status: action.payload.status,
          streamUrl: action.payload.streamUrl
        };
      case 'UPDATE_FIGHT_STATUS':
        return { ...state, ...action.payload };
      case 'END_FIGHT':
        return {
          ...state,
          status: action.payload.status,
          winner: action.payload.winner
        };
      case 'ERROR':
        return { ...initialState, status: 'failed' };
      default:
        return state;
    }
  }
  
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