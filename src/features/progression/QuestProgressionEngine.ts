/**
 * QuestProgressionEngine: Interactive Shinobi Quests, XP & Rank System for Lulu
 * 
 * Provides:
 * - 9-Tier Shinobi Rank Ladder (Academy Student to Rikudo Shadow Sage)
 * - Dynamic task progress tracking with units and XP awards
 * - Live action hooks: petting, snacking, sprint laps, walk patrols, music play, focus
 * - Celebratory rank-up and quest completion events
 * - Persistent storage across desktop sessions
 */

export interface ShinobiRank {
  level: number;
  title: string;
  minXp: number;
  maxXp: number; // For level 9, Infinity or high threshold
  badge: string;
  description: string;
}

export const SHINOBI_RANKS: ShinobiRank[] = [
  { level: 1, title: 'Academy Student', minXp: 0, maxXp: 250, badge: 'leaf', description: 'Beginning ninja fundamentals & chakra control' },
  { level: 2, title: 'Shinobi Genin', minXp: 250, maxXp: 650, badge: 'swords', description: 'Official shinobi with basic desktop traversal jutsu' },
  { level: 3, title: 'Chunin Vanguard', minXp: 650, maxXp: 1300, badge: 'shield', description: 'Squad leader skilled in tactical patrols & stamina' },
  { level: 4, title: 'Special Jonin', minXp: 1300, maxXp: 2200, badge: 'zap', description: 'Elite specialist in high-speed sprints & audio sync' },
  { level: 5, title: 'Jonin Commander', minXp: 2200, maxXp: 3500, badge: 'flame', description: 'Master shinobi possessing advanced chakra shields' },
  { level: 6, title: 'ANBU Black Ops', minXp: 3500, maxXp: 5200, badge: 'eye', description: 'Shadow operative executing seamless background patrols' },
  { level: 7, title: 'Legendary Sannin', minXp: 5200, maxXp: 7500, badge: 'crown', description: 'Renowned master of all 8 shinobi katas and karaoke' },
  { level: 8, title: 'Hokage Guardian', minXp: 7500, maxXp: 10500, badge: 'star', description: 'Supreme protector and guardian of the desktop realm' },
  { level: 9, title: 'Rikudo Shadow Sage', minXp: 10500, maxXp: 15000, badge: 'sparkles', description: 'Ascended sage wielding infinite chakra and mastery' },
];

export interface QuestTaskState {
  id: string;
  currentProgress: number;
  maxProgress: number;
  unit: string;
  xpReward: number;
  isCompleted: boolean;
}

export interface ProgressionState {
  totalXp: number;
  currentRank: ShinobiRank;
  nextRank: ShinobiRank | null;
  rankProgressPercent: number;
  xpToNextRank: number;
  tasks: Record<string, QuestTaskState>;
  completedCount: number;
  totalTasks: number;
}

export type ProgressionListener = (state: ProgressionState) => void;
export type RankUpListener = (newRank: ShinobiRank, previousRank: ShinobiRank) => void;
export type TaskCompleteListener = (taskId: string, xpGained: number) => void;

const STORAGE_KEY = 'lulu_shinobi_progression_v1';

export class QuestProgressionEngine {
  private totalXp: number = 0;
  private taskStates: Record<string, QuestTaskState> = {};
  private listeners: Set<ProgressionListener> = new Set();
  private rankUpListeners: Set<RankUpListener> = new Set();
  private taskCompleteListeners: Set<TaskCompleteListener> = new Set();

  constructor() {
    this.initDefaultTasks();
    this.loadState();
  }

