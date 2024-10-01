export class OddsCalculator {
  private baseOdds: number;

  constructor(baseOdds: number = 2.0) {
    this.baseOdds = baseOdds;
  }

  calculateOdds(betAmount: number, totalPot: number): number {
    console.log('Calculating odds with:', { betAmount, totalPot, baseOdds: this.baseOdds });

    // Ensure inputs are valid numbers
    if (isNaN(betAmount) || isNaN(totalPot) || betAmount < 0 || totalPot < 0) {
      console.warn('Invalid input for odds calculation', { betAmount, totalPot });
      return this.baseOdds; // Return base odds as fallback
    }

    // Prevent division by zero
    if (totalPot === 0) {
      console.warn('Total pot is zero, returning base odds');
      return this.baseOdds;
    }

    const oddsMultiplier = 1 + (betAmount / totalPot);
    const calculatedOdds = this.baseOdds * oddsMultiplier;

    // Ensure the result is a finite number
    if (!isFinite(calculatedOdds)) {
      console.warn('Calculated odds is not finite, returning base odds');
      return this.baseOdds;
    }

    console.log('Calculated odds:', calculatedOdds);
    return calculatedOdds;
  }

  calculatePotentialWinnings(betAmount: number, odds: number): number {
    console.log('Calculating potential winnings with:', { betAmount, odds });

    // Ensure inputs are valid numbers
    if (isNaN(betAmount) || isNaN(odds) || betAmount < 0 || odds < 1) {
      console.warn('Invalid input for winnings calculation', { betAmount, odds });
      return 0; // Return 0 as fallback
    }

    const potentialWinnings = betAmount * odds;
    console.log('Calculated potential winnings:', potentialWinnings);
    return potentialWinnings;
  }
}