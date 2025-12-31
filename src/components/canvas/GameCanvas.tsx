import React, { useRef, useEffect } from "react";
import { CanvasConfig, DEFAULT_CANVAS_CONFIG } from "@/constants/canvasConfig";
import "./GameCanvas.css";

interface GameCanvasProps {
  config: CanvasConfig;
  onReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  onResize?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ config, onReady, onResize }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onResizeRef = useRef(onResize);
  const initializedRef = useRef(false);

  // onReady, onResize ref 업데이트
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onResizeRef.current = onResize;
  }, [onResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get 2D context");
      return;
    }

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const aspectRatio = config.aspectRatio || DEFAULT_CANVAS_CONFIG.aspectRatio || 16 / 9;
      
      // 최대 너비 제한 (header-content와 동일)
      const maxWidth = 1200;
      const maxHeight = 675; // maxWidth / 16 * 9

      // 16:9 비율에 맞춰 크기 계산
      let canvasWidth: number;
      let canvasHeight: number;

      // 컨테이너 크기와 최대 크기 중 작은 값 사용
      const availableWidth = Math.min(containerWidth, maxWidth);
      const availableHeight = Math.min(containerHeight, maxHeight);

      if (availableWidth / availableHeight > aspectRatio) {
        // 컨테이너가 더 넓음 - 높이 기준
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * aspectRatio;
      } else {
        // 컨테이너가 더 높음 - 너비 기준
        canvasWidth = availableWidth;
        canvasHeight = canvasWidth / aspectRatio;
      }

      // 실제 Canvas 크기 (고해상도)
      canvas.width = canvasWidth * dpr;
      canvas.height = canvasHeight * dpr;
      ctx.scale(dpr, dpr);

      // CSS 크기 (논리적 크기)
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.display = "block";
      canvas.style.maxWidth = "100%";
      canvas.style.maxHeight = "100%";

      // 초기화 시에만 onReady 호출 (무한 루프 방지)
      if (!initializedRef.current && onReadyRef.current) {
        initializedRef.current = true;
        onReadyRef.current(canvas, ctx);
      }

      // 크기 변경 시 onResize 호출 (초기화 이후)
      if (initializedRef.current && onResizeRef.current) {
        // 약간의 지연을 두어 Canvas 크기가 완전히 설정된 후 호출
        setTimeout(() => {
          if (onResizeRef.current) {
            onResizeRef.current(canvas, ctx);
          }
        }, 0);
      }
    };

    setupCanvas();

    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      initializedRef.current = false; // cleanup 시 초기화 플래그 리셋
    };
  }, [config]); // onReady를 dependency에서 제거

  return (
    <div ref={containerRef} className="game-canvas-wrapper">
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
};

export default GameCanvas;


