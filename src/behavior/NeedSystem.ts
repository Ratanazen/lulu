import { PetNeeds } from '../types/pet';

export class NeedSystem {
  private needs: PetNeeds = {
    energy: 100,
    happiness: 90,
    fun: 85,
  };

  constructor(initial?: Partial<PetNeeds>) {
    if (initial) {
      this.needs = { ...this.needs, ...initial };
    }
  }

  public getNeeds(): PetNeeds {
    return { ...this.needs };
  }

  // Periodic natural decay (called every 10-30s)
  public decayTick(isSleeping: boolean, isMoving: boolean) {
    if (isSleeping) {
      // Sleep recovers energy (+8 per tick), slowly decays fun
      this.needs.energy = Math.min(100, this.needs.energy + 8);
      this.needs.fun = Math.max(30, this.needs.fun - 0.2);
    } else {
      // Gentle natural decay so companion remains active throughout workday
      const energyDecay = isMoving ? 0.3 : 0.1;
      this.needs.energy = Math.max(35, this.needs.energy - energyDecay);
      this.needs.happiness = Math.max(30, this.needs.happiness - 0.1);
      this.needs.fun = Math.max(30, this.needs.fun - 0.15);
    }
  }

  // User interactions replenish needs
  public petInteraction() {
    this.needs.happiness = Math.min(100, this.needs.happiness + 8);
    this.needs.fun = Math.min(100, this.needs.fun + 4);
  }

  public playMiniGameSuccess(rating: string) {
    const boost = rating === 'GODLIKE' ? 30 : rating === 'MASTER' ? 22 : 15;
    this.needs.fun = Math.min(100, this.needs.fun + boost);
    this.needs.happiness = Math.min(100, this.needs.happiness + 15);
  }

  public feedSnack() {
    this.needs.energy = Math.min(100, this.needs.energy + 15);
    this.needs.happiness = Math.min(100, this.needs.happiness + 10);
  }

  public wakeUp() {
    this.needs.energy = Math.max(85, this.needs.energy);
    this.needs.happiness = Math.min(100, this.needs.happiness + 10);
  }
}
