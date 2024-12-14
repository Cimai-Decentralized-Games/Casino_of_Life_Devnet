import { ModelData, ValidationResult } from '../../utils/modelValidation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

const GUN_HOST = process.env.NEXT_PUBLIC_GUN_HOST || '157.245.116.116:9000';
const VALIDATE_HOST = process.env.VALIDATE_HOST || 'validate.cimai.biz';

export function useModelService() {
    const wallet = useWallet();
    const { connection } = useConnection();
    let authToken: string | null = null;

    async function ensureAuthenticated() {
        if (!authToken) {
            if (!wallet.publicKey || !wallet.signMessage) {
                throw new Error('Wallet not connected');
            }

            const timestamp = Date.now().toString();
            const messageBytes = new TextEncoder().encode(timestamp);
            const signatureBytes = await wallet.signMessage(messageBytes);
            const signature = bs58.encode(signatureBytes);

            const response = await fetch(`https://${GUN_HOST}/auth/solana`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    publicKey: wallet.publicKey.toString(),
                    signature,
                    timestamp
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to authenticate with Gun host');
            }

            const { token } = await response.json();
            authToken = token;
        }
        return authToken;
    }

    async function addModelData(modelData: ModelData): Promise<string> {
        const token = await ensureAuthenticated();

        const response = await fetch(`https://${GUN_HOST}/models`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                metadata: modelData,
                buffer: null // or your model buffer if available
            }),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token expired or invalid, clear it and retry
                authToken = null;
                return addModelData(modelData);
            }
            throw new Error(`Failed to add model data: ${response.statusText}`);
        }

        const result = await response.json();
        return result.modelId;
    }

    async function getModelData(modelId: string): Promise<ModelData> {
        const token = await ensureAuthenticated();

        const response = await fetch(`https://${VALIDATE_HOST}/models/${modelId}/metadata`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authToken = null;
                return getModelData(modelId);
            }
            throw new Error(`Failed to get model data: ${response.statusText}`);
        }

        return response.json();
    }

    async function getStorageStatus(): Promise<{
        contribution: number;
        rewards: number;
    }> {
        if (!wallet.publicKey) throw new Error('Wallet not connected');
        const token = await ensureAuthenticated();

        const response = await fetch(`https://${GUN_HOST}/rewards/${wallet.publicKey.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                authToken = null;
                return getStorageStatus();
            }
            throw new Error(`Failed to get storage status: ${response.statusText}`);
        }

        return response.json();
    }

    async function uploadModel(file: File): Promise<{ 
        modelId: string; 
        buffer: ArrayBuffer 
    }> {
        const token = await ensureAuthenticated();
        const buffer = await file.arrayBuffer();
        
        const response = await fetch(`https://${GUN_HOST}/models/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: buffer
        });

        if (!response.ok) {
            throw new Error('Failed to upload model');
        }

        const { modelId } = await response.json();
        return { modelId, buffer };
    }

    async function validateModel(modelId: string): Promise<ValidationResult> {
        const token = await ensureAuthenticated();
        
        const response = await fetch(`https://${GUN_HOST}/models/${modelId}/validate`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Model validation failed');
        }

        return response.json();
    }

    return {
        addModelData,
        getModelData,
        getStorageStatus,
        uploadModel,
        validateModel
    };
}