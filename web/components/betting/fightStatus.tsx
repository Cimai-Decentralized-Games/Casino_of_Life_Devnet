// FightStatus.tsx
import React from 'react';
import { FightState } from './services/fightReducer';

interface FightStatusProps {
  fightState: FightState;
}

export const FightStatus: React.FC<FightStatusProps> = ({ fightState }) => {
  const renderStatus = () => {
    switch (fightState.status) {
      case 'no_fight':
        return 'No active fight';
      case 'betting_open':
        return 'Betting is open';
      case 'active':
        return 'Fight in progress';
      case 'finished':
        return `Fight finished. Winner: ${fightState.winner || 'Not determined'}`;
      case 'failed':
        return 'Fight failed to start';
      default:
        return 'Unknown status';
    }
  };

  const renderBets = () => {
    if (fightState.status === 'betting_open' || fightState.status === 'active') {
      return (
        <div>
          <p>Current Bets:</p>
          <p>Player 1: {fightState.bets.player1} DUMBS</p>
          <p>Player 2: {fightState.bets.player2} DUMBS</p>
        </div>
      );
    }
    return null;
  };

  const renderFightInfo = () => {
    if (fightState.status === 'active' && fightState.currentState) {
      return (
        <div>
          <p>Round: {fightState.currentState.round}</p>
          <p>Player 1 Health: {fightState.currentState.p1_health}</p>
          <p>Player 2 Health: {fightState.currentState.p2_health}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mt-4">
      <p>Fight Status: <span className="font-semibold">{renderStatus()}</span></p>
      {renderBets()}
      {renderFightInfo()}
      {fightState.streamUrl && (
        <p>Stream URL: <a href={fightState.streamUrl} target="_blank" rel="noopener noreferrer">Watch Fight</a></p>
      )}
    </div>
  );
};