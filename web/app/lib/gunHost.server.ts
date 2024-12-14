import { gun } from './gunInstance';
import { sha256 } from 'js-sha256';
import 'gun/sea';
import 'gun/axe';

const APP_SCOPE = 'nft-model-data';

// Gun adds internal properties to all data objects
interface GunData {
  _?: {
    '#'?: string;
    '>'?: number;
    [key: string]: any;
  };
}

interface ModelData extends GunData {
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
  customStoragePath?: string;
  timestamp?: number;
  status?: 'pending' | 'stored' | 'failed';
  error?: string;
}

interface GunAck {
  err?: string;
  ok?: number;
}

// Validation function for model data
function validateModelData(data: ModelData): boolean {
  const requiredFields = ['name', 'description', 'version', 'modelType', 'architecture', 'training', 'performance'];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate architecture
  if (typeof data.architecture !== 'object' || 
      !data.architecture.type || 
      typeof data.architecture.layers !== 'number' ||
      typeof data.architecture.hiddenSize !== 'number' ||
      typeof data.architecture.attentionHeads !== 'number') {
    throw new Error('Invalid architecture data');
  }

  // Validate training
  if (typeof data.training !== 'object' || 
      !data.training.method || 
      !data.training.dataset ||
      typeof data.training.datasetSize !== 'number' ||
      typeof data.training.epochs !== 'number' ||
      typeof data.training.batchSize !== 'number' ||
      !data.training.optimizer ||
      typeof data.training.learningRate !== 'number') {
    throw new Error('Invalid training data');
  }

  // Validate performance
  if (typeof data.performance !== 'object' || 
      typeof data.performance.accuracy !== 'number' ||
      typeof data.performance.loss !== 'number' ||
      typeof data.performance.f1Score !== 'number') {
    throw new Error('Invalid performance data');
  }

  return true;
}

