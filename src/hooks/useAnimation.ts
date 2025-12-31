import { useRef, useEffect, useCallback } from "react";
import { TweenAnimation } from "@/utils/animation";

/**
 * 애니메이션 관리 훅
 */
export const useAnimation = () => {
  const animationsRef = useRef<TweenAnimation[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const addAnimation = useCallback((animation: TweenAnimation) => {
    animationsRef.current.push(animation);
    
    // 애니메이션 루프 시작 (아직 시작하지 않았다면)
    if (animationFrameRef.current === null) {
      startAnimationLoop();
    }
  }, []);

  const startAnimationLoop = useCallback(() => {
    const animate = () => {
      // 완료된 애니메이션 제거
      animationsRef.current = animationsRef.current.filter(
        (anim) => anim.isActive
      );

      // 애니메이션이 남아있으면 계속
      if (animationsRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  const stopAll = useCallback(() => {
    animationsRef.current.forEach((anim) => anim.stop());
    animationsRef.current = [];
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, [stopAll]);

  return {
    addAnimation,
    stopAll,
    hasActiveAnimations: animationsRef.current.length > 0,
  };
};









