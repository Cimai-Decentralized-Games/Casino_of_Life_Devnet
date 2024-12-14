import type { ModelData } from '../../utils/modelValidation';

const GUN_HOST = process.env.GUN_HOST || '157.245.116.116:9000';
const API_HOST = process.env.API_HOST || 'cimai.biz';
const VALIDATE_HOST = process.env.VALIDATE_HOST || 'validate.cimai.biz';

// Server-side only functions for API routes
export async function addModelData(modelData: ModelData): Promise<string> {
    const response = await fetch(`https://${GUN_HOST}/models`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Use API key or server-side auth method
            'X-API-Key': process.env.GUN_HOST_API_KEY as string
        },
        body: JSON.stringify({
            metadata: modelData
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to add model data: ${response.statusText}`);
    }

    const result = await response.json();
    return result.modelId;
}

export async function getModelData(modelId: string): Promise<ModelData> {
    const response = await fetch(`https://${VALIDATE_HOST}/models/${modelId}/metadata`, {
        headers: {
            'X-API-Key': process.env.GUN_HOST_API_KEY as string
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to get model data: ${response.statusText}`);
    }

    return response.json();
}