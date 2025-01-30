'use client';

import React from 'react';
import { Tournament } from '@/types/tournament';

interface TournamentControlsProps {
  tournament: Tournament;
  onAdvanceRound?: () => void;
  onPauseResume?: () => void;
}

export const TournamentControls: React.FC<TournamentControlsProps> = ({
  tournament,
  onAdvanceRound,
  onPauseResume
}) => {
  return (
    <div className="tournament-controls flex gap-4 mb-6">
      <button 
        className="btn btn-primary"
        onClick={onAdvanceRound}
        disabled={tournament.status !== 'active'}
      >
        Advance Round
      </button>
      <button 
        className="btn btn-secondary"
        onClick={onPauseResume}
      >
        {tournament.status === 'active' ? 'Pause' : 'Resume'}
      </button>
    </div>
  );
};