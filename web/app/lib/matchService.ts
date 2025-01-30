export interface MatchRequest {
    matchId: string;
    team1ModelPath: string;
    team2ModelPath: string;
    numGames: number;
  }
  
  export interface MatchResult {
    matchId: string;
    games: Array<{
      id: string;
      team1Score: number;
      team2Score: number;
      replayPath: string;
    }>;
    winner: string;
    replayPaths: string[];
  }
  
  export class MatchService {
    private apiUrl = process.env.TOURNAMENT_SERVICE_URL;
  
    async executeMatch(matchRequest: MatchRequest): Promise<MatchResult> {
      const response = await fetch(`${this.apiUrl}/execute-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(matchRequest),
      });
  
      if (!response.ok) {
        throw new Error('Failed to execute match');
      }
  
      return await response.json();
    }
  }