/**
 * Easing 함수들
 */
export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => --t * t * t + 1,
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutBounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  },
};

/**
 * Tween 애니메이션 클래스
 */
export class TweenAnimation {
  private startValue: number;
  private endValue: number;
  private duration: number;
  private startTime: number;
  private easing: (t: number) => number;
  private onUpdate: (value: number) => void;
  private onComplete?: () => void;
  private isRunning: boolean = false;
  private animationFrameId?: number;

  constructor(
    startValue: number,
    endValue: number,
    duration: number,
    easing: (t: number) => number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
  ) {
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easing = easing;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
    this.startTime = performance.now();
    this.isRunning = true;
    this.animate();
  }

  private animate = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);
    const currentValue =
      this.startValue + (this.endValue - this.startValue) * easedProgress;

    this.onUpdate(currentValue);

    if (progress < 1) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.isRunning = false;
      if (this.onComplete) {
        this.onComplete();
      }
    }
  };

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== undefined) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public get isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * 애니메이션 그룹 관리
 */
export class AnimationGroup {
  private animations: TweenAnimation[] = [];
  private onAllComplete?: () => void;

  public add(animation: TweenAnimation) {
    this.animations.push(animation);
  }

  public setOnAllComplete(callback: () => void) {
    this.onAllComplete = callback;
  }

  public update() {
    // 완료된 애니메이션 제거
    this.animations = this.animations.filter((anim) => anim.isActive);

    // 모든 애니메이션이 완료되었는지 확인
    if (this.animations.length === 0 && this.onAllComplete) {
      this.onAllComplete();
      this.onAllComplete = undefined;
    }
  }

  public stopAll() {
    this.animations.forEach((anim) => anim.stop());
    this.animations = [];
  }

  public get isEmpty(): boolean {
    return this.animations.length === 0;
  }
}









