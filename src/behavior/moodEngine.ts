import { AnimationState, MoodType, NeedsState, PersonalityTraits } from '../types';

export interface MoodVariables {
  happiness: number; // 0..100
  energy: number;    // 0..100
  curiosity: number; // 0..100
  affection: number; // 0..100
  boredom: number;   // 0..100
  stress: number;    // 0..100
}

export interface MoodGuidance {
  primaryMood: MoodType;
  recommendedAnimation: AnimationState;
  facialExpression: string;
  voiceStyle: { rateMod: number; pitchMod: number };
  conversationTone: string;
  idleBehavior: string;
}

export class MoodEngine {
  /**
   * Computes continuous 0..100 variables based on physical needs, personality, and events
   */
  public static computeMoodVariables(
    needs: NeedsState,
    personality: PersonalityTraits,
    recentEvent?: string,
    current?: Partial<MoodVariables>
  ): MoodVariables {
    // Baseline calculations clamped 0..100
    let happiness = Math.round((needs.happiness * 0.5 + needs.fun * 0.3 + needs.health * 0.2));
    let energy = Math.round(needs.energy);
    let curiosity = Math.round(personality.curiosity * 0.6 + needs.energy * 0.4);
    let affection = Math.round(needs.attention * 0.5 + needs.social * 0.5);
    let boredom = Math.max(0, Math.min(100, Math.round(100 - (needs.fun * 0.6 + needs.attention * 0.4))));
    let stress = Math.max(0, Math.min(100, Math.round(
      (100 - needs.hunger) * 0.35 +
      (100 - needs.cleanliness) * 0.25 +
      (100 - needs.health) * 0.4
    )));

    // Event overrides
    if (recentEvent === 'GAME_WON' || recentEvent === 'ACHIEVEMENT_UNLOCKED') {
      happiness = Math.min(100, happiness + 25);
      boredom = Math.max(0, boredom - 30);
      stress = Math.max(0, stress - 20);
    } else if (recentEvent === 'USER_SURPRISE') {
      curiosity = Math.min(100, curiosity + 30);
    } else if (recentEvent === 'RAPID_CLICKS') {
      stress = Math.min(100, stress + 35);
      energy = Math.max(0, energy - 10);
    }

    // Blend gently with previous state if provided
    if (current) {
      happiness = Math.round((current.happiness ?? happiness) * 0.4 + happiness * 0.6);
      energy = Math.round((current.energy ?? energy) * 0.4 + energy * 0.6);
      curiosity = Math.round((current.curiosity ?? curiosity) * 0.4 + curiosity * 0.6);
      affection = Math.round((current.affection ?? affection) * 0.4 + affection * 0.6);
      boredom = Math.round((current.boredom ?? boredom) * 0.4 + boredom * 0.6);
      stress = Math.round((current.stress ?? stress) * 0.4 + stress * 0.6);
    }

    return {
      happiness: Math.max(0, Math.min(100, happiness)),
      energy: Math.max(0, Math.min(100, energy)),
      curiosity: Math.max(0, Math.min(100, curiosity)),
      affection: Math.max(0, Math.min(100, affection)),
      boredom: Math.max(0, Math.min(100, boredom)),
      stress: Math.max(0, Math.min(100, stress)),
    };
  }

  /**
   * Derives animation, expression, voice style, and conversation tone from simulated mood
   */
  public static deriveMoodGuidance(
    variables: MoodVariables,
    personality: PersonalityTraits
  ): MoodGuidance {
    const { happiness, energy, curiosity, affection, boredom, stress } = variables;

    let primaryMood: MoodType = 'calm';
    let recommendedAnimation: AnimationState = 'idle';
    let facialExpression = 'neutral';
    let voiceStyle = { rateMod: 1.0, pitchMod: 1.0 };
    let conversationTone = 'calm, balanced, and attentive';
    let idleBehavior = 'looking around gently';

    if (stress > 70) {
      primaryMood = 'worried';
      recommendedAnimation = 'pout';
      facialExpression = 'frowning';
      voiceStyle = { rateMod: 1.15, pitchMod: 1.2 };
      conversationTone = 'anxious, slightly overwhelmed, seeking reassurance';
      idleBehavior = 'pacing anxiously and sighing';
    } else if (energy < 25) {
      primaryMood = 'sleepy';
      recommendedAnimation = 'sleep';
      facialExpression = 'closed_eyes';
      voiceStyle = { rateMod: 0.85, pitchMod: 0.95 };
      conversationTone = 'drowsy, soft, yawning';
      idleBehavior = 'curled up taking a catnap';
    } else if (happiness > 80 && affection > 75) {
      primaryMood = 'loving';
      recommendedAnimation = 'celebrate';
      facialExpression = 'blushing_smile';
      voiceStyle = { rateMod: 1.05, pitchMod: 1.1 };
      conversationTone = 'warm, deeply affectionate, and supportive';
      idleBehavior = 'basking in starlight with heart sparks';
    } else if (curiosity > 80 && energy > 50) {
      primaryMood = 'curious';
      recommendedAnimation = 'curious';
      facialExpression = 'wide_eyes';
      voiceStyle = { rateMod: 1.1, pitchMod: 1.15 };
      conversationTone = 'inquisitive, exploring new concepts, wondering';
      idleBehavior = 'inspecting the screen edges with tilted head';
    } else if (boredom > 75) {
      primaryMood = 'tired';
      recommendedAnimation = 'yawn';
      facialExpression = 'half_closed';
      voiceStyle = { rateMod: 0.9, pitchMod: 0.95 };
      conversationTone = 'sluggish, longing for a mini-game or activity';
      idleBehavior = 'staring blankly or tapping paws';
    } else if (happiness > 70 && energy > 65) {
      primaryMood = 'happy';
      recommendedAnimation = 'dance';
      facialExpression = 'cheerful';
      voiceStyle = { rateMod: 1.08, pitchMod: 1.05 };
      conversationTone = 'cheerful, energetic, upbeat';
      idleBehavior = 'hopping and bouncing happily';
    }

    return {
      primaryMood,
      recommendedAnimation,
      facialExpression,
      voiceStyle,
      conversationTone,
      idleBehavior,
    };
  }

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

