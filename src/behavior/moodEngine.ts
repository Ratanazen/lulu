import { MoodType, NeedsState, PersonalityTraits } from '../types';

export class MoodEngine {
  public static calculateMood(
    needs: NeedsState,
    personality: PersonalityTraits,
    recentEvent?: string,
    hour: number = new Date().getHours()
  ): MoodType {
    // 1. Immediate Event Reactions
    if (recentEvent === 'ACHIEVEMENT_UNLOCKED') {
      return 'proud';
    }
    if (recentEvent === 'GAME_WON') {
      return 'excited';
    }
    if (recentEvent === 'USER_SURPRISE') {
      return 'surprised';
    }
    if (recentEvent === 'RAPID_CLICKS') {
      return 'dizzy';
    }

    // 2. Critical Needs Overrides
    if (needs.energy < 15) {
      return 'sleepy';
    }
    if (needs.energy < 30) {
      return 'tired';
    }

    // Neglected companion: hungry and uncleaned and low attention
    if (needs.hunger < 15 && needs.attention < 15) {
      return 'angry';
    }
    if (needs.hunger < 25 || needs.cleanliness < 25) {
      return 'worried';
    }
    if (needs.happiness < 25) {
      return 'sad';
    }

    // 3. Circadian Rhythm / Time-of-Day Influence
    // Late night (after 11 PM or before 5 AM)
    if ((hour >= 23 || hour < 5) && needs.energy < 60) {
      return 'sleepy';
    }
    // Early morning (5 AM to 8 AM)
    if (hour >= 5 && hour < 8 && personality.calmness > 60) {
      return 'meditative';
    }

    // 4. High Vitality / Social States
    if (needs.attention > 85 && needs.social > 80 && needs.happiness > 80) {
      return 'loving';
    }

    if (personality.playfulness > 70 && needs.fun > 70 && needs.energy > 60) {
      return 'playful';
    }

    if (personality.curiosity > 70 && needs.energy > 50) {
      return 'curious';
    }

    if (personality.focus > 75 && needs.energy > 40) {
      return 'focused';
    }

    if (needs.happiness > 75) {
      return 'happy';
    }

    return 'calm';
  }
}
