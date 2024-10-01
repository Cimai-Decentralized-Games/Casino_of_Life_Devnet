const crypto = require('crypto');

class FightManager {
  constructor() {
    this.currentFight = null;
  }

  generateFightId(initialState) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const stateHash = crypto.createHash('sha256').update(JSON.stringify(initialState)).digest('hex');
    return `${timestamp}-${randomString}-${stateHash.substring(0, 8)}`;
  }

  generateSecureFightId() {
    const timestamp = BigInt(Date.now());
    const randomNumber = BigInt(crypto.randomBytes(4).readUInt32LE());
    const secureFightId = (timestamp << 16n) | (randomNumber & 0xFFFFn);
    return secureFightId.toString();
  }

  startNewFight(initialState) {
    const fightId = this.generateFightId(initialState);
    const secureId = this.generateSecureFightId();
    this.currentFight = {
      id: fightId,
      secureId: secureId,
      startTime: Date.now(),
      bettingOpen: true,
      currentState: initialState,
      status: 'started',
    };
    console.log('New fight created:', this.currentFight);
    return this.currentFight;
  }

  getCurrentFight() {
    return this.currentFight;
  }

  closeBetting() {
    if (this.currentFight) {
      this.currentFight.bettingOpen = false;
    }
  }

  updateFightState(newState) {
    if (this.currentFight) {
      this.currentFight = { ...this.currentFight, ...newState };
    }
  }

  setFightResult(result) {
    if (this.currentFight) {
      this.currentFight.result = result;
      this.currentFight.status = 'finished';
      this.closeBetting();
    }
  }

  updateFightStatus(status, currentState) {
    if (this.currentFight) {
      this.currentFight.currentState = currentState || this.currentFight.currentState;
      this.currentFight.status = status;
      console.log(`Fight status updated: ${status}`);
    }
  }
}

const fightManager = new FightManager();

module.exports = { fightManager };