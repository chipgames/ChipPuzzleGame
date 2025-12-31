import { Gem } from "@/types/gem";
import { TweenAnimation, Easing } from "./animation";

/**
 * 젬 이동 애니메이션 생성
 */
export function animateGemMove(
  gem: Gem,
  targetX: number,
  targetY: number,
  duration: number,
  onUpdate: (x: number, y: number) => void,
  onComplete?: () => void
): TweenAnimation[] {
  const animations: TweenAnimation[] = [];

  // X 이동
  animations.push(
    new TweenAnimation(
      gem.x,
      targetX,
      duration,
      Easing.easeOutCubic,
      (value) => {
        gem.x = value;
        onUpdate(gem.x, gem.y);
      }
    )
  );

  // Y 이동
  animations.push(
    new TweenAnimation(
      gem.y,
      targetY,
      duration,
      Easing.easeOutCubic,
      (value) => {
        gem.y = value;
        onUpdate(gem.x, gem.y);
      },
      onComplete
    )
  );

  return animations;
}

/**
 * 젬 제거 애니메이션 (페이드아웃 + 스케일)
 */
export function animateGemRemove(
  gem: Gem,
  duration: number,
  onUpdate: (scale: number, alpha: number) => void,
  onComplete?: () => void
): TweenAnimation {
  const startScale = gem.scale || 1;
  const startAlpha = 1;

  return new TweenAnimation(
    1,
    0,
    duration,
    Easing.easeInQuad,
    (value) => {
      gem.scale = startScale * value;
      const alpha = value;
      onUpdate(gem.scale, alpha);
    },
    onComplete
  );
}

/**
 * 젬 교환 애니메이션
 */
export function animateGemSwap(
  gem1: Gem,
  gem2: Gem,
  targetX1: number,
  targetY1: number,
  targetX2: number,
  targetY2: number,
  duration: number,
  onUpdate: () => void,
  onComplete?: () => void
): TweenAnimation[] {
  const animations: TweenAnimation[] = [];

  // 젬1 이동
  animations.push(
    ...animateGemMove(gem1, targetX1, targetY1, duration, () => onUpdate())
  );

  // 젬2 이동
  animations.push(
    ...animateGemMove(
      gem2,
      targetX2,
      targetY2,
      duration,
      () => onUpdate(),
      onComplete
    )
  );

  return animations;
}

/**
 * 젬 생성 애니메이션 (위에서 떨어지는 효과)
 */
export function animateGemSpawn(
  gem: Gem,
  targetY: number,
  duration: number,
  onUpdate: (y: number) => void,
  onComplete?: () => void
): TweenAnimation {
  const startY = gem.y;
  gem.y = startY - 100; // 위에서 시작

  return new TweenAnimation(
    gem.y,
    targetY,
    duration,
    Easing.easeOutBounce,
    (value) => {
      gem.y = value;
      onUpdate(gem.y);
    },
    onComplete
  );
}