async function addModelData(modelData: ModelData): Promise<string> {
  const key = `model_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const enrichedData = {
    ...modelData,
    timestamp: Date.now(),
    status: modelData.status || 'pending'
  };

  return new Promise((resolve, reject) => {
    gun.get(APP_SCOPE)
       .get('models')
       .get(key)
       .put(enrichedData, (ack: GunAck) => {
         if (ack.err) reject(new Error(ack.err));
         else resolve(key);
       });
  });
}

async function getModelData(key: string): Promise<ModelData> {
  return new Promise((resolve, reject) => {
    gun.get(APP_SCOPE)
       .get('models')
       .get(key)
       .once((data: any) => {
         if (data && !data._) {
           // Ensure all required fields are present and properly typed
           const modelData: ModelData = {
             id: data.id || key,  // Use the key as fallback for id
             name: data.name,
             description: data.description,
             version: data.version,
             modelType: data.modelType,
             architecture: {
               type: data.architecture?.type,
               layers: data.architecture?.layers,
               hiddenSize: data.architecture?.hiddenSize,
               attentionHeads: data.architecture?.attentionHeads
             },
             training: {
               method: data.training?.method,
               dataset: data.training?.dataset,
               datasetSize: data.training?.datasetSize,
               epochs: data.training?.epochs,
               batchSize: data.training?.batchSize,
               optimizer: data.training?.optimizer,
               learningRate: data.training?.learningRate
             },
             performance: {
               accuracy: data.performance?.accuracy,
               loss: data.performance?.loss,
               f1Score: data.performance?.f1Score
             },
             customStoragePath: data.customStoragePath,
             timestamp: data.timestamp,
             status: data.status,
             error: data.error
           };
           resolve(modelData);
         } else {
           reject(new Error('Model data not found'));
         }
       });
  });
}

async function updateModelStatus(key: string, status: 'stored' | 'failed', error?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    gun.get(APP_SCOPE)
       .get('models')
       .get(key)
       .get('status')
       .put(status, (ack: GunAck) => {
         if (ack.err) reject(new Error(ack.err));
         if (error) {
           gun.get(APP_SCOPE)
              .get('models')
              .get(key)
              .get('error')
              .put(error);
         }
         resolve();
       });
  });
}

export function updateMetrics(modelId: string, data: ModelData) {
  return new Promise((resolve, reject) => {
    try {
      validateModelData(data);

      const metrics = {
        lastUpdateTimestamp: Date.now(),
        ...data
      };

      updateModelDataInGun(modelId, { metadata: metrics })
        .then(() => resolve(metrics))
        .catch(error => reject(new Error(`Failed to update metrics: ${error.message}`)));
    } catch (error) {
      reject(error);
    }
  });
}

export async function getPerformance(modelId: string) {
  return await getModelFromGun(modelId)
    .then(model => model.metadata)
    .catch(() => {
      throw new Error('Performance metrics not found');
    });
}

// Add new interface for NFT metadata
interface NftMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    files: Array<{
      uri: string;
      type: string;
    }>;
    category: string;
  };
  modelHash: number[];
}

export async function generateNftMetadataUri(modelData: ModelData, imageFile: File, uploadedModel: File) {
  console.log('Model Data received:', JSON.stringify(modelData, null, 2));
  
  // Handle the image file
  let imageUrl;
  if (imageFile) {
    // Convert image file to base64
    const base64Image = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageFile);
    });

    // Store image in Gun
    const imageKey = `image_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await new Promise((resolve, reject) => {
      gun.get('nft_images').get(imageKey).put({data: base64Image}, ack => {
        if (ack.err) {
          console.error('Error storing image in Gun:', ack.err);
          reject(new Error(ack.err));
        } else {
          resolve(ack);
        }
      });
    });

    // Set the image URL to reference the Gun data
    imageUrl = `gun://nft_images/${imageKey}`;
  } else {
    // Fallback to a default image if no image was provided
    imageUrl = "gun://default_images/default_nft";
  }

  // Generate modelHash
  const modelDataString = JSON.stringify(modelData);
  const modelHash = Array.from(sha256.array(modelDataString)).slice(0, 32);

  // Create NFT metadata
  const nftMetadata: NftMetadata = {
    name: modelData.name,
    description: modelData.description,
    image: imageUrl,
    attributes: [
      { trait_type: "Model Type", value: modelData.modelType },
      { trait_type: "Version", value: modelData.version },
      { trait_type: "Architecture", value: modelData.architecture.type },
      { trait_type: "Accuracy", value: modelData.performance.accuracy },
      { trait_type: "F1 Score", value: modelData.performance.f1Score }
    ],
    properties: {
      files: [
        {
          uri: imageUrl,
          type: imageFile ? imageFile.type : "image/png"
        }
      ],
      category: "image",
    },
    modelHash: modelHash
  };

  // Store model data, metadata, and file in Gun
  let modelFile;
  if (uploadedModel) {
    modelFile = await uploadedModel.arrayBuffer();
  }
  
  // Store the original ModelData, not the NFT metadata
  const modelId = await storeModelInGun(modelData, modelFile);

  return {
    uri: `gun://ai_models/${modelId}`,
    modelHash: modelHash,
    modelId: modelId
  };
}

// Add interface for chat messages
interface ChatMessage {
  user: string;
  text: string;
  timestamp: number;
}

