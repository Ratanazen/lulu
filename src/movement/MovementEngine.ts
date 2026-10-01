import { invokeCommand } from '../services/tauriBridge';
import { NativeMonitorInfo } from '../types/pet';

export type RunDirection = 'left' | 'right';
export type RunMode = 'idle' | 'timed' | 'continuous';

export interface MovementState {
  isRunning: boolean;
  runMode: RunMode;
  runDirection: RunDirection;
  runStartedAt: number;
  runDuration: number;
  runSpeed: number;
  currentFrame: number;
  isPaused: boolean;
  speedMultiplier: number;
  currentX?: number;
  currentY?: number;
}

export interface MovementConfig {
  walkSpeed: number;        // Pixels per step (default 4)
  runSpeed: number;         // Pixels per step (default 8)
  edgePadding: number;      // Distance from screen boundary (default 40)
  tickIntervalMs: number;   // Movement step interval (25 FPS -> 40ms/frame)
}

export class MovementEngine {
  private currentX: number = 200;
  private currentY: number = 200;
  private targetX: number = 200;
  private targetY: number = 200;
  private isMoving: boolean = false;
  private isContinuousRunning: boolean = false;
  private isPaused: boolean = false;
  private runMode: RunMode = 'idle';
  private runDirection: RunDirection = 'right';
  private runStartedAt: number = 0;
  private runDuration: number = 0;
  private currentFrame: number = 0;
  private timer: any = null;
  private timedRunTimer: any = null;
  private activeMonitor: NativeMonitorInfo | null = null;
  private onPositionUpdate?: (x: number, y: number, isMoving: boolean, direction: 'left' | 'right' | 'idle', isRunning?: boolean) => void;

  private baseConfig: MovementConfig = {
    walkSpeed: 3,
    runSpeed: 5,
    edgePadding: 50,
    tickIntervalMs: 50, // 20 FPS = 50ms smooth movement step
  };

  private speedMultiplier: number = 1.0; // Normal, natural speed default

  private config: MovementConfig = {
    walkSpeed: 3,
    runSpeed: 5,
    edgePadding: 50,
    tickIntervalMs: 50,
  };

  constructor() {
    this.syncCurrentPosition();
  }

