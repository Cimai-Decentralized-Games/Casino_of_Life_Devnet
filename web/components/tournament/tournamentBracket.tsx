'use client';

import React from 'react';
import { Tournament, Match } from '@/types/tournament';
import { MatchCard } from './matchCard';

interface TournamentBracketProps {
  tournament: Tournament;
  onMatchSelect?: (match: Match) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  onMatchSelect
}) => {
  return (
    <div className="tournament-bracket">
      {tournament.rounds.map((round, roundIndex) => (
        <div key={round.id} className="round">
          <h3 className="text-lg font-semibold mb-4">{round.name}</h3>
          <div className="matches-column">
            {round.matches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onClick={() => onMatchSelect?.(match)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};