  private initDefaultTasks() {
    const defaults: Record<string, { max: number; unit: string; xp: number }> = {
      unlock_all_flames: { max: 1, unit: 'unlock', xp: 500 },
      continuous_sprint_master: { max: 5, unit: 'laps', xp: 200 },
      walk_go_and_back_patrol: { max: 5, unit: 'patrols', xp: 180 },
      spotify_vocalist: { max: 3, unit: 'songs', xp: 250 },
      peaceful_zen_sleep: { max: 3, unit: 'naps', xp: 150 },
      susanoo_chakra_defense: { max: 3, unit: 'shields', xp: 220 },
      celebration_victory_cheer: { max: 5, unit: 'cheers', xp: 160 },
      desktop_perimeter_patrol: { max: 10, unit: 'laps', xp: 200 },
      warrior_deep_focus: { max: 3, unit: 'sessions', xp: 240 },
      karaoke_lyrics_sync: { max: 5, unit: 'lyrics', xp: 260 },
      master_of_seven_sprites: { max: 8, unit: 'poses', xp: 400 },
      micro_timing_sync_offset: { max: 3, unit: 'calibrations', xp: 150 },
      melancholic_love_comfort: { max: 10, unit: 'pets', xp: 180 },
      step_down_zen_posture: { max: 5, unit: 'rests', xp: 170 },
      youtube_media_stream: { max: 3, unit: 'streams', xp: 220 },
      system_computer_sync: { max: 5, unit: 'mins', xp: 190 },
      terminal_karaoke_tui: { max: 1, unit: 'check', xp: 300 },
      wayland_desktop_traversal: { max: 5, unit: 'roams', xp: 250 },
      lyrics_hud_hinge_control: { max: 2, unit: 'toggles', xp: 140 },
      lucide_vector_iconography: { max: 1, unit: 'active', xp: 200 },
      audio_reactive_beat_dance: { max: 10, unit: 'beats', xp: 280 },
      multi_monitor_screen_wrapping: { max: 5, unit: 'laps', xp: 250 },
      companion_chimes_spatial_audio: { max: 10, unit: 'chimes', xp: 260 },
    };

    for (const [id, def] of Object.entries(defaults)) {
      this.taskStates[id] = {
        id,
        currentProgress: 0,
        maxProgress: def.max,
        unit: def.unit,
        xpReward: def.xp,
        isCompleted: false,
      };
    }
  }

  /**
   * Calculate current rank based on total XP
   */
  public getRankForXp(xp: number): { currentRank: ShinobiRank; nextRank: ShinobiRank | null } {
    let currentRank = SHINOBI_RANKS[0];
    let nextRank: ShinobiRank | null = SHINOBI_RANKS[1];

    for (let i = 0; i < SHINOBI_RANKS.length; i++) {
      const rank = SHINOBI_RANKS[i];
      if (xp >= rank.minXp) {
        currentRank = rank;
        nextRank = i + 1 < SHINOBI_RANKS.length ? SHINOBI_RANKS[i + 1] : null;
      }
    }

    return { currentRank, nextRank };
  }

  /**
   * Add XP with rank-up detection
   */
  public addXp(amount: number) {
    if (amount <= 0) return;

    const oldRank = this.getRankForXp(this.totalXp).currentRank;
    this.totalXp += amount;
    const newRank = this.getRankForXp(this.totalXp).currentRank;

    if (newRank.level > oldRank.level) {
      for (const listener of this.rankUpListeners) {
        try {
          listener(newRank, oldRank);
        } catch {}
      }
    }

    this.saveState();
    this.notify();
  }

  /**
   * Increment task progress
   */
  public incrementTaskProgress(taskId: string, amount: number = 1) {
    const task = this.taskStates[taskId];
    if (!task) return;

    if (task.isCompleted) return;

    task.currentProgress = Math.min(task.maxProgress, task.currentProgress + amount);

    if (task.currentProgress >= task.maxProgress && !task.isCompleted) {
      task.isCompleted = true;
      this.addXp(task.xpReward);

      for (const listener of this.taskCompleteListeners) {
        try {
          listener(taskId, task.xpReward);
        } catch {}
      }
    } else {
      this.saveState();
      this.notify();
    }
  }

  /**
   * Action Hook: User petted Lulu
   */
  public recordPet() {
    this.addXp(10);
    this.incrementTaskProgress('melancholic_love_comfort', 1);
  }

  /**
   * Action Hook: User fed snack to Lulu
   */
  public recordSnack() {
    this.addXp(15);
    this.incrementTaskProgress('step_down_zen_posture', 1);
  }

  /**
   * Action Hook: Lulu completed a sprint lap
   */
  public recordSprintLap() {
    this.addXp(25);
    this.incrementTaskProgress('continuous_sprint_master', 1);
    this.incrementTaskProgress('wayland_desktop_traversal', 1);
  }

  /**
   * Action Hook: Lulu completed a walk lap
   */
  public recordWalkLap() {
    this.addXp(20);
    this.incrementTaskProgress('walk_go_and_back_patrol', 1);
    this.incrementTaskProgress('desktop_perimeter_patrol', 1);
  }

