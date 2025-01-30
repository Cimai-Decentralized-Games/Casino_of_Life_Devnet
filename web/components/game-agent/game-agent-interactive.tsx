'use client';

import React, { useEffect, useState } from 'react';
import { GameAgentFeature } from './game-agent-feature';
import { type ModelData } from '../../utils/modelValidation';
import { useGameAgentState } from './game-agent-state';

interface GameAgentInteractiveProps {
  initialModelFile?: File;
  initialModelData?: ModelData;
}

export function GameAgentInteractive({ 
  initialModelFile, 
  initialModelData 
}: GameAgentInteractiveProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const {
    setModelData,
    handleUploadModel,
    handleValidateModel,
    setIsStepComplete,
    setCurrentStep,
    handleModelDataSubmit
  } = useGameAgentState();

  useEffect(() => {
    const initializeWithTrainedModel = async () => {
      if (initialModelFile && initialModelData && !isInitialized) {
        try {
          // Set the initial model data
          setModelData(initialModelData);
          
          // Handle the model file upload
          await handleUploadModel(initialModelFile);
          setIsStepComplete(prev => ({ ...prev, upload: true }));
          
          // Submit the model data form
          await handleModelDataSubmit(initialModelData);
          setIsStepComplete(prev => ({ ...prev, form: true }));
          
          // Automatically validate the trained model
          const isValid = await handleValidateModel();
          if (isValid) {
            setIsStepComplete(prev => ({ ...prev, validate: true }));
            setCurrentStep('metadata');
          }

          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize with trained model:', error);
        }
      }
    };

    initializeWithTrainedModel();
  }, [
    initialModelFile, 
    initialModelData, 
    isInitialized,
    setModelData,
    handleUploadModel,
    handleModelDataSubmit,
    handleValidateModel,
    setIsStepComplete,
    setCurrentStep
  ]);

  return <GameAgentFeature initialModelData={initialModelData} />;
}