async function sendChatMessage(message: ChatMessage): Promise<void> {
  if (!gun) {
    throw new Error('Gun is not initialized');
  }

  try {
    await new Promise<void>((resolve, reject) => {
      const messageId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      gun
        .get(APP_SCOPE)
        .get('chat')
        .get(messageId)
        .put(message, (ack: GunAck) => {
          if (ack.err) reject(new Error(ack.err));
          else resolve();
        });
    });
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

async function getChatMessages(): Promise<ChatMessage[]> {
  if (!gun) {
    throw new Error('Gun is not initialized');
  }

  try {
    return new Promise((resolve) => {
      const messages: ChatMessage[] = [];
      gun
        .get(APP_SCOPE)
        .get('chat')
        .map()
        .on((data: ChatMessage, key: string) => {
          if (data) {
            messages.push(data);
          }
        });

      setTimeout(() => {
        resolve(messages.sort((a, b) => a.timestamp - b.timestamp));
      }, 500);
    });
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}

export { 
  addModelData, 
  getModelData, 
  updateModelStatus, 
  validateModelData,
  type ModelData, 
  type GunData,
  sendChatMessage,
  getChatMessages,
  type ChatMessage
};

export const storeModelInGun = async (modelData: ModelData, modelFile?: ArrayBuffer): Promise<string> => {
  console.log('Storing model in Gun:', JSON.stringify(modelData, null, 2));
  const modelId = `model_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // Store metadata
  await new Promise<void>((resolve, reject) => {
    gun.get('ai_models').get(modelId).put({
      metadata: {
        name: modelData.name,
        description: modelData.description,
        version: modelData.version,
        modelType: modelData.modelType,
        architecture: JSON.stringify(modelData.architecture),
        training: JSON.stringify(modelData.training),
        performance: JSON.stringify(modelData.performance)
      }
    }, ack => {
      if (ack.err) {
        console.error('Error storing model metadata in Gun:', ack.err);
        reject(new Error(ack.err));
      } else {
        resolve();
      }
    });
  });

  // Store model file if provided
  if (modelFile) {
    await storeModelFileInGun(modelId, modelFile);
  }

  return modelId;
};

export async function getModelFileFromGun(modelId: string): Promise<ArrayBuffer> {
  const totalChunks = await new Promise<number>((resolve, reject) => {
    gun.get('ai_models').get(modelId).get('file').get('totalChunks').once((data) => {
      if (data) {
        resolve(data);
      } else {
        reject(new Error("Failed to retrieve total chunks info from Gun"));
      }
    });
  });

  let modelFile = new Uint8Array(0);
  for (let i = 0; i < totalChunks; i++) {
    const chunkBase64 = await new Promise<string>((resolve, reject) => {
      gun.get('ai_models').get(modelId).get('file').get(`chunk_${i}`).once((data) => {
        if (data) {
          resolve(data);
        } else {
          reject(new Error(`Failed to retrieve chunk ${i} from Gun`));
        }
      });
    });

    const chunkArray = Uint8Array.from(atob(chunkBase64), c => c.charCodeAt(0));
    modelFile = new Uint8Array([...modelFile, ...chunkArray]);
  }

  return modelFile.buffer;
}

export function getModelDataFromGun(modelId: string): Promise<ModelData> {
  return new Promise((resolve, reject) => {
    gun.get('ai_models').get(modelId).get('metadata').once((data) => {
      if (data) {
        resolve({
          ...data,
          architecture: JSON.parse(data.architecture),
          training: JSON.parse(data.training),
          performance: JSON.parse(data.performance)
        });
      } else {
        reject(new Error("Failed to retrieve model data from Gun"));
      }
    });
  });
}

export const getModelFromGun = async (modelId: string) => {
  const metadata = await getModelDataFromGun(modelId);
  const modelFile = await getModelFileFromGun(modelId);
  return { metadata, modelFile };
};

export function updateModelDataInGun(key: string, updates: any): Promise<void> {
  return new Promise((resolve, reject) => {
    gun.get('ai_models').get(key).put(updates, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err));
      } else {
        resolve();
      }
    });
  });
}

export function deleteModelDataFromGun(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    gun.get('ai_models').get(key).put(null, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err));
      } else {
        resolve();
      }
    });
  });
}

export function subscribeToModelUpdates(key: string, callback: (data: any) => void) {
  return gun.get('ai_models').get(key).on(callback);
}

// Add new function for storing model files in chunks
async function storeModelFileInGun(modelId: string, modelFile: ArrayBuffer): Promise<void> {
  const chunkSize = 1024 * 1024; // 1MB chunks
  const totalChunks = Math.ceil(modelFile.byteLength / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = modelFile.slice(i * chunkSize, (i + 1) * chunkSize);
    const chunkBase64 = btoa(String.fromCharCode.apply(null, new Uint8Array(chunk)));

    await new Promise<void>((resolve, reject) => {
      gun.get('ai_models').get(modelId).get('file').get(`chunk_${i}`).put(chunkBase64, ack => {
        if (ack.err) {
          console.error(`Error storing model file chunk ${i} in Gun:`, ack.err);
          reject(new Error(ack.err));
        } else {
          resolve();
        }
      });
    });
  }

  await new Promise<void>((resolve, reject) => {
    gun.get('ai_models').get(modelId).get('file').get('totalChunks').put(totalChunks, ack => {
      if (ack.err) {
        console.error('Error storing total chunks info in Gun:', ack.err);
        reject(new Error(ack.err));
      } else {
        resolve();
      }
    });
  });
}

export default {
  storeModelInGun,
  getModelFromGun,
  getModelDataFromGun,
  updateModelDataInGun,
  deleteModelDataFromGun,
  subscribeToModelUpdates,
  updateMetrics,
  getPerformance,
  generateNftMetadataUri,
  sendChatMessage,
  getChatMessages,
};
