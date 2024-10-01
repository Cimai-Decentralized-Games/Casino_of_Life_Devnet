let gun;

export function initializeGun(gunInstance) {
  gun = gunInstance;
}

const getGameIntervals = () => gun.get('gameIntervals');

export function setGameInterval(gameId, interval) {
  return new Promise((resolve, reject) => {
    getGameIntervals().get(gameId).put(interval, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export function recordInterval(gameId, intervalData) {
  return new Promise((resolve, reject) => {
    getGameIntervals().get(gameId).set(intervalData, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export function checkGameInterval(gameId) {
  return new Promise((resolve, reject) => {
    getGameIntervals().get(gameId).once((interval, key) => {
      if (interval === undefined && key === undefined) {
        reject(new Error('Game interval not found'));
      } else {
        resolve(interval);
      }
    });
  });
}