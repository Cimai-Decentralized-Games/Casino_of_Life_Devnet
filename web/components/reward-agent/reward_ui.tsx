'use client';

import { Keypair } from '@solana/web3.js';
import { useRewardAgentProgram } from './reward-data-access';

export function RewardAgentCreate() {
  const { createRewardAgent } = useRewardAgentProgram();

  return (
    <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={() => createRewardAgent.mutateAsync()}
      disabled={createRewardAgent.isPending}
    >
      Create Reward Agent{createRewardAgent.isPending && '...'}
    </button>
  );
}

export function RewardAgentProgram() {
  const { getRewardAgentAccount } = useRewardAgentProgram();

  if (getRewardAgentAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getRewardAgentAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={'space-y-6'}>
      <pre>{JSON.stringify(getRewardAgentAccount.data.value, null, 2)}</pre>
    </div>
  );
}