  /**
   * Action Hook: Music or YouTube track played
   */
  public recordSongPlayed() {
    this.addXp(30);
    this.incrementTaskProgress('spotify_vocalist', 1);
    this.incrementTaskProgress('karaoke_lyrics_sync', 1);
    this.incrementTaskProgress('youtube_media_stream', 1);
    this.incrementTaskProgress('audio_reactive_beat_dance', 2);
  }

  /**
   * Action Hook: Focus session completed
   */
  public recordFocusSession() {
    this.addXp(40);
    this.incrementTaskProgress('warrior_deep_focus', 1);
  }

  /**
   * Action Hook: Sleep cycle initiated
   */
  public recordSleep() {
    this.addXp(15);
    this.incrementTaskProgress('peaceful_zen_sleep', 1);
  }

  /**
   * Action Hook: Susanoo shield activated
   */
  public recordShield() {
    this.addXp(20);
    this.incrementTaskProgress('susanoo_chakra_defense', 1);
  }

  /**
   * Action Hook: Companion sound cue / chime played
   */
  public recordChime() {
    this.addXp(15);
    this.incrementTaskProgress('companion_chimes_spatial_audio', 1);
  }

  /**
   * Action Hook: Multi-monitor wrap / roaming lap completed
   */
  public recordWrapLap() {
    this.addXp(25);
    this.incrementTaskProgress('multi_monitor_screen_wrapping', 1);
  }

  /**
   * Master Switch: Instantly complete all tasks & grant master XP
   */
  public unlockAllTasks() {
    for (const task of Object.values(this.taskStates)) {
      task.currentProgress = task.maxProgress;
      task.isCompleted = true;
    }
    // Boost XP to Rikudo Sage
    if (this.totalXp < 12000) {
      this.totalXp = 12000;
    }
    this.saveState();
    this.notify();
  }

  /**
   * Reset progression for new game / quest replay
   */
  public resetProgression() {
    this.totalXp = 0;
    this.initDefaultTasks();
    this.saveState();
    this.notify();
  }

  /**
   * Build complete immutable state object
   */
  public getState(): ProgressionState {
    const { currentRank, nextRank } = this.getRankForXp(this.totalXp);

    let rankProgressPercent = 100;
    let xpToNextRank = 0;

    if (nextRank) {
      const range = nextRank.minXp - currentRank.minXp;
      const currentWithinRange = this.totalXp - currentRank.minXp;
      rankProgressPercent = Math.min(100, Math.max(0, Math.round((currentWithinRange / range) * 100)));
      xpToNextRank = Math.max(0, nextRank.minXp - this.totalXp);
    }

    const tasksList = Object.values(this.taskStates);
    const completedCount = tasksList.filter((t) => t.isCompleted).length;

    return {
      totalXp: this.totalXp,
      currentRank,
      nextRank,
      rankProgressPercent,
      xpToNextRank,
      tasks: { ...this.taskStates },
      completedCount,
      totalTasks: tasksList.length,
    };
  }

  public subscribe(listener: ProgressionListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onRankUp(listener: RankUpListener): () => void {
    this.rankUpListeners.add(listener);
    return () => {
      this.rankUpListeners.delete(listener);
    };
  }

  public onTaskComplete(listener: TaskCompleteListener): () => void {
    this.taskCompleteListeners.add(listener);
    return () => {
      this.taskCompleteListeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch {}
    }
  }

  private saveState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = JSON.stringify({
          totalXp: this.totalXp,
          tasks: this.taskStates,
        });
        window.localStorage.setItem(STORAGE_KEY, serialized);
      }
    } catch {}
  }

  private loadState() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.totalXp === 'number') {
            this.totalXp = parsed.totalXp;
          }
          if (parsed.tasks && typeof parsed.tasks === 'object') {
            for (const [id, state] of Object.entries(parsed.tasks)) {
              if (this.taskStates[id] && state) {
                const s = state as QuestTaskState;
                this.taskStates[id].currentProgress = typeof s.currentProgress === 'number' ? s.currentProgress : this.taskStates[id].currentProgress;
                this.taskStates[id].isCompleted = typeof s.isCompleted === 'boolean' ? s.isCompleted : this.taskStates[id].isCompleted;
              }
            }
          }
        }
      }
    } catch {}
  }
}

// Export singleton instance
export const questProgressionEngine = new QuestProgressionEngine();
