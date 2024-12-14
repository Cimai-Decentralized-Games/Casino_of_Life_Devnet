// fightReducer.ts

export type FightStatus = 
  | 'no_fight' 
  | 'betting_open' 
  | 'in_progress' 
  | 'completed' 
  | 'error';

export type FightState = {
    status: FightStatus;
    activeFightId: string | null;
    activeFightSecureId: string | null;
    bets: {
      player1: number;
      player2: number;
      maxBet: number;
      minBet: number;
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
  | { type: 'INITIALIZE_FIGHT'; payload: { 
      fightId: string; 
      secureId: string; 
      status: 'betting_open';
      maxBet: number;
      minBet: number;
    }}
  | { type: 'UPDATE_BETS'; payload: { player: 'player1' | 'player2'; amount: number } }
  | { type: 'START_FIGHT'; payload: { status: 'in_progress'; streamUrl: string } }
  | { type: 'UPDATE_FIGHT_STATUS'; payload: Partial<FightState> }
  | { type: 'STREAM_READY' }
  | { type: 'END_FIGHT'; payload: { status: 'completed'; winner: string } }
  | { type: 'ERROR'; payload: string };

export function fightReducer(state: FightState, action: FightAction): FightState {
  switch (action.type) {
    case 'INITIALIZE_FIGHT':
      return {
        ...state,
        status: action.payload.status,
        activeFightId: action.payload.fightId,
        activeFightSecureId: action.payload.secureId,
        bets: { 
          player1: 0, 
          player2: 0, 
          maxBet: action.payload.maxBet, 
          minBet: action.payload.minBet 
        },
        currentState: {
          round: 0,
          p1_health: 120,
          p2_health: 120,
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
      console.log('Reducer updating fight status:', action.payload);
      return {
        ...state,
        streamUrl: action.payload.streamUrl || state.streamUrl,
        status: action.payload.status || state.status,
        currentState: {
          round: action.payload.currentState?.round ?? state.currentState.round,
          p1_health: action.payload.currentState?.p1_health ?? state.currentState.p1_health,
          p2_health: action.payload.currentState?.p2_health ?? state.currentState.p2_health,
          timestamp: action.payload.currentState?.timestamp ?? state.currentState.timestamp
        },
        winner: action.payload.winner || state.winner
      };
    case 'END_FIGHT':
      return {
        ...state,
        status: action.payload.status,
        winner: action.payload.winner
      };
    case 'ERROR':
      return { ...initialState, status: 'error' };
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
    player2: 0,
    maxBet: 0,
    minBet: 0
  },
  currentState: {
    round: 0,
    p1_health: 120,
    p2_health: 120,
    timestamp: 0
  },
  streamUrl: null,
  winner: null,
};