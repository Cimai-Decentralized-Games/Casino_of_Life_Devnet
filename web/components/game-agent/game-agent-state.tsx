import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';
import { sha256 } from 'js-sha256';
import { generateNftMetadataUri } from '../../app/lib/nftService.server';
import { type ModelData } from '../../utils/modelValidation';

export type MintingStep = 'upload' | 'form' | 'validate' | 'metadata' | 'collection' | 'mint';

const initialModelData: ModelData = {
  id: `model_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  name: '',
  description: '',
  version: '',
  modelType: '',
  architecture: {
    type: '',
    layers: 0,
    hiddenSize: 0,
    attentionHeads: 0
  },
  training: {
    method: '',
    dataset: '',
    datasetSize: 0,
    epochs: 0,
    batchSize: 0,
    optimizer: '',
    learningRate: 0
  },
  performance: {
    accuracy: 0,
    loss: 0,
    f1Score: 0
  }
};

export function useGameAgentState() {
  // Flow Control State
  const [currentStep, setCurrentStep] = useState<MintingStep>('upload');
  const [isStepComplete, setIsStepComplete] = useState<Record<MintingStep, boolean>>({
    upload: false,
    form: false,
    validate: false,
    metadata: false,
    collection: false,
    mint: false
  });

  // Model State
  const [modelData, setModelData] = useState<ModelData>(initialModelData);
  const [uploadedModel, setUploadedModel] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [isModelValidated, setIsModelValidated] = useState(false);
  const [validatedModelId, setValidatedModelId] = useState<string | null>(null);

  // URI and Hash State
  const [generatedUri, setGeneratedUri] = useState<string | null>(null);
  const [generatedModelHash, setGeneratedModelHash] = useState<number[] | null>(null);

  // Collection State
  const [selectedCollection, setSelectedCollection] = useState<PublicKey | null>(null);

  const handleModelDataChange = useCallback((name: string, value: string | number) => {
    setModelData(prevData => {
      const newData = { ...prevData };
      const keys = name.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  }, []);

  const handleUploadModel = useCallback(async (file: File) => {
    setUploadedModel(file);
    setIsModelValidated(false);
    setValidatedModelId(null);
    setIsStepComplete(prev => ({ ...prev, upload: true }));
    setCurrentStep('form');
  }, []);

  const handleValidateModel = useCallback(async () => {
    if (!uploadedModel || !modelData) return false;

    try {
      // Create FormData for the store operation
      const formData = new FormData();
      formData.append('action', 'store');
      formData.append('modelData', JSON.stringify(modelData));
      formData.append('modelBuffer', uploadedModel);

      const response = await fetch('/api/model-process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to store model');
      const { key } = await response.json();
      
      // Create FormData for the validate operation
      const validateFormData = new FormData();
      validateFormData.append('action', 'validate');
      validateFormData.append('modelId', key);

      const validationResponse = await fetch('/api/model-process', {
        method: 'POST',
        body: validateFormData,
      });

      if (!validationResponse.ok) throw new Error('Model validation failed');
      const { result } = await validationResponse.json();
      
      setIsModelValidated(result.isValid);
      if (result.isValid) {
        setValidatedModelId(key);
        setIsStepComplete(prev => ({ ...prev, validate: true }));
        setCurrentStep('metadata');
      }

      return result.isValid;
    } catch (error) {
      console.error('Validation error:', error);
      setIsModelValidated(false);
      setValidatedModelId(null);
      return false;
    }
  }, [uploadedModel, modelData]);

  const handleModelDataSubmit = useCallback(async (formData: ModelData) => {
    setModelData(formData);
    setIsStepComplete(prev => ({ ...prev, form: true }));
    setCurrentStep('validate');
    return handleValidateModel();
  }, [handleValidateModel]);

  const handleGenerateUri = useCallback(async () => {
    try {
      const modelDataWithId = {
        ...modelData,
        id: validatedModelId || modelData.id
      };

      // First store the model data
      const formData = new FormData();
      formData.append('action', 'store');
      formData.append('modelData', JSON.stringify(modelDataWithId));
      if (uploadedModel) formData.append('modelBuffer', uploadedModel);

      const response = await fetch('/api/model-process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to store model data');
      const { key } = await response.json();

      // Generate NFT metadata URI
      const uri = await generateNftMetadataUri(modelDataWithId, uploadedImage, uploadedModel);
      const jsonString = JSON.stringify(modelDataWithId);
      const hashBuffer = sha256.array(jsonString);
      const modelHash = Array.from(hashBuffer.slice(0, 32));

      setGeneratedUri(uri);
      setGeneratedModelHash(modelHash);
      setIsStepComplete(prev => ({ ...prev, metadata: true }));
      setCurrentStep('collection');

      return { uri, modelHash, key };
    } catch (error) {
      console.error('Error generating URI:', error);
      throw error;
    }
  }, [modelData, uploadedModel, uploadedImage, validatedModelId]);

  return {
    // State
    currentStep,
    isStepComplete,
    modelData,
    uploadedModel,
    uploadedImage,
    isModelValidated,
    validatedModelId,
    generatedUri,
    generatedModelHash,
    selectedCollection,
    
    // Setters
    setCurrentStep,
    setIsStepComplete,
    setModelData,
    setUploadedImage,
    setSelectedCollection,
    setGeneratedUri,
    setGeneratedModelHash,
    
    // Handlers
    handleModelDataChange,
    handleModelDataSubmit,
    handleUploadModel,
    handleValidateModel,
    handleGenerateUri
  };
} 