  public setSpeedMultiplier(multiplier: number) {
    this.speedMultiplier = multiplier;
    this.config.runSpeed = Math.max(1, Math.round(this.baseConfig.runSpeed * multiplier));
    this.config.walkSpeed = Math.max(1, Math.round(this.baseConfig.walkSpeed * multiplier));
    this.config.tickIntervalMs = Math.round(this.baseConfig.tickIntervalMs / multiplier);
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public setListener(fn: (x: number, y: number, isMoving: boolean, direction: 'left' | 'right' | 'idle', isRunning?: boolean) => void) {
    this.onPositionUpdate = fn;
  }

  public setMonitor(m: NativeMonitorInfo) {
    this.activeMonitor = m;
  }

  public async syncCurrentPosition() {
    try {
      const pos = await invokeCommand<{ x: number; y: number }>('get_window_position');
      if (pos && typeof pos.x === 'number') {
        this.currentX = pos.x;
        this.currentY = pos.y;
      }
    } catch {
      // In web/mock preview fallback
    }
  }

  public walkTo(targetX: number, targetY: number) {
    this.clampTarget(targetX, targetY);
    this.startMoveLoop(false);
  }

  public runTo(targetX: number, targetY: number) {
    this.clampTarget(targetX, targetY);
    this.startMoveLoop(true);
  }

  public followCursor(cursorX: number, cursorY: number) {
    // Keep friendly offset centered on pet
    const targetX = cursorX - 120;
    const targetY = cursorY - 140;
    this.clampTarget(targetX, targetY);
    this.startMoveLoop(true);
  }

  public randomWander() {
    if (!this.activeMonitor) {
      this.walkTo(this.currentX + (Math.random() * 200 - 100), this.currentY);
      return;
    }

    const minX = this.activeMonitor.work_area_x + this.config.edgePadding;
    const maxX = this.activeMonitor.work_area_x + this.activeMonitor.work_area_width - 240 - this.config.edgePadding;
    const newX = Math.floor(minX + Math.random() * Math.max(10, maxX - minX));

    // Pet typically wanders along the lower screen dock / floor
    const floorY = this.activeMonitor.work_area_y + this.activeMonitor.work_area_height - 300 - this.config.edgePadding;
    const jitterY = floorY + Math.floor(Math.random() * 40 - 20);

    // 65% chance to sprint / run with 40-frame animation, 35% chance to walk
    if (Math.random() < 0.65) {
      this.runTo(newX, jitterY);
    } else {
      this.walkTo(newX, jitterY);
    }
  }

  public sprintLap(direction?: 'left' | 'right') {
    if (!this.activeMonitor) {
      const delta = direction === 'left' ? -350 : 350;
      this.runTo(this.currentX + delta, this.currentY);
      return;
    }

    const minX = this.activeMonitor.work_area_x + this.config.edgePadding;
    const maxX = this.activeMonitor.work_area_x + this.activeMonitor.work_area_width - 240 - this.config.edgePadding;
    const floorY = this.activeMonitor.work_area_y + this.activeMonitor.work_area_height - 300 - this.config.edgePadding;

    let targetX = direction === 'left' ? minX : maxX;
    if (!direction) {
      // If close to right edge, run left; otherwise run right
      targetX = this.currentX > (minX + maxX) / 2 ? minX : maxX;
    }

    this.runTo(targetX, floorY);
  }

  public goHome(homeX: number, homeY: number) {
    this.runTo(homeX, homeY);
  }

  public getState(): MovementState {
    return {
      isRunning: this.isMoving && this.runMode !== 'idle',
      runMode: this.runMode,
      runDirection: this.runDirection,
      runStartedAt: this.runStartedAt,
      runDuration: this.runDuration,
      runSpeed: this.config.runSpeed,
      currentFrame: this.currentFrame,
      isPaused: this.isPaused,
      speedMultiplier: this.speedMultiplier,
      currentX: this.currentX,
      currentY: this.currentY,
    };
  }

  public getPosition(): { x: number; y: number } {
    return { x: this.currentX, y: this.currentY };
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
  }

  public stop() {
    this.isMoving = false;
    this.isContinuousRunning = false;
    this.isPaused = false;
    this.runMode = 'idle';
    if (this.timedRunTimer) {
      clearTimeout(this.timedRunTimer);
      this.timedRunTimer = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.onPositionUpdate?.(this.currentX, this.currentY, false, 'idle', false);
  }

  public startTimedRun(durationSeconds: number = 40, onComplete?: () => void) {
    if (this.timedRunTimer) {
      clearTimeout(this.timedRunTimer);
      this.timedRunTimer = null;
    }
    this.runMode = 'timed';
    this.isContinuousRunning = true;
    this.isPaused = false;
    this.runStartedAt = Date.now();
    this.runDuration = durationSeconds * 1000;
    this.sprintLap();
    this.timedRunTimer = setTimeout(() => {
      this.stop();
      onComplete?.();
    }, durationSeconds * 1000);
  }

  public startContinuousRun() {
    if (this.timedRunTimer) {
      clearTimeout(this.timedRunTimer);
      this.timedRunTimer = null;
    }
    this.runMode = 'continuous';
    this.isContinuousRunning = true;
    this.isPaused = false;
    this.runStartedAt = Date.now();
    this.runDuration = 0;
    this.sprintLap();
  }

  public stopContinuousRun() {
    this.stop();
  }

  public toggleContinuousRun(): boolean {
    if (this.isContinuousRunning || this.runMode === 'continuous') {
      this.stop();
      return false;
    } else {
      this.startContinuousRun();
      return true;
    }
  }

  public isContinuousRun(): boolean {
    return this.isContinuousRunning || this.runMode === 'continuous';
  }

  public getRunMode(): RunMode {
    return this.runMode;
  }

  private clampTarget(tx: number, ty: number) {
    if (this.activeMonitor) {
      const minX = this.activeMonitor.work_area_x + this.config.edgePadding;
      const maxX = this.activeMonitor.work_area_x + this.activeMonitor.work_area_width - 240 - this.config.edgePadding;
      const minY = this.activeMonitor.work_area_y + this.config.edgePadding;
      const maxY = this.activeMonitor.work_area_y + this.activeMonitor.work_area_height - 300 - this.config.edgePadding;

      this.targetX = Math.max(minX, Math.min(maxX, tx));
      this.targetY = Math.max(minY, Math.min(maxY, ty));
    } else {
      this.targetX = tx;
      this.targetY = ty;
    }
  }

  private startMoveLoop(isRunning: boolean = false) {
    if (this.timer) clearInterval(this.timer);
    this.isMoving = true;
    const currentSpeed = isRunning ? this.config.runSpeed : this.config.walkSpeed;

    this.timer = setInterval(async () => {
      if (this.isPaused) return;

      const dx = this.targetX - this.currentX;
      const dy = this.targetY - this.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (isRunning) {
        this.currentFrame = (this.currentFrame + 1) % 1;
      }

      if (dist <= currentSpeed) {
        // Arrived at destination boundary
        this.currentX = this.targetX;
        this.currentY = this.targetY;

        if (this.isContinuousRunning || this.runMode === 'continuous' || this.runMode === 'timed') {
          // Continuous boundary bounce physics
          const minX = this.activeMonitor ? this.activeMonitor.work_area_x + this.config.edgePadding : 50;
          const maxX = this.activeMonitor ? this.activeMonitor.work_area_x + this.activeMonitor.work_area_width - 240 - this.config.edgePadding : 1500;
          const nextTargetX = this.currentX > (minX + maxX) / 2 ? minX : maxX;
          this.targetX = nextTargetX;
          this.runDirection = nextTargetX > this.currentX ? 'right' : 'left';
          return;
        }

        this.stop();
        await this.applyNativePosition(this.currentX, this.currentY);
        return;
      }

      const stepX = (dx / dist) * currentSpeed;
      const stepY = (dy / dist) * currentSpeed;

      this.currentX += stepX;
      this.currentY += stepY;

      const dir: RunDirection = dx < 0 ? 'left' : 'right';
      this.runDirection = dir;
      this.onPositionUpdate?.(Math.round(this.currentX), Math.round(this.currentY), true, dir, isRunning);

      await this.applyNativePosition(Math.round(this.currentX), Math.round(this.currentY));
    }, this.config.tickIntervalMs);
  }

  private async applyNativePosition(x: number, y: number) {
    try {
      await invokeCommand('set_window_position', { x, y });
    } catch {
      // In web/preview environment
    }
  }
}
