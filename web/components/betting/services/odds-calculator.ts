export class OddsCalculator {
  private baseOdds: number;
  private readonly HOUSE_EDGE = 0.05; // 5% house edge
  private readonly MAX_ODDS = 2.0; // Maximum 2x payout
  private readonly MIN_ODDS = 1.1; // Minimum 1.1x payout

  constructor(baseOdds = 1.5) {
    this.baseOdds = Math.min(Math.max(baseOdds, this.MIN_ODDS), this.MAX_ODDS);
  }

  calculateOdds(betAmount: number, totalPot: number): number {
    console.log('Calculating odds with:', { betAmount, totalPot, baseOdds: this.baseOdds });

    if (isNaN(betAmount) || isNaN(totalPot) || betAmount < 0 || totalPot < 0) {
      console.warn('Invalid input for odds calculation', { betAmount, totalPot });
      return this.baseOdds;
    }

    if (totalPot === 0) {
      console.warn('Total pot is zero, returning base odds');
      return this.baseOdds;
    }

    // Calculate odds with risk adjustment
    const potRatio = betAmount / (totalPot + betAmount);
    const riskAdjustment = Math.max(1 - potRatio, 0.5);
    
    let calculatedOdds = this.baseOdds * riskAdjustment;
    calculatedOdds = calculatedOdds * (1 - this.HOUSE_EDGE);
    calculatedOdds = Math.min(Math.max(calculatedOdds, this.MIN_ODDS), this.MAX_ODDS);

    console.log('Calculated odds:', calculatedOdds);
    return calculatedOdds;
  }

  // This is the key method for converting odds to contract format
  convertOddsToContractFormat(odds: number): number {
    const safeOdds = Math.min(Math.max(odds, this.MIN_ODDS), this.MAX_ODDS);
    // Convert to percentage profit (e.g., 1.5x becomes 50)
    const profitPercentage = Math.floor((safeOdds - 1) * 100);
    console.log('Converting odds:', { original: odds, safe: safeOdds, contractFormat: profitPercentage });
    return profitPercentage;
  }

  calculatePotentialWinnings(betAmount: number, odds: number): number {
    if (isNaN(betAmount) || isNaN(odds) || betAmount < 0 || odds < this.MIN_ODDS) {
      console.warn('Invalid input for winnings calculation', { betAmount, odds });
      return 0;
    }

    const safeOdds = Math.min(odds, this.MAX_ODDS);
    // Calculate only the profit portion
    const profitMultiplier = safeOdds - 1;
    const winnings = betAmount * profitMultiplier * (1 - this.HOUSE_EDGE);

    console.log('Calculated potential winnings:', {
      betAmount,
      odds: safeOdds,
      profitMultiplier,
      winnings
    });
    return winnings;
  }
}