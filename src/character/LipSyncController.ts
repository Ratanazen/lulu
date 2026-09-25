import { MouthShape } from '../types';

export type LipSyncListener = (shape: MouthShape) => void;

export class LipSyncController {
  private currentShape: MouthShape = 'closed';
  private listeners = new Set<LipSyncListener>();
  private speechInterval: number | null = null;
  private analyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array | null = null;

  public getShape(): MouthShape {
    return this.currentShape;
  }

  public setShape(shape: MouthShape): void {
    if (this.currentShape !== shape) {
      this.currentShape = shape;
      this.notifyListeners();
    }
  }

  public subscribe(listener: LipSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentShape);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      l(this.currentShape);
    });
  }

  /**
   * Connect an active Web Audio AnalyserNode to drive real-time mouth movement from audio stream
   */
  public attachAudioAnalyser(analyser: AnalyserNode): void {
    this.analyser = analyser;
    this.analyser.fftSize = 256;
    this.audioDataArray = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /**
   * Evaluates audio amplitude if AnalyserNode is connected
   */
  public updateFromAudio(): MouthShape {
    if (!this.analyser || !this.audioDataArray) {
      return this.currentShape;
    }

    this.analyser.getByteFrequencyData(this.audioDataArray as any);
    let sum = 0;
    for (let i = 0; i < this.audioDataArray.length; i++) {
      sum += this.audioDataArray[i];
    }
    const avg = sum / this.audioDataArray.length;

    let shape: MouthShape = 'closed';
    if (avg > 70) {
      shape = 'open';
    } else if (avg > 40) {
      shape = 'medium';
    } else if (avg > 15) {
      shape = 'small';
    } else if (avg > 5) {
      shape = 'smile';
    }

    this.setShape(shape);
    return shape;
  }

  /**
   * Starts simulated natural speech lip sync cadence (fallback when raw audio buffers are not exposed)
   */
  public startSpeechCadence(): void {
    this.stopSpeechCadence();
    const shapes: MouthShape[] = ['small', 'medium', 'open', 'small', 'smile', 'medium'];
    let idx = 0;

    this.speechInterval = window.setInterval(() => {
      idx = (idx + 1) % shapes.length;
      this.setShape(shapes[idx]);
    }, 110);
  }

  /**
   * Stops lip sync and restores resting mouth shape
   */
  public stopSpeechCadence(restingShape: MouthShape = 'closed'): void {
    if (this.speechInterval !== null) {
      clearInterval(this.speechInterval);
      this.speechInterval = null;
    }
    this.setShape(restingShape);
  }
}

export const lipSyncController = new LipSyncController();
