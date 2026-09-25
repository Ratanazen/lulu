import {
  BehaviorAction,
  BehaviorMode,
  MoodType,
  NeedsState,
  PersonalityTraits,
} from '../types';

export interface ActionScore {
  action: BehaviorAction;
  score: number;
}

export class BehaviorEngine {
  private lastActionTime: Map<BehaviorAction, number> = new Map();
  private readonly cooldowns: Record<BehaviorAction, number> = {
    idle: 2000,
    explore: 15000,
    rest: 20000,
    approachUser: 25000,
    react: 4000,
    play: 30000,
    eat: 60000,
    drink: 60000,
    sleep: 90000,
    celebrate: 10000,
    focus: 30000,
    musicMode: 20000,
    returnHome: 45000,
    yawn: 35000,
    read: 45000,
    meditate: 60000,
  };

  /**
   * Evaluates all possible actions, scores them using needs, personality,
   * behavior mode, and cooldowns, and selects the highest scoring action.
   */
  public evaluateNextAction(
    needs: NeedsState,
    personality: PersonalityTraits,
    currentMood: MoodType,
    mode: BehaviorMode = 'NORMAL',
    now: number = Date.now()
  ): BehaviorAction {
    if (mode === 'QUIET') {
      // Quiet mode favors calm idle, rest, or gentle meditation
      if (needs.energy < 30) return 'sleep';
      if (personality.calmness > 60 && Math.random() > 0.6) return 'meditate';
      return Math.random() > 0.3 ? 'idle' : 'rest';
    }

    if (mode === 'FOCUSED') {
      if (needs.energy < 25) return 'rest';
      if (personality.curiosity > 65 && Math.random() > 0.5) return 'read';
      return 'focus';
    }

    const possibleActions: BehaviorAction[] = [
      'idle',
      'explore',
      'rest',
      'react',
      'play',
      'returnHome',
    ];

    if (needs.energy < 25) {
      possibleActions.push('sleep');
    }
    if (needs.hunger < 40) {
      possibleActions.push('eat');
    }
    if (needs.energy < 50 || currentMood === 'sleepy' || currentMood === 'tired') {
      possibleActions.push('yawn');
    }
    if (needs.energy > 30 && (personality.focus > 50 || personality.curiosity > 60 || currentMood === 'focused')) {
      possibleActions.push('read');
    }
    if (personality.calmness > 50 || currentMood === 'meditative' || currentMood === 'calm' || mode === 'CALM') {
      possibleActions.push('meditate');
    }

    const hour = new Date(now).getHours();

    const scoredActions: ActionScore[] = possibleActions.map((action) => {
      let score = 10;

      // 1. Needs influence
      switch (action) {
        case 'sleep':
          score += (100 - needs.energy) * 1.5;
          break;
        case 'rest':
          score += (100 - needs.energy) * 0.8;
          break;
        case 'explore':
          score += (needs.energy * 0.4) + (needs.fun < 50 ? 30 : 0);
          break;
        case 'play':
          score += (100 - needs.fun) * 0.8 + (needs.energy * 0.3);
          break;
        case 'eat':
          score += (100 - needs.hunger) * 1.2;
          break;
        case 'yawn':
          score += (100 - needs.energy) * 0.9;
          break;
        case 'read':
          score += (needs.energy * 0.3) + (100 - needs.fun) * 0.4;
          break;
        case 'meditate':
          score += (needs.energy * 0.2) + (100 - needs.social) * 0.3;
          break;
        case 'returnHome':
          score += 15;
          break;
        case 'idle':
          score += 25;
          break;
      }

      // 2. Personality modifiers
      switch (action) {
        case 'explore':
          score *= (personality.curiosity / 50);
          break;
        case 'play':
          score *= (personality.playfulness / 50);
          break;
        case 'rest':
        case 'idle':
          score *= (personality.calmness / 50);
          break;
        case 'read':
          score *= (personality.curiosity / 45);
          break;
        case 'meditate':
          score *= (personality.calmness / 40);
          break;
        case 'yawn':
          score *= (personality.calmness / 50);
          break;
      }

      // 3. Behavior Mode modifier
      if (mode === 'PLAYFUL') {
        if (action === 'play' || action === 'explore') score *= 1.8;
        if (action === 'rest' || action === 'meditate') score *= 0.5;
      } else if (mode === 'CALM') {
        if (action === 'rest' || action === 'idle' || action === 'meditate') score *= 1.6;
        if (action === 'explore' || action === 'play') score *= 0.5;
      }

      // 4. Mood modifier
      if (currentMood === 'sleepy' && action === 'sleep') score += 50;
      if (currentMood === 'playful' && action === 'play') score += 40;
      if (currentMood === 'curious' && action === 'explore') score += 40;
      if ((currentMood === 'sleepy' || currentMood === 'tired') && action === 'yawn') score += 40;
      if (currentMood === 'meditative' && action === 'meditate') score += 50;
      if (currentMood === 'focused' && action === 'read') score += 40;

      // 5. Circadian influence
      if ((hour >= 22 || hour < 6) && action === 'yawn') score += 20;
      if ((hour >= 5 && hour < 9) && action === 'meditate') score += 20;
      if ((hour >= 10 && hour < 17) && action === 'read') score += 15;

      // 5. Cooldown penalty
      const lastTime = this.lastActionTime.get(action) || 0;
      const cooldown = this.cooldowns[action] || 5000;
      if (now - lastTime < cooldown) {
        score *= 0.1; // heavily penalized if on cooldown
      }

      // Add a slight variance so behavior is natural and non-deterministic
      score += Math.random() * 8;

      return { action, score };
    });

    // Pick top scoring action
    scoredActions.sort((a, b) => b.score - a.score);
    const chosen = scoredActions[0]?.action || 'idle';

    this.lastActionTime.set(chosen, now);
    return chosen;
  }
}
