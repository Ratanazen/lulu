import { invokeCommand } from '../services/tauriBridge';
import { NativeMonitorInfo } from '../types/pet';

export type RunDirection = 'left' | 'right';
export type RunMode = 'idle' | 'timed' | 'continuous' | 'walk_patrol' | 'walk_continuous';
export type BoundaryPhysicsMode = 'bounce' | 'wrap' | 'roam_multi';

export interface CompositeScreenBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  totalWidth: number;
  totalHeight: number;
}

export interface MovementState {
  isRunning: boolean;
  isWalking: boolean;
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
  boundaryPhysicsMode?: BoundaryPhysicsMode;
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
  private isContinuousWalking: boolean = false;
  private isPaused: boolean = false;
  private runMode: RunMode = 'idle';
  private runDirection: RunDirection = 'right';
  private runStartedAt: number = 0;
  private runDuration: number = 0;
  private currentFrame: number = 0;
  private timer: any = null;
  private timedRunTimer: any = null;
  private activeMonitor: NativeMonitorInfo | null = null;
  private monitors: NativeMonitorInfo[] = [];
  private boundaryPhysicsMode: BoundaryPhysicsMode = 'bounce';
  private onPositionUpdate?: (x: number, y: number, isMoving: boolean, direction: 'left' | 'right' | 'idle', isRunning?: boolean) => void;
  private onWrap?: () => void;

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

  public setOnWrap(fn: () => void) {
    this.onWrap = fn;
  }

  public setMonitor(m: NativeMonitorInfo) {
    this.activeMonitor = m;
    if (this.monitors.length === 0) {
      this.monitors = [m];
    }
  }

  public setMonitors(monitors: NativeMonitorInfo[]) {
    this.monitors = monitors;
    if (!this.activeMonitor && monitors.length > 0) {
      this.activeMonitor = monitors.find((m) => m.is_primary) || monitors[0];
    }
  }

  public getMonitors(): NativeMonitorInfo[] {
    return this.monitors;
  }

  public getActiveMonitor(): NativeMonitorInfo | null {
    return this.activeMonitor;
  }

  public setBoundaryPhysicsMode(mode: BoundaryPhysicsMode) {
    this.boundaryPhysicsMode = mode;
  }

  public getBoundaryPhysicsMode(): BoundaryPhysicsMode {
    return this.boundaryPhysicsMode;
  }

  public getCompositeBounds(): CompositeScreenBounds {
    if (this.monitors.length === 0) {
      if (this.activeMonitor) {
        return {
          minX: this.activeMonitor.work_area_x,
          maxX: this.activeMonitor.work_area_x + this.activeMonitor.work_area_width,
          minY: this.activeMonitor.work_area_y,
          maxY: this.activeMonitor.work_area_y + this.activeMonitor.work_area_height,
          totalWidth: this.activeMonitor.work_area_width,
          totalHeight: this.activeMonitor.work_area_height,
        };
      }
      return { minX: 0, maxX: 1920, minY: 0, maxY: 1080, totalWidth: 1920, totalHeight: 1080 };
    }

    const minX = Math.min(...this.monitors.map((m) => m.work_area_x));
    const maxX = Math.max(...this.monitors.map((m) => m.work_area_x + m.work_area_width));
    const minY = Math.min(...this.monitors.map((m) => m.work_area_y));
    const maxY = Math.max(...this.monitors.map((m) => m.work_area_y + m.work_area_height));

    return {
      minX,
      maxX,
      minY,
      maxY,
      totalWidth: Math.max(1920, maxX - minX),
      totalHeight: Math.max(1080, maxY - minY),
    };
  }

  public getEffectiveBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    if (this.boundaryPhysicsMode === 'roam_multi' && this.monitors.length > 1) {
      const comp = this.getCompositeBounds();
      return {
        minX: comp.minX + this.config.edgePadding,
        maxX: comp.maxX - 290 - this.config.edgePadding,
        minY: comp.minY + this.config.edgePadding,
        maxY: comp.maxY - 350 - this.config.edgePadding,
      };
    }

    if (this.activeMonitor) {
      return {
        minX: this.activeMonitor.work_area_x + this.config.edgePadding,
        maxX: this.activeMonitor.work_area_x + this.activeMonitor.work_area_width - 290 - this.config.edgePadding,
        minY: this.activeMonitor.work_area_y + this.config.edgePadding,
        maxY: this.activeMonitor.work_area_y + this.activeMonitor.work_area_height - 350 - this.config.edgePadding,
      };
    }

