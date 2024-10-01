import crypto from 'crypto';

let gun;

export function initializeGun(gunInstance) {
  gun = gunInstance;
}

const getSaveStates = () => gun.get('saveStates');

export function calculateStateHash(state) {
  return crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex');
}

export async function storeSaveState(gameId, state) {
  return new Promise((resolve, reject) => {
    getSaveStates().get(gameId).put(state, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export async function getSaveState(gameId) {
  return new Promise((resolve, reject) => {
    getSaveStates().get(gameId).once((state, key) => {
      if (state) resolve(state);
      else reject(new Error('Save state not found'));
    });
  });
}

export async function retrieveSaveState(gameId) {
  return getSaveState(gameId);
}