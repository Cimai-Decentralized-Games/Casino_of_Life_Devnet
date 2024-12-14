'use client';

import React, { useState } from 'react';
import { RLGameInteraction } from '../education-portal/rl-game-interactions';
import { GameAgentInteractive } from '../game-agent/game-agent-interactive';

export const TrainingAndMinting: React.FC = () => {
  const [trainedModel, setTrainedModel] = useState<{
    modelFile: File | null;
    modelData: any;
  }>({
    modelFile: null,
    modelData: null
  });

  const handleModelTrained = (modelFile: File, modelData: any) => {
    setTrainedModel({
      modelFile,
      modelData
    });
  };

  return (
    <div className="container mx-auto px-4">
      {/* Training Section */}
      <div className="mb-12">
        <RLGameInteraction 
          game="Mortal Kombat II" 
          onModelTrained={handleModelTrained}
        />
      </div>

      {/* Minting Section - Only show when model is trained */}
      {trainedModel.modelFile && trainedModel.modelData && (
        <div className="mt-12 pt-12 border-t border-base-300">
          <h2 className="text-3xl font-bold mb-8 text-center">Mint Your Trained Agent</h2>
          <GameAgentInteractive 
            initialModelFile={trainedModel.modelFile}
            initialModelData={trainedModel.modelData}
          />
        </div>
      )}
    </div>
  );
};