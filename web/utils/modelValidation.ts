import { getModelData } from '../app/lib/modelService.api';

export interface ModelData {
  id: string;
  name: string;
  description: string;
  version: string;
  modelType: string;
  architecture: {
    type: string;
    layers: number;
    hiddenSize: number;
    attentionHeads: number;
  };
  training: {
    method: string;
    dataset: string;
    datasetSize: number;
    epochs: number;
    batchSize: number;
    optimizer: string;
    learningRate: number;
  };
  performance: {
    accuracy: number;
    loss: number;
    f1Score: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  modelId?: string;
  uri?: string;
  modelHash?: number[];
}

export async function verifyModel(modelId: string): Promise<ValidationResult> {
  try {
    // Get model data through our server-side service layer
    const metadata = await getModelData(modelId);

    // Prepare FormData for sending to the server
    const formData = new FormData();
    formData.append('operation', 'validate');
    formData.append('modelData', JSON.stringify(metadata));
    formData.append('modelId', modelId);

    // Send data to modelValidate.php on your droplet
    const response = await fetch('https://cimai.biz/modelValidate.php', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse the validation result from the Python script
    const result: ValidationResult = await response.json();

    return result;
  } catch (error) {
    console.error('Error during model verification:', error);
    return { isValid: false, reason: 'Verification process failed: ' + (error as Error).message };
  }
}



