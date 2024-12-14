import Gun from 'gun';
import 'gun/sea';

const DROPLET_IP = process.env.NEXT_PUBLIC_DROPLET_IP || '157.230.72.195';
const GUN_PORT = process.env.NEXT_PUBLIC_GUN_PORT || '9000';
// Define types for Gun.js callbacks
interface GunAck {
  err?: string;
  ok?: { '': 1 } | number;
  lack?: { '': 1 };
}

// Define proper Gun instance type
type GunInstance = ReturnType<typeof Gun>;

let gunInstance: GunInstance | null = null;

// Initialize Gun only on client side
if (typeof window !== 'undefined') {
  // Connect to the existing Gun server instance
  gunInstance = Gun({
    peers: [`https://${DROPLET_IP}:${GUN_PORT}/gun`],
    // No server configuration needed since we're just connecting
  });

  // Log peer connections
  gunInstance.on('hi', peer => {
    console.log('Connected to Gun server:', peer);
  });
}

// Helper functions for model operations
export const addModelData = async (modelData: any): Promise<string> => {
  if (!gunInstance) {
    throw new Error('Gun is not initialized (server-side)');
  }
  
  const key = `model_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  return new Promise((resolve, reject) => {
    gunInstance!
      .get('models')
      .get(key)
      .put(modelData, (ack: GunAck) => {
        if (ack.err) {
          reject(new Error(ack.err));
        } else {
          resolve(key);
        }
      });
  });
};

export const getModelData = async (key: string): Promise<any> => {
  if (!gunInstance) {
    throw new Error('Gun is not initialized (server-side)');
  }

  return new Promise((resolve, reject) => {
    gunInstance!
      .get('models')
      .get(key)
      .once((data: any) => {
        if (data) {
          resolve(data);
        } else {
          reject(new Error('Model not found'));
        }
      });
  });
};

export const gun = gunInstance;
