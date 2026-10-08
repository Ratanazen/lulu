import { describe, it, expect, beforeEach } from 'vitest';
import { QuestProgressionEngine, SHINOBI_RANKS } from '../src/features/progression/QuestProgressionEngine';

describe('QuestProgressionEngine & Shinobi Rank Ladder', () => {
  let engine: QuestProgressionEngine;

  beforeEach(() => {
    engine = new QuestProgressionEngine();
    engine.resetProgression();
  });

  it('1. initializes at Level 1 Academy Student with 0 XP', () => {
    const state = engine.getState();
    expect(state.totalXp).toBe(0);
    expect(state.currentRank.level).toBe(1);
    expect(state.currentRank.title).toBe('Academy Student');
    expect(state.nextRank?.level).toBe(2);
    expect(state.nextRank?.title).toBe('Shinobi Genin');
    expect(state.xpToNextRank).toBe(250);
    expect(state.rankProgressPercent).toBe(0);
  });

  it('2. maps XP across all 9 Shinobi ranks accurately', () => {
    expect(engine.getRankForXp(0).currentRank.title).toBe('Academy Student');
    expect(engine.getRankForXp(250).currentRank.title).toBe('Shinobi Genin');
    expect(engine.getRankForXp(650).currentRank.title).toBe('Chunin Vanguard');
    expect(engine.getRankForXp(1300).currentRank.title).toBe('Special Jonin');
    expect(engine.getRankForXp(2200).currentRank.title).toBe('Jonin Commander');
    expect(engine.getRankForXp(3500).currentRank.title).toBe('ANBU Black Ops');
    expect(engine.getRankForXp(5200).currentRank.title).toBe('Legendary Sannin');
    expect(engine.getRankForXp(7500).currentRank.title).toBe('Hokage Guardian');
    expect(engine.getRankForXp(11000).currentRank.title).toBe('Rikudo Shadow Sage');
    expect(engine.getRankForXp(11000).nextRank).toBeNull();
  });

  it('3. triggers rankUp callback when crossing level boundaries', () => {
    let promotedTo: string | null = null;
    let oldLevel: number | null = null;

    engine.onRankUp((newRank, oldRank) => {
      promotedTo = newRank.title;
      oldLevel = oldRank.level;
    });

    engine.addXp(300); // 0 -> 300 (Level 1 -> Level 2)

    expect(promotedTo).toBe('Shinobi Genin');
    expect(oldLevel).toBe(1);
    expect(engine.getState().currentRank.level).toBe(2);
  });

  it('4. increments task progress and triggers task completion when reaching max', () => {
    let completedTaskId = '';
    let earnedXp = 0;

    engine.onTaskComplete((taskId, xp) => {
      completedTaskId = taskId;
      earnedXp = xp;
    });

    // Petting comfort quest requires 10 pets, awards 180 XP
    for (let i = 0; i < 9; i++) {
      engine.incrementTaskProgress('melancholic_love_comfort', 1);
    }

    let state = engine.getState();
    expect(state.tasks['melancholic_love_comfort'].currentProgress).toBe(9);
    expect(state.tasks['melancholic_love_comfort'].isCompleted).toBe(false);

    // 10th pet triggers completion
    engine.incrementTaskProgress('melancholic_love_comfort', 1);

    state = engine.getState();
    expect(state.tasks['melancholic_love_comfort'].currentProgress).toBe(10);
    expect(state.tasks['melancholic_love_comfort'].isCompleted).toBe(true);
    expect(completedTaskId).toBe('melancholic_love_comfort');
    expect(earnedXp).toBe(180);
    expect(state.totalXp).toBe(180);
  });

  it('5. action hooks increment relevant quests and grant XP', () => {
    engine.recordPet();
    let state = engine.getState();
    expect(state.totalXp).toBe(10);
    expect(state.tasks['melancholic_love_comfort'].currentProgress).toBe(1);

    engine.recordSprintLap();
    state = engine.getState();
    expect(state.totalXp).toBe(35); // 10 + 25
    expect(state.tasks['continuous_sprint_master'].currentProgress).toBe(1);
    expect(state.tasks['wayland_desktop_traversal'].currentProgress).toBe(1);

    engine.recordWalkLap();
    state = engine.getState();
    expect(state.totalXp).toBe(55); // 35 + 20
    expect(state.tasks['walk_go_and_back_patrol'].currentProgress).toBe(1);
  });

  it('6. unlockAllTasks completes all tasks and ascends to Rikudo Shadow Sage', () => {
    engine.unlockAllTasks();
    const state = engine.getState();

    expect(state.completedCount).toBe(state.totalTasks);
    expect(state.totalXp).toBeGreaterThanOrEqual(10500);
    expect(state.currentRank.title).toBe('Rikudo Shadow Sage');

    for (const task of Object.values(state.tasks)) {
      expect(task.isCompleted).toBe(true);
      expect(task.currentProgress).toBe(task.maxProgress);
    }
  });

  it('7. resetProgression resets all progress back to zero', () => {
    engine.unlockAllTasks();
    expect(engine.getState().completedCount).toBe(engine.getState().totalTasks);

    engine.resetProgression();
    const state = engine.getState();

    expect(state.totalXp).toBe(0);
    expect(state.completedCount).toBe(0);
    expect(state.currentRank.level).toBe(1);
  });
});
