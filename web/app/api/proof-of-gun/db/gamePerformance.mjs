let gun;

export function initializeGun(gunInstance) {
  gun = gunInstance;
}

const getGamePerformance = () => gun.get('gamePerformance');

export function updatePerformance(agentId, metrics) {
  return new Promise((resolve, reject) => {
    getGamePerformance().get(agentId).put(metrics, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve();
    });
  });
}

export function updateMetrics(gameId, state) {
  // Implement logic to update performance metrics based on the game state
  // This is a placeholder implementation
  return new Promise((resolve, reject) => {
    const metrics = {
      gameId,
      lastUpdateTimestamp: Date.now(),
      // Add more metrics based on the state
      // For example:
      // playerHealth: state.playerHealth,
      // score: state.score,
      // etc.
    };

    getGamePerformance().get(gameId).put(metrics, ack => {
      if (ack.err) reject(new Error(ack.err));
      else resolve(metrics);
    });
  });
}

export function getPerformance(agentId) {
  return new Promise((resolve, reject) => {
    getGamePerformance().get(agentId).once((metrics, key) => {
      if (metrics === undefined && key === undefined) {
        reject(new Error('Performance metrics not found'));
      } else {
        resolve(metrics);
      }
    });
  });
}