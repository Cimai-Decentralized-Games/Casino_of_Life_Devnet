export interface Tournament {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    status: 'qualifying' | 'seeding' | 'active' | 'completed';
    regions: Region[];
    rounds: Round[];
    currentRound: number;
  }
  
  export interface Region {
    id: string;
    name: 'East' | 'West' | 'North' | 'South';
    seeds: Seed[];
  }
  
  export interface Seed {
    position: number;
    teamId: string;
    record: string;
    winRate: number;
  }
  
  export interface Round {
    id: string;
    name: string;
    matches: Match[];
    startDate: Date;
    endDate: Date;
    status: 'pending' | 'active' | 'completed';
  }
  
  export interface Match {
    id: string;
    roundId: string;
    team1Id: string;
    team2Id: string;
    winner?: string;
    games: Game[];
    status: 'pending' | 'active' | 'completed';
  }
  
  export interface Game {
    id: string;
    matchId: string;
    team1Score: number;
    team2Score: number;
    replayPath?: string;
    status: 'pending' | 'active' | 'completed';
  }
  
  export interface Team {
    id: string;
    name: string;
    trainerId: string;
    modelPath: string;
    character: string;
    seed?: number;
    region?: string;
    stats: TeamStats;
  }
  
  export interface TeamStats {
    wins: number;
    losses: number;
    winRate: number;
    avgDamageDealt: number;
    avgRoundTime: number;
    totalMatches: number;
  }