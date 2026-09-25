import { NeedsState, PersonalityTraits } from '../types';

export const DEFAULT_NEEDS: NeedsState = {
  energy: 85,
  happiness: 85,
  fun: 80,
  attention: 75,
  social: 75,
  hunger: 80,
  cleanliness: 90,
  health: 95,
};

export class NeedsEngine {
  private needs: NeedsState = { ...DEFAULT_NEEDS };
  private lastUpdateTime: number = Date.now();

  constructor(initialNeeds?: Partial<NeedsState>) {
    if (initialNeeds) {
      this.needs = { ...this.needs, ...initialNeeds };
    }
  }

  public getNeeds(): NeedsState {
    return { ...this.needs };
  }

  public setNeeds(needs: Partial<NeedsState>): void {
    this.needs = {
      ...this.needs,
      ...needs,
    };
    this.clampAll();
  }

  /**
   * Applies gentle, non-aggressive natural decay based on elapsed time,
   * circadian time-of-day rhythms, and character personality modifiers.
   */
  public updateDecay(now: number = Date.now(), personality?: PersonalityTraits): NeedsState {
    const elapsedMinutes = (now - this.lastUpdateTime) / 60000;
    this.lastUpdateTime = now;

    if (elapsedMinutes <= 0) return this.getNeeds();

    const hour = new Date(now).getHours();
    const isNight = hour >= 23 || hour < 6;
    const isMealTime = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 20);

    // Circadian multipliers
    const nightEnergyMult = isNight ? 1.6 : 1.0;
    const mealHungerMult = isMealTime ? 1.4 : 0.9;

    // Base decay rates per minute (gentle: ~2-5 points per hour)
    const energyDecay = 0.05 * (personality ? personality.energy / 50 : 1) * nightEnergyMult;
    const hungerDecay = 0.06 * mealHungerMult;
    const funDecay = 0.04 * (personality ? personality.playfulness / 50 : 1);
    const attentionDecay = 0.05 * (personality ? personality.social / 50 : 1);
    const socialDecay = 0.04;
    const cleanlinessDecay = 0.02;

    this.needs.energy -= energyDecay * elapsedMinutes;
    this.needs.hunger -= hungerDecay * elapsedMinutes;
    this.needs.fun -= funDecay * elapsedMinutes;
    this.needs.attention -= attentionDecay * elapsedMinutes;
    this.needs.social -= socialDecay * elapsedMinutes;
    this.needs.cleanliness -= cleanlinessDecay * elapsedMinutes;

    // Derived health decay if starving or exhausted
    if (this.needs.hunger < 20 || this.needs.energy < 15) {
      this.needs.health -= 0.03 * elapsedMinutes;
    } else {
      this.needs.health += 0.02 * elapsedMinutes;
    }

    // Happiness influenced by overall wellbeing
    const avgWellbeing =
      (this.needs.energy +
        this.needs.hunger +
        this.needs.fun +
        this.needs.attention +
        this.needs.cleanliness) /
      5;
    this.needs.happiness += (avgWellbeing - this.needs.happiness) * 0.01 * elapsedMinutes;

    this.clampAll();
    return this.getNeeds();
  }

  // --- Care Actions ---

  public feed(amount: number = 25): void {
    this.needs.hunger += amount;
    this.needs.happiness += amount * 0.4;
    this.needs.energy += amount * 0.2;
    this.clampAll();
  }

  public play(funGain: number = 25): void {
    this.needs.fun += funGain;
    this.needs.happiness += funGain * 0.6;
    this.needs.energy -= 10;
    this.needs.social += 15;
    this.clampAll();
  }

  public clean(): void {
    this.needs.cleanliness = 100;
    this.needs.happiness += 10;
    this.clampAll();
  }

  public sleep(energyGain: number = 40): void {
    this.needs.energy += energyGain;
    this.needs.health += 15;
    this.clampAll();
  }

  public interact(attentionGain: number = 15): void {
    this.needs.attention += attentionGain;
    this.needs.social += attentionGain * 0.8;
    this.needs.happiness += attentionGain * 0.5;
    this.clampAll();
  }

  private clampAll(): void {
    for (const key of Object.keys(this.needs) as (keyof NeedsState)[]) {
      this.needs[key] = Math.max(0, Math.min(100, Math.round(this.needs[key] * 10) / 10));
    }
  }
}
