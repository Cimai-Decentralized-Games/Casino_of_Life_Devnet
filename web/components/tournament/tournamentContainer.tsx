'use client';

import React, { useEffect, useState } from 'react';
import { Tournament, Match } from '@/types/tournament';
import { MatchService } from '@/app/lib/matchService';
import { TournamentBracket } from './tournamentBracket';
import { TournamentControls } from './tournamentControls';
import { MatchCard } from './matchCard';

interface TournamentContainerProps {
  initialTournament: Tournament;
}

export const TournamentContainer: React.FC<TournamentContainerProps> = ({
  initialTournament
}) => {
  const [tournament, setTournament] = useState<Tournament>(initialTournament);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const matchService = new MatchService();

  const handleMatchSelect = (match: Match) => {
    setSelectedMatch(match);
  };

  const handleAdvanceRound = async () => {
    try {
      // Implementation for advancing tournament round
      // This would involve calling your backend API
    } catch (error) {
      console.error('Failed to advance round:', error);
    }
  };

  const handlePauseResume = async () => {
    try {
      // Implementation for pausing/resuming tournament
      // This would involve calling your backend API
    } catch (error) {
      console.error('Failed to pause/resume tournament:', error);
    }
  };

  return (
    <div className="tournament-container p-6">
      <h1 className="text-3xl font-bold mb-6">{tournament.name}</h1>
      
      <TournamentControls 
        tournament={tournament}
        onAdvanceRound={handleAdvanceRound}
        onPauseResume={handlePauseResume}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <TournamentBracket 
            tournament={tournament}
            onMatchSelect={handleMatchSelect}
          />
        </div>
        
        <div className="tournament-sidebar">
          {selectedMatch && (
            <div className="selected-match bg-base-200 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Match Details</h2>
              <MatchCard match={selectedMatch} />
              {/* Add more match details as needed */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};