    return {
      minX: 50,
      maxX: 1580,
      minY: 50,
      maxY: 700,
    };
  }

  public async jumpToMonitor(monitorName: string): Promise<boolean> {
    const target = this.monitors.find((m) => m.name === monitorName);
    if (!target) return false;

    this.activeMonitor = target;
    const targetX = target.work_area_x + Math.floor((target.work_area_width - 290) / 2);
    const targetY = target.work_area_y + target.work_area_height - 350 - this.config.edgePadding;

    this.currentX = targetX;
    this.currentY = targetY;
    this.targetX = targetX;
    this.targetY = targetY;

    try {
      await invokeCommand('move_to_monitor', { name: monitorName });
    } catch {
      // Fallback in web/mock
    }

    await this.applyNativePosition(targetX, targetY);
    this.onPositionUpdate?.(targetX, targetY, false, 'idle', false);
    return true;
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
    this.syncCurrentPosition().catch(() => {});
    const bounds = this.getEffectiveBounds();

    let targetX = direction === 'left' ? bounds.minX : bounds.maxX;
    if (!direction) {
      // If close to right edge, run left; otherwise run right
      targetX = this.currentX > (bounds.minX + bounds.maxX) / 2 ? bounds.minX : bounds.maxX;
    }

    const targetY = Math.max(bounds.minY, Math.min(bounds.maxY, this.currentY));
    this.runTo(targetX, targetY);
  }

  public walkLap(direction?: 'left' | 'right') {
    this.syncCurrentPosition().catch(() => {});
    const bounds = this.getEffectiveBounds();

    let targetX = direction === 'left' ? bounds.minX : bounds.maxX;
    if (!direction) {
      targetX = this.currentX > (bounds.minX + bounds.maxX) / 2 ? bounds.minX : bounds.maxX;
    }

    const targetY = Math.max(bounds.minY, Math.min(bounds.maxY, this.currentY));
    this.walkTo(targetX, targetY);
  }

  public walkGoAndBack(onComplete?: () => void) {
    if (this.timedRunTimer) {
      clearTimeout(this.timedRunTimer);
      this.timedRunTimer = null;
    }
    this.runMode = 'walk_patrol';
    this.isContinuousWalking = true;
    this.isContinuousRunning = false;
    this.isPaused = false;
    this.walkLap();

    this.timedRunTimer = setTimeout(() => {
      this.stop();
      onComplete?.();
    }, 40000);
  }

  public startContinuousWalk() {
    if (this.timedRunTimer) {
      clearTimeout(this.timedRunTimer);
      this.timedRunTimer = null;
    }
    this.runMode = 'walk_continuous';
    this.isContinuousWalking = true;
    this.isContinuousRunning = false;
    this.isPaused = false;
    this.runStartedAt = Date.now();
    this.runDuration = 0;
    this.walkLap();
  }

  public toggleContinuousWalk(): boolean {
    if (this.isContinuousWalking || this.runMode === 'walk_continuous' || this.runMode === 'walk_patrol') {
      this.stop();
      return false;
    } else {
      this.startContinuousWalk();
      return true;
    }
  }

  public isContinuousWalk(): boolean {
    return this.isContinuousWalking || this.runMode === 'walk_continuous' || this.runMode === 'walk_patrol';
  }

  public goHome(homeX: number, homeY: number) {
    this.runTo(homeX, homeY);
  }

  public getState(): MovementState {
    return {
      isRunning: this.isMoving && (this.runMode === 'continuous' || this.runMode === 'timed'),
      isWalking: this.isMoving && (this.runMode === 'walk_continuous' || this.runMode === 'walk_patrol' || (!this.isContinuousRunning && this.isMoving)),
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
      boundaryPhysicsMode: this.boundaryPhysicsMode,
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
    this.isContinuousWalking = false;
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
    const bounds = this.getEffectiveBounds();
    this.targetX = Math.max(bounds.minX, Math.min(bounds.maxX, tx));
    this.targetY = Math.max(bounds.minY, Math.min(bounds.maxY, ty));
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

        if (
          this.isContinuousRunning ||
          this.runMode === 'continuous' ||
          this.runMode === 'timed' ||
          this.isContinuousWalking ||
          this.runMode === 'walk_continuous' ||
          this.runMode === 'walk_patrol'
        ) {
          const bounds = this.getEffectiveBounds();

          if (this.boundaryPhysicsMode === 'wrap') {
            // Screen Wrapping: seamlessly warp across to opposite edge and continue dashing forward
            if (this.runDirection === 'right') {
              this.currentX = bounds.minX;
              this.targetX = bounds.maxX;
            } else {
              this.currentX = bounds.maxX;
              this.targetX = bounds.minX;
            }
            this.onWrap?.();
            await this.applyNativePosition(Math.round(this.currentX), Math.round(this.currentY));
            this.onPositionUpdate?.(Math.round(this.currentX), Math.round(this.currentY), true, this.runDirection, isRunning);
            return;
          }

          // Boundary Bounce Physics (default or multi-monitor outer boundary)
          const nextTargetX = this.currentX > (bounds.minX + bounds.maxX) / 2 ? bounds.minX : bounds.maxX;
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
