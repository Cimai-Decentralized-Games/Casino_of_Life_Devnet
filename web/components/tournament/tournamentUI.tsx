'use client';

import React from 'react';
import { TournamentContainer } from '@/components/tournament/tournamentContainer';

// This is temporary mock data until we connect to the backend
const mockTournament = {
  id: '1',
  name: 'MK2 National Championship',
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  status: 'active' as const,
  regions: [
    { id: '1', name: 'East' as const, seeds: [] },
    { id: '2', name: 'West' as const, seeds: [] },
    { id: '3', name: 'North' as const, seeds: [] },
    { id: '4', name: 'South' as const, seeds: [] }
  ],
  rounds: [
    {
      id: '1',
      name: 'First Round',
      matches: [],
      startDate: new Date(),
      endDate: new Date(),
      status: 'pending' as const
    }
  ],
  currentRound: 1
};

export function TournamentPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-base-content">
            National AI Fighting Championship
          </h1>
          <p className="mt-2 text-xl text-base-content/80">
            64 Teams. Single Elimination. One Champion.
          </p>
        </div>
        
        <TournamentContainer initialTournament={mockTournament} />
      </div>
    </div>
  );
}

