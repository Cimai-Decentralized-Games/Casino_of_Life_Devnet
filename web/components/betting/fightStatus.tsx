// FightStatus.tsx
import React from 'react';
import { FightState } from './services/fightReducer';

interface FightStatusProps {
  fightState: FightState;
}

export const FightStatus: React.FC<FightStatusProps> = ({ fightState }) => {
  const renderHealthBar = (health: number, player: string) => (
    <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
      <div
        className={`h-4 rounded-full ${player === 'p1' ? 'bg-red-500' : 'bg-blue-500'}`}
        style={{ width: `${Math.max(0, Math.min(100, health))}%` }}
      >
        <span className="px-2 text-xs text-white font-bold">{Math.max(0, Math.min(100, health))}%</span>
      </div>
    </div>
  );

  const renderFightInfo = () => {
    if (fightState.status === 'no_fight') return null;

    return (
      <div className="space-y-4">
        {/* Fight ID and Round */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Fight ID</div>
            <div className="stat-value text-xs">{fightState.activeFightId}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Round</div>
            <div className="stat-value">{fightState.currentState.round}</div>
          </div>
        </div>

        {/* Health Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-semibold">Player 1</span>
              <span className="text-sm font-semibold">{fightState.currentState.p1_health}%</span>
            </div>
            {renderHealthBar(fightState.currentState.p1_health, 'p1')}
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-semibold">Player 2</span>
              <span className="text-sm font-semibold">{fightState.currentState.p2_health}%</span>
            </div>
            {renderHealthBar(fightState.currentState.p2_health, 'p2')}
          </div>
        </div>

        {/* Betting Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Player 1 Bets</div>
            <div className="stat-value text-sm">
              {typeof fightState.bets.player1 === 'number' 
                ? `${fightState.bets.player1} DUMBS` 
                : '0 DUMBS'}
            </div>
          </div>
          <div className="stat bg-base-200 rounded-lg p-4">
            <div className="stat-title">Player 2 Bets</div>
            <div className="stat-value text-sm">
              {typeof fightState.bets.player2 === 'number' 
                ? `${fightState.bets.player2} DUMBS` 
                : '0 DUMBS'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStatus = () => {
    const statusClasses = {
      'no_fight': 'badge-neutral',
      'betting_open': 'badge-warning',
      'in_progress': 'badge-success',
      'completed': 'badge-info',
      'error': 'badge-error'
    };

    return (
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="font-bold">Status:</span>
          <span className={`badge ${statusClasses[fightState.status]}`}>
            {fightState.status === 'no_fight' && 'No Active Fight'}
            {fightState.status === 'betting_open' && 'Betting Open'}
            {fightState.status === 'in_progress' && 'Fight in Progress'}
            {fightState.status === 'completed' && 'Fight Finished'}
            {fightState.status === 'error' && 'Fight Failed'}
          </span>
        </div>
        {fightState.winner && (
          <div className="flex items-center gap-2">
            <span className="font-bold">Winner:</span>
            <span className="badge badge-success text-sm px-3 py-1">
              {fightState.winner === 'player1' ? 'Player 1' : 'Player 2'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      {renderStatus()}
      {renderFightInfo()}
    </div>
  );
};

export default FightStatus;