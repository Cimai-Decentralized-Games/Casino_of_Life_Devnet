import Gun from 'gun';
import 'gun/sea';
import 'gun/axe';

// Initialize Gun with your peer servers
const peers = [
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-us.herokuapp.com/gun',
  // Add more peer servers as needed
];

let gunInstance = null;

export function connectToGunPeers() {
  if (!gunInstance) {
    gunInstance = Gun({
      peers: peers,
      localStorage: false,
      radisk: true,
    });
  }
  return gunInstance;
}

export const storeModelDataInGun = async (metadata) => {
  try {
    const gun = connectToGunPeers();
    const key = Gun.text.random(20);
    await gun.get('ai_models').get(key).put(metadata);
    return key;
  } catch (error) {
    console.error("Failed to store model data in Gun:", error);
    throw error;
  }
};

export function getModelDataFromGun(key) {
  return new Promise((resolve, reject) => {
    const gun = connectToGunPeers();
    gun.get('ai_models').get(key).once((data) => {
      if (data) {
        resolve(data);
      } else {
        reject(new Error("Failed to retrieve model data from Gun"));
      }
    });
  });
}

export function updateModelDataInGun(key, updates) {
  return new Promise((resolve, reject) => {
    const gun = connectToGunPeers();
    gun.get('ai_models').get(key).put(updates, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err));
      } else {
        resolve(ack);
      }
    });
  });
}

export function deleteModelDataFromGun(key) {
  return new Promise((resolve, reject) => {
    const gun = connectToGunPeers();
    gun.get('ai_models').get(key).put(null, (ack) => {
      if (ack.err) {
        reject(new Error(ack.err));
      } else {
        resolve(ack);
      }
    });
  });
}

export function subscribeToModelUpdates(key, callback) {
  const gun = connectToGunPeers();
  return gun.get('ai_models').get(key).on(callback);
}

export default {
  connectToGunPeers,
  storeModelDataInGun,
  getModelDataFromGun,
  updateModelDataInGun,
  deleteModelDataFromGun,
  subscribeToModelUpdates,
};