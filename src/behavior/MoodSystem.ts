import { MoodType, PetNeeds } from '../types/pet';

export class MoodSystem {
  public static calculateMood(needs: PetNeeds, isSleeping: boolean): MoodType {
    if (isSleeping || needs.energy < 25) {
      return 'tired';
    }

    if (needs.happiness >= 80 && needs.fun >= 75) {
      return 'happy';
    }

    if (needs.fun < 45 && needs.energy >= 50) {
      return 'playful';
    }

    if (needs.energy >= 70 && needs.happiness >= 60) {
      return 'curious';
    }

    return 'calm';
  }
}
