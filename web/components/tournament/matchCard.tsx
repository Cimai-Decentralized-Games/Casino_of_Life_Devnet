'use client';

import React from 'react';
import { Match } from '@/types/tournament';

interface MatchCardProps {
  match: Match;
  onClick?: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onClick }) => {
  return (
    <div 
      className="match-card bg-base-200 p-4 rounded-lg cursor-pointer hover:bg-base-300"
      onClick={onClick}
    >
      <div className="team-row flex justify-between items-center mb-2">
        <span className="team-name">{match.team1Id}</span>
        <span className="score">{match.games.reduce((sum, game) => sum + (game.team1Score > game.team2Score ? 1 : 0), 0)}</span>
      </div>
      <div className="team-row flex justify-between items-center">
        <span className="team-name">{match.team2Id}</span>
        <span className="score">{match.games.reduce((sum, game) => sum + (game.team2Score > game.team1Score ? 1 : 0), 0)}</span>
      </div>
    </div>
  );
};