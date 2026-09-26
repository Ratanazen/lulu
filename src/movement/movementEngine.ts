import { DesktopWindowService } from '../services/desktopWindow';
import { eventBus } from '../services/eventBus';
import { MonitorInfo, MovementConfig, MovementMode, MovementState, Vector2D } from '../types';

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  walkSpeed: 100,        // px/s
  runSpeed: 220,         // px/s
  acceleration: 260,     // px/s^2
  deceleration: 380,     // px/s^2
  edgePadding: 40,       // px from monitor edges
  idleProbability: 0.6,
  explorationProbability: 0.4,
};

export class MovementEngine {
  private state: MovementState = {
    currentPosition: { x: 200, y: 200 },
    targetPosition: null,
    velocity: { x: 0, y: 0 },
    mode: 'idle',
    facing: 'right',
    targetMonitorId: null,
    isMoving: false,
  };

  private config: MovementConfig = { ...DEFAULT_MOVEMENT_CONFIG };
  private monitors: MonitorInfo[] = [];
  private windowSize = { width: 260, height: 320 };
  private lastTickTime: number = performance.now();
  private movementTickMs: number = 60;
  private timerId: number | null = null;
  private onStateChange?: (state: MovementState) => void;

  constructor(config?: Partial<MovementConfig>, onStateChange?: (state: MovementState) => void) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.onStateChange = onStateChange;
  }

  public setMovementTickMs(tickMs: number): void {
    this.movementTickMs = Math.max(16, tickMs);
    if (this.state.isMoving) {
      this.startTickLoop();
    }
  }

  public getMovementTickMs(): number {
    return this.movementTickMs;
  }

  public setMonitors(monitors: MonitorInfo[]): void {
    this.monitors = monitors;
  }

  public setWindowSize(size: { width: number; height: number }): void {
    this.windowSize = size;
  }

  public getState(): MovementState {
    return { ...this.state };
  }

  public updateConfig(newConfig: Partial<MovementConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public setPositionDirect(pos: Vector2D): void {
    this.stopTickLoop();
    this.state.currentPosition = { ...pos };
    this.state.targetPosition = null;
    this.state.velocity = { x: 0, y: 0 };
    this.state.isMoving = false;
    this.notifyState();
    DesktopWindowService.setPosition(pos.x, pos.y);
  }

  public walkTo(target: Vector2D): void {
    this.startMove(target, 'walk');
  }

  public runTo(target: Vector2D): void {
    this.startMove(target, 'run');
  }

  public moveTo(target: Vector2D, mode: MovementMode = 'walk'): void {
    this.startMove(target, mode);
  }

  public wander(targetMon?: MonitorInfo): void {
    const mon = targetMon || this.getCurrentMonitor() || this.monitors[0];
    if (!mon) return;

    // Pick random spot within monitor work area (padded)
    const minX = mon.workAreaX + this.config.edgePadding;
    const maxX = mon.workAreaX + mon.workAreaWidth - this.windowSize.width - this.config.edgePadding;
    const minY = mon.workAreaY + this.config.edgePadding;
    const maxY = mon.workAreaY + mon.workAreaHeight - this.windowSize.height - this.config.edgePadding;

    const targetX = Math.round(minX + Math.random() * Math.max(0, maxX - minX));
    const targetY = Math.round(minY + Math.random() * Math.max(0, maxY - minY));

    this.startMove({ x: targetX, y: targetY }, 'wander');
  }

  public visitMonitor(monitorId: string): void {
    const mon = this.monitors.find((m) => m.id === monitorId);
    if (!mon) return;
    this.state.targetMonitorId = monitorId;
    this.wander(mon);
  }

  public goHome(home: Vector2D): void {
    this.startMove(home, 'goHome');
  }

  public perchOnTaskbar(): void {
    const mon = this.getCurrentMonitor() || this.monitors[0];
    if (!mon) return;
    const targetX = Math.round(mon.workAreaX + mon.workAreaWidth / 2 - this.windowSize.width / 2);
    const targetY = mon.workAreaY + mon.workAreaHeight - this.windowSize.height;
    this.startMove({ x: targetX, y: targetY }, 'walk');
  }

  public dockToEdge(side: 'left' | 'right' | 'top' | 'bottom'): void {
    const mon = this.getCurrentMonitor() || this.monitors[0];
    if (!mon) return;
    let targetX = this.state.currentPosition.x;
    let targetY = this.state.currentPosition.y;

    switch (side) {
      case 'left':
        targetX = mon.workAreaX;
        break;
      case 'right':
        targetX = mon.workAreaX + mon.workAreaWidth - this.windowSize.width;
        break;
      case 'top':
        targetY = mon.workAreaY;
        break;
      case 'bottom':
        targetY = mon.workAreaY + mon.workAreaHeight - this.windowSize.height;
        break;
    }
    this.startMove({ x: targetX, y: targetY }, 'walk');
  }

  public sendToMonitor(monitorId: string): void {
    const mon = this.monitors.find((m) => m.id === monitorId);
    if (!mon) return;
    const targetX = Math.round(mon.workAreaX + mon.workAreaWidth / 2 - this.windowSize.width / 2);
    const targetY = Math.round(mon.workAreaY + mon.workAreaHeight / 2 - this.windowSize.height / 2);
    this.startMove({ x: targetX, y: targetY }, 'run');
  }

  public followCursor(cursorPos: Vector2D): void {
    // Keep a slight friendly distance
    const target: Vector2D = {
      x: cursorPos.x - this.windowSize.width / 2,
      y: cursorPos.y - this.windowSize.height / 2,
    };
    this.startMove(target, 'followCursor');
  }

  public stop(): void {
    this.stopTickLoop();
    this.state.targetPosition = null;
    this.state.velocity = { x: 0, y: 0 };
    this.state.isMoving = false;
    this.state.mode = 'idle';
    this.notifyState();
    eventBus.emit('MOVEMENT_FINISHED', 'MovementEngine', { position: this.state.currentPosition });
  }

  public pause(): void {
    this.stopTickLoop();
    this.state.mode = 'paused';
    this.state.velocity = { x: 0, y: 0 };
    this.state.isMoving = false;
    this.notifyState();
  }

  public resume(): void {
    if (this.state.mode === 'paused') {
      this.state.mode = 'idle';
      this.notifyState();
    }
  }

  public startTickLoop(tickRateHz?: number): void {
    this.stopTickLoop();
    this.lastTickTime = performance.now();
    const intervalMs = tickRateHz ? 1000 / tickRateHz : this.movementTickMs;

    this.timerId = window.setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  public stopTickLoop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Physics simulation step:
   * Decoupled from animation frame render.
   */
  public tick(currentTime: number = performance.now()): void {
    const dt = Math.min((currentTime - this.lastTickTime) / 1000, 0.1);
    this.lastTickTime = currentTime;

    if (this.state.mode === 'paused' || !this.state.isMoving || !this.state.targetPosition) {
      this.stopTickLoop();
      return;
    }


    const { currentPosition, targetPosition } = this.state;
    const dx = targetPosition.x - currentPosition.x;
    const dy = targetPosition.y - currentPosition.y;
    const distance = Math.hypot(dx, dy);

    // Arrival detection threshold
    const arrivalThreshold = 4.0;
    if (distance <= arrivalThreshold) {
      this.state.currentPosition = { ...targetPosition };
      this.stop();
      DesktopWindowService.setPosition(this.state.currentPosition.x, this.state.currentPosition.y);
      return;
    }

    // Direction vector
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Determine target speed based on mode
    const targetSpeed = this.state.mode === 'run' ? this.config.runSpeed : this.config.walkSpeed;

    // Accelerate / decelerate
    const currentSpeed = Math.hypot(this.state.velocity.x, this.state.velocity.y);
    const stoppingDistance = (currentSpeed * currentSpeed) / (2 * this.config.deceleration);

    let nextSpeed = currentSpeed;
    if (distance <= stoppingDistance) {
      nextSpeed = Math.max(0, currentSpeed - this.config.deceleration * dt);
    } else {
      nextSpeed = Math.min(targetSpeed, currentSpeed + this.config.acceleration * dt);
    }

    this.state.velocity = {
      x: dirX * nextSpeed,
      y: dirY * nextSpeed,
    };

    // Update facing
    if (Math.abs(this.state.velocity.x) > 2) {
      this.state.facing = this.state.velocity.x > 0 ? 'right' : 'left';
    }

    // Calculate new position
    let newX = currentPosition.x + this.state.velocity.x * dt;
    let newY = currentPosition.y + this.state.velocity.y * dt;

    // Clamp to monitor boundaries
    const clamped = this.clampToMonitors(newX, newY);
    this.state.currentPosition = { x: clamped.x, y: clamped.y };

    // Move REAL native window!
    DesktopWindowService.setPosition(this.state.currentPosition.x, this.state.currentPosition.y);
    this.notifyState();
  }

  private startMove(target: Vector2D, mode: MovementMode): void {
    const clampedTarget = this.clampToMonitors(target.x, target.y);
    this.state.targetPosition = clampedTarget;
    this.state.mode = mode;
    this.state.isMoving = true;

    if (clampedTarget.x !== this.state.currentPosition.x) {
      this.state.facing = clampedTarget.x > this.state.currentPosition.x ? 'right' : 'left';
    }

    this.notifyState();
    this.startTickLoop();
    eventBus.emit('MOVEMENT_STARTED', 'MovementEngine', {
      mode,
      from: this.state.currentPosition,
      to: clampedTarget,
    });
  }

  private clampToMonitors(x: number, y: number): Vector2D {
    if (this.monitors.length === 0) {
      return { x, y };
    }

    // Find closest monitor
    let targetMon = this.monitors[0];
    let minDist = Infinity;

    for (const mon of this.monitors) {
      const right = mon.workAreaX + mon.workAreaWidth;
      const bottom = mon.workAreaY + mon.workAreaHeight;
      if (x >= mon.workAreaX && x <= right && y >= mon.workAreaY && y <= bottom) {
        targetMon = mon;
        minDist = 0;
        break;
      }
      const centerX = mon.workAreaX + mon.workAreaWidth / 2;
      const centerY = mon.workAreaY + mon.workAreaHeight / 2;
      const dist = Math.hypot(x - centerX, y - centerY);
      if (dist < minDist) {
        minDist = dist;
        targetMon = mon;
      }
    }

    const minX = targetMon.workAreaX;
    const maxX = targetMon.workAreaX + targetMon.workAreaWidth - this.windowSize.width;
    const minY = targetMon.workAreaY;
    const maxY = targetMon.workAreaY + targetMon.workAreaHeight - this.windowSize.height;

    const clampedX = Math.max(minX, Math.min(x, maxX));
    const clampedY = Math.max(minY, Math.min(y, maxY));

    return { x: Math.round(clampedX), y: Math.round(clampedY) };
  }

  private getCurrentMonitor(): MonitorInfo | null {
    for (const m of this.monitors) {
      const r = m.workAreaX + m.workAreaWidth;
      const b = m.workAreaY + m.workAreaHeight;
      const { x, y } = this.state.currentPosition;
      if (x >= m.workAreaX && x <= r && y >= m.workAreaY && y <= b) {
        return m;
      }
    }
    return this.monitors[0] || null;
  }

  private notifyState(): void {
    if (this.onStateChange) {
      this.onStateChange({ ...this.state });
    }
  }
}
