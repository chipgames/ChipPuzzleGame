// 간단한 사운드 매니저 (Web Audio API 기반, 외부 음원 필요 없음)

import { logger } from "./logger";

type WaveType = OscillatorType;

export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;

    try {
      if (!this.audioCtx) {
        const Ctor = (window.AudioContext || window.webkitAudioContext) as typeof AudioContext;
        if (!Ctor) {
          logger.warn("Web Audio API is not supported in this browser");
          this.enabled = false;
          return null;
        }
        try {
          this.audioCtx = new Ctor();
          // AudioContext 상태 확인 및 재개 (일부 브라우저에서 필요)
          if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume().catch((err) => {
              logger.warn("Failed to resume AudioContext", { error: err });
            });
          }
        } catch (err) {
          logger.warn("Failed to create AudioContext", { error: err });
          this.enabled = false;
          return null;
        }
      }
      return this.audioCtx;
    } catch (e) {
      logger.warn("Failed to initialize AudioContext", { error: e });
      this.enabled = false;
      return null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: WaveType = "sine",
    volume: number = 0.2
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.value = volume;

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;
    oscillator.start(now);
    oscillator.stop(now + duration);

    // 부드러운 페이드 아웃
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
  }

  // UI 클릭 사운드
  public playClick() {
    this.playTone(440, 0.08, "square", 0.15);
  }

  // 일반 매치 사운드
  public playMatch() {
    this.playTone(660, 0.12, "triangle", 0.2);
  }

  // 특수젬 / 콤보 사운드
  public playSpecial() {
    this.playTone(880, 0.16, "sawtooth", 0.22);
  }

  // 스테이지 클리어 사운드 (짧은 두 음)
  public playStageClear() {
    const ctx = this.getContext();
    if (!ctx) return;

    this.playTone(880, 0.15, "triangle", 0.22);
    setTimeout(() => {
      this.playTone(1046.5, 0.18, "triangle", 0.22);
    }, 120);
  }

  // 게임 오버 사운드 (하강 음)
  public playGameOver() {
    const ctx = this.getContext();
    if (!ctx) return;

    const startFreq = 440;
    const endFreq = 220;
    const duration = 0.4;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      endFreq,
      ctx.currentTime + duration
    );

    gain.gain.value = 0.22;
    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }
}

// 전역에서 재사용할 싱글톤 인스턴스
export const soundManager = new SoundManager();










