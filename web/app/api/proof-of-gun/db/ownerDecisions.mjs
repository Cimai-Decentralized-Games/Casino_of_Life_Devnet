let gun;

export function initializeGun(gunInstance) {
  gun = gunInstance;
}

const getOwnerDecisions = () => gun.get('ownerDecisions');

export function setOwnerDecision(gameId, decision) {
  return new Promise((resolve, reject) => {
    getOwnerDecisions().get(gameId).put(decision, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export function recordDecision(gameId, decision) {
  return new Promise((resolve, reject) => {
    getOwnerDecisions().get(gameId).set(decision, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export function getOwnerDecision(gameId) {
  return new Promise((resolve, reject) => {
    getOwnerDecisions().get(gameId).once((decision, key) => {
      if (decision === undefined && key === undefined) {
        reject(new Error('Owner decision not found'));
      } else {
        resolve(decision);
      }
    });
  });
}