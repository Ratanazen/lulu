import { AnimationState, MoodType } from '../../types';

export type EmotionType =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'excited'
  | 'surprised'
  | 'confused'
  | 'calm'
  | 'tired';

export interface EmotionMetrics {
  happiness: number;   // 0 - 100
  energy: number;      // 0 - 100
  friendship: number;  // 0 - 100
  focus: number;       // 0 - 100
  playfulness: number; // 0 - 100
}

export class EmotionEngine {
  private metrics: EmotionMetrics = {
    happiness: 85,
    energy: 80,
    friendship: 70,
    focus: 60,
    playfulness: 75,
  };

  private currentEmotion: EmotionType = 'happy';

  getMetrics(): EmotionMetrics {
    return { ...this.metrics };
  }

  getCurrentEmotion(): EmotionType {
    return this.currentEmotion;
  }

  private clamp(val: number): number {
    return Math.max(0, Math.min(100, Math.round(val)));
  }

  private recomputeDominantEmotion(): EmotionType {
    const { happiness, energy, focus, playfulness } = this.metrics;

    if (energy < 25) return 'tired';
    if (happiness > 80 && playfulness > 80) return 'excited';
    if (happiness > 60) return 'happy';
    if (focus > 75) return 'calm';
    if (happiness < 30) return 'sad';

    return 'calm';
  }

  // --- Interaction Triggers ---

  onUserPat(): EmotionType {
    this.metrics.happiness = this.clamp(this.metrics.happiness + 15);
    this.metrics.friendship = this.clamp(this.metrics.friendship + 5);
    this.metrics.playfulness = this.clamp(this.metrics.playfulness + 10);
    this.currentEmotion = this.metrics.happiness > 90 ? 'excited' : 'happy';
    return this.currentEmotion;
  }

  onChatResponse(): EmotionType {
    this.metrics.focus = this.clamp(this.metrics.focus + 8);
    this.metrics.friendship = this.clamp(this.metrics.friendship + 4);
    this.currentEmotion = this.recomputeDominantEmotion();
    return this.currentEmotion;
  }

  onGameWon(): EmotionType {
    this.metrics.happiness = this.clamp(this.metrics.happiness + 20);
    this.metrics.playfulness = this.clamp(this.metrics.playfulness + 25);
    this.currentEmotion = 'excited';
    return this.currentEmotion;
  }

  onError(): EmotionType {
    this.currentEmotion = 'confused';
    return this.currentEmotion;
  }

  onInactivityDecay(): EmotionType {
    this.metrics.energy = this.clamp(this.metrics.energy - 3);
    this.metrics.focus = this.clamp(this.metrics.focus - 2);
    this.currentEmotion = this.recomputeDominantEmotion();
    return this.currentEmotion;
  }

  getSuggestedAnimation(): AnimationState {
    switch (this.currentEmotion) {
      case 'excited': return 'celebrate';
      case 'happy': return 'happy';
      case 'tired': return 'tired';
      case 'confused': return 'confused';
      case 'surprised': return 'surprised';
      case 'sad': return 'sad';
      case 'calm': return 'idle';
      default: return 'idle';
    }
  }

  getMoodType(): MoodType {
    switch (this.currentEmotion) {
      case 'excited': return 'excited';
      case 'happy': return 'happy';
      case 'tired': return 'tired';
      case 'confused': return 'surprised';
      case 'surprised': return 'surprised';
      case 'sad': return 'sad';
      default: return 'calm';
    }
  }
}

export const emotionEngine = new EmotionEngine();
