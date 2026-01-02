import React, { useState, useCallback, useRef, useEffect } from "react";
import GameCanvas from "@/components/canvas/GameCanvas";
import { GemRenderer } from "@/components/canvas/GemRenderer";
import { CanvasConfig } from "@/constants/canvasConfig";
import { DEFAULT_CANVAS_CONFIG } from "@/constants/canvasConfig";
import { DEFAULT_GRID_SIZE } from "@/constants/gameConfig";
import { GameScreen } from "@/types/ui";
import { useLanguage } from "@/hooks/useLanguage";
import { useGameState } from "@/hooks/useGameState";
import { calculateStarRating } from "@/utils/starRating";
import { ParticleSystem } from "@/utils/particles";
import { findPossibleMatches, Hint } from "@/utils/hintSystem";
import { soundManager } from "@/utils/SoundManager";
import { findMatches } from "@/utils/matchDetection";
import { performanceMonitor } from "@/utils/performance";
import { logger } from "@/utils/logger";
import { storageManager } from "@/utils/storage";
import { GameProgress } from "@/types/storage";
import "./GameBoard.css";

interface GameBoardProps {
  stageNumber?: number;
  currentScreen?: GameScreen;
  onNavigate?: (screen: GameScreen) => void;
  onStartStage?: (stageNumber: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  stageNumber = 1,
  currentScreen = "stageSelect",
  onNavigate: _onNavigate,
  onStartStage,
}) => {
  const initializedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const gemRendererRef = useRef<GemRenderer | null>(null);
  const lastCellSizeRef = useRef<number | null>(null);
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const removingGemsRef = useRef<Map<string, { alpha: number; scale: number }>>(
    new Map()
  );
  const hintRef = useRef<Hint | null>(null);
  const gravityAnimatingRef = useRef(false);
  const processMatchesTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoardRef = useRef<string>("");
  const isProcessingRef = useRef(false);
  // 드래그 스와이프용 ref
  const dragStartCellRef = useRef<{ row: number; col: number } | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const dragTargetCellRef = useRef<{ row: number; col: number } | null>(null);
  const dragCurrentPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const ignoreClickRef = useRef(false);
  const prevIsGameOverRef = useRef(false);
  const prevIsClearedRef = useRef(false);
  const [showHint, setShowHint] = useState(false);
  const { t } = useLanguage();
  const [unlockedStages, setUnlockedStages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  // 키보드 접근성: 현재 선택된 젬 위치
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  // 게임 상태 관리
  const { gameState, selectGem, swapGems, processMatches, togglePause } =
    useGameState(stageNumber);

  // 스테이지 설정에 맞게 config 업데이트
  const [config, setConfig] = useState<CanvasConfig>(() => {
    const cellSize = 70; // 초기 셀 크기 (블록 크기 증가)
    const gridCols = DEFAULT_GRID_SIZE.cols;
    const gridRows = DEFAULT_GRID_SIZE.rows;

    return {
      aspectRatio: DEFAULT_CANVAS_CONFIG.aspectRatio || 16 / 9,
      cellSize,
      gridRows,
      gridCols,
      pixelRatio: window.devicePixelRatio || 1,
      logicalWidth: 0,
      logicalHeight: 0,
    };
  });

  // 게임 상태의 보드 크기에 맞게 config 업데이트
  useEffect(() => {
    if (currentScreen === "game" && gameState.board.length > 0) {
      const gridRows = gameState.board.length;
      const gridCols = gameState.board[0]?.length || 9;

      setConfig((prev) => ({
        ...prev,
        gridRows,
        gridCols,
      }));
    }
  }, [currentScreen, gameState.board, stageNumber]);

  useEffect(() => {
    // LocalStorage에서 해제된 스테이지 확인
    const progress = storageManager.get<GameProgress>(
      "chipPuzzleGame_progress",
      { fallback: null }
    );
    
    if (progress) {
      setUnlockedStages(Math.max(1, progress.highestStage || 1));
      logger.info("Game progress loaded", {
        highestStage: progress.highestStage || 1,
      });
    }
  }, []);

  const renderStageSelect = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      // 기준 크기 (1200px 기준으로 설계)
      const baseWidth = 1200;
      const scale = canvasWidth / baseWidth;

      // 배경
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 제목
      ctx.fillStyle = "#fff";
      const titleFontSize = Math.max(16, 32 * scale); // 최소 16px
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(t("stageSelect.title"), canvasWidth / 2, 50 * scale);

      // 스테이지 그리드 렌더링
      const stagesPerRow = 8;
      const baseStageSize = 60;
      const baseGap = 15;
      const stageSize = baseStageSize * scale;
      const gap = baseGap * scale;
      const startX =
        (canvasWidth - (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) /
        2;
      const startY = 100 * scale;
      const totalStages = 1000;
      const stagesPerPage = 50;
      const totalPages = Math.ceil(totalStages / stagesPerPage);
      const startStage = (currentPage - 1) * stagesPerPage + 1;
      const endStage = Math.min(startStage + stagesPerPage - 1, totalStages);

      for (let i = 0; i < stagesPerPage && startStage + i <= endStage; i++) {
        const stageNumber = startStage + i;
        const row = Math.floor(i / stagesPerRow);
        const col = i % stagesPerRow;
        const x = startX + col * (stageSize + gap);
        const y = startY + row * (stageSize + gap);

        const isUnlocked = stageNumber <= unlockedStages;

        // 스테이지 카드 배경
        if (isUnlocked) {
          // 해제된 스테이지 - 그라데이션
          const gradient = ctx.createLinearGradient(
            x,
            y,
            x + stageSize,
            y + stageSize
          );
          gradient.addColorStop(0, "#667eea");
          gradient.addColorStop(1, "#764ba2");
          ctx.fillStyle = gradient;
        } else {
          // 잠긴 스테이지
          ctx.fillStyle = "#1a1a1a";
        }
        ctx.fillRect(x, y, stageSize, stageSize);

        // 테두리
        ctx.strokeStyle = isUnlocked ? "#667eea" : "#444";
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(x, y, stageSize, stageSize);

        // 스테이지 번호
        ctx.fillStyle = "#fff";
        const numberFontSize = Math.max(12, 20 * scale); // 최소 12px
        ctx.font = `bold ${numberFontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          stageNumber.toString(),
          x + stageSize / 2,
          y + stageSize / 2
        );

        // 잠금 아이콘 (잠긴 스테이지)
        if (!isUnlocked) {
          ctx.fillStyle = "#ffa500";
          const lockFontSize = Math.max(16, 24 * scale); // 최소 16px
          ctx.font = `${lockFontSize}px Arial`;
          ctx.fillText("🔒", x + stageSize / 2, y + stageSize / 2 - 10 * scale);
        }
      }

      // 페이지네이션 정보 표시
      const pageInfoY = canvasHeight - 60 * scale;
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(12, 18 * scale)}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        `${t("stageSelect.page")} ${currentPage} / ${totalPages}`,
        canvasWidth / 2,
        pageInfoY
      );

      // 페이지네이션 버튼
      const buttonHeight = 30 * scale;
      const buttonWidth = 80 * scale;
      const buttonY = pageInfoY + 20 * scale;
      const buttonGap = 10 * scale;

      // 이전 페이지 버튼
      if (currentPage > 1) {
        const prevButtonX = canvasWidth / 2 - buttonWidth - buttonGap / 2;
        ctx.fillStyle = currentPage > 1 ? "#667eea" : "#444";
        ctx.fillRect(prevButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(prevButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, 14 * scale)}px Arial`;
        ctx.fillText(
          "«",
          prevButtonX + buttonWidth / 2,
          buttonY + buttonHeight / 2 + 4 * scale
        );
      }

      // 다음 페이지 버튼
      if (currentPage < totalPages) {
        const nextButtonX = canvasWidth / 2 + buttonGap / 2;
        ctx.fillStyle = currentPage < totalPages ? "#667eea" : "#444";
        ctx.fillRect(nextButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(nextButtonX, buttonY, buttonWidth, buttonHeight);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(10, 14 * scale)}px Arial`;
        ctx.fillText(
          "»",
          nextButtonX + buttonWidth / 2,
          buttonY + buttonHeight / 2 + 4 * scale
        );
      }
    },
    [unlockedStages, t, currentPage]
  );

  const renderGameBoard = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      // 기준 크기 (1200px 기준으로 설계)
      const baseWidth = 1200;
      const scale = canvasWidth / baseWidth;

      // 배경
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 그리드 배경 그리기
      const baseCellSize = config.cellSize || 70;
      const cellSize = baseCellSize * scale;
      const gridCols = config.gridCols || 9;
      const gridRows = config.gridRows || 9;

      const gridWidth = cellSize * gridCols;
      const gridHeight = cellSize * gridRows;
      const gridStartX = (canvasWidth - gridWidth) / 2;
      const gridStartY = (canvasHeight - gridHeight) / 2;

      // GemRenderer 초기화 (cellSize 변경시에만 재생성)
      if (!gemRendererRef.current || lastCellSizeRef.current !== cellSize) {
        gemRendererRef.current = new GemRenderer(ctx, cellSize);
        lastCellSizeRef.current = cellSize;
      }

      // ParticleSystem 초기화 (한 번만 생성, ctx는 동일 캔버스 컨텍스트 사용)
      if (!particleSystemRef.current) {
        particleSystemRef.current = new ParticleSystem(ctx);
      }

      // 그리드 배경 (프리미엄 스타일)
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(22, 22, 46, 0.8)";
      ctx.beginPath();
      ctx.roundRect(gridStartX, gridStartY, gridWidth, gridHeight, 8 * scale);
      ctx.fill();
      ctx.restore();

      // 그리드 선 그리기 (개선된 스타일)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = Math.max(0.5, 1 * scale);

      for (let i = 0; i <= gridRows; i++) {
        const y = gridStartY + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(gridStartX, y);
        ctx.lineTo(gridStartX + gridWidth, y);
        ctx.stroke();
      }

      for (let i = 0; i <= gridCols; i++) {
        const x = gridStartX + i * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, gridStartY);
        ctx.lineTo(x, gridStartY + gridHeight);
        ctx.stroke();
      }

      // 게임 정보 표시 (상단) - 프리미엄 스타일
      const infoFontSize = Math.max(10, 20 * scale);
      const infoMarginX = 24 * scale;
      const infoMarginY = 24 * scale;
      const infoLineHeight = infoFontSize + 8 * scale;
      const infoY = infoMarginY;
      const infoCardPadding = 16 * scale;
      const infoCardRadius = 16 * scale;

      // 정보 카드 배경 (글래스모피즘 효과)
      const infoCardWidth = 280 * scale;
      const infoCardHeight = infoLineHeight * 4 + infoCardPadding * 2;
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(15, 15, 30, 0.8)";
      ctx.beginPath();
      ctx.roundRect(
        infoMarginX - infoCardPadding,
        infoMarginY - infoCardPadding,
        infoCardWidth,
        infoCardHeight,
        infoCardRadius
      );
      ctx.fill();
      ctx.strokeStyle = "rgba(102, 126, 234, 0.3)";
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      ctx.restore();

      // 텍스트 스타일
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scale;

      // 점수 표시 (그라데이션 효과)
      ctx.font = `600 ${infoFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(
        `${t("game.score")}: ${gameState.score.toLocaleString()}`,
        infoMarginX,
        infoY
      );

      // 이동 횟수 표시
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.fillText(
        `${t("game.moves")}: ${gameState.moves}`,
        infoMarginX,
        infoY + infoLineHeight
      );

      // 목표 표시
      if (gameState.goals.length > 0) {
        const goal = gameState.goals[0];
        const progress = goal.current / goal.target;
        ctx.fillStyle = progress >= 1 ? "#4ecdc4" : "rgba(255, 255, 255, 0.9)";
        ctx.fillText(
          `${t(
            "game.goal"
          )}: ${goal.current.toLocaleString()}/${goal.target.toLocaleString()}`,
          infoMarginX,
          infoY + infoLineHeight * 2
        );
      }

      // 콤보 표시 (프리미엄 스타일)
      if (gameState.comboCount > 0) {
        ctx.shadowColor = "rgba(255, 217, 61, 0.6)";
        ctx.shadowBlur = 12 * scale;
        ctx.font = `700 ${Math.max(
          14,
          24 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = "#ffd93d";
        ctx.textAlign = "left";
        ctx.fillText(
          `${t("game.combo")} x${gameState.comboCount}!`,
          infoMarginX,
          infoY + infoLineHeight * 3
        );
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4 * scale;
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 힌트 버튼 및 일시정지 버튼 (우측 상단) - 모바일 비율 고려
      if (!gameState.isGameOver && !gameState.isAnimating) {
        const baseButtonWidth = 120;
        const baseButtonHeight = 40;
        const buttonMargin = 20 * scale;
        const buttonGap = 10 * scale;

        // 모바일에서도 비율에 맞게 조정 (최소값 제거하여 scale에 따라 정확히 조정)
        const hintButtonWidth = baseButtonWidth * scale;
        const hintButtonHeight = baseButtonHeight * scale;
        const pauseButtonWidth = baseButtonWidth * scale;
        const pauseButtonHeight = baseButtonHeight * scale;

        // 힌트 버튼 (프리미엄 스타일)
        const hintButtonX = canvasWidth - hintButtonWidth - buttonMargin;
        const hintButtonY = buttonMargin;
        const buttonRadius = 12 * scale;

        // 버튼 배경 (그라데이션)
        const hintGradient = ctx.createLinearGradient(
          hintButtonX,
          hintButtonY,
          hintButtonX,
          hintButtonY + hintButtonHeight
        );
        hintGradient.addColorStop(0, showHint ? "#4ecdc4" : "#667eea");
        hintGradient.addColorStop(1, showHint ? "#44a08d" : "#764ba2");

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          hintButtonX,
          hintButtonY,
          hintButtonWidth,
          hintButtonHeight,
          buttonRadius
        );
        ctx.fillStyle = hintGradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        // 그림자 효과
        ctx.shadowColor = showHint
          ? "rgba(78, 205, 196, 0.4)"
          : "rgba(102, 126, 234, 0.4)";
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;

        ctx.fillStyle = "#ffffff";
        const hintFontSize = 16 * scale;
        ctx.font = `600 ${hintFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.hint"),
          hintButtonX + hintButtonWidth / 2,
          hintButtonY + hintButtonHeight / 2
        );

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 일시정지 버튼 (프리미엄 스타일)
        const pauseButtonX = hintButtonX - pauseButtonWidth - buttonGap;
        const pauseButtonY = buttonMargin;

        // 버튼 배경 (그라데이션)
        const pauseGradient = ctx.createLinearGradient(
          pauseButtonX,
          pauseButtonY,
          pauseButtonX,
          pauseButtonY + pauseButtonHeight
        );
        if (gameState.isPaused) {
          pauseGradient.addColorStop(0, "#ff6b6b");
          pauseGradient.addColorStop(1, "#ee5a6f");
        } else {
          pauseGradient.addColorStop(0, "#667eea");
          pauseGradient.addColorStop(1, "#764ba2");
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          pauseButtonX,
          pauseButtonY,
          pauseButtonWidth,
          pauseButtonHeight,
          buttonRadius
        );
        ctx.fillStyle = pauseGradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        // 그림자 효과
        ctx.shadowColor = gameState.isPaused
          ? "rgba(255, 107, 107, 0.4)"
          : "rgba(102, 126, 234, 0.4)";
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;

        ctx.fillStyle = "#ffffff";
        const pauseFontSize = 16 * scale;
        ctx.font = `600 ${pauseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          gameState.isPaused ? t("game.resume") : t("game.pause"),
          pauseButtonX + pauseButtonWidth / 2,
          pauseButtonY + pauseButtonHeight / 2
        );

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // 일시정지 오버레이 (프리미엄 스타일)
      if (gameState.isPaused && !gameState.isGameOver) {
        // 반투명 배경
        ctx.fillStyle = "rgba(15, 15, 30, 0.85)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 400 * scale;
        const cardHeight = 200 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 24 * scale;

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "rgba(26, 26, 46, 0.9)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = "rgba(102, 126, 234, 0.3)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 제목 텍스트 (그라데이션 효과)
        ctx.shadowColor = "rgba(102, 126, 234, 0.5)";
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = "#ffffff";
        ctx.font = `700 ${Math.max(
          28,
          56 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.pause"),
          canvasWidth / 2,
          cardY + cardHeight / 2 - 30 * scale
        );

        // 안내 텍스트
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = `500 ${Math.max(
          14,
          20 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillText(
          t("game.resume"),
          canvasWidth / 2,
          cardY + cardHeight / 2 + 20 * scale
        );
      }

      // 게임 오버 메시지 (프리미엄 스타일)
      if (gameState.isGameOver) {
        // 반투명 배경
        ctx.fillStyle = "rgba(15, 15, 30, 0.9)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 450 * scale;
        const cardHeight = 300 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 24 * scale;

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = "rgba(26, 26, 46, 0.9)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 107, 107, 0.3)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 제목 텍스트
        ctx.shadowColor = "rgba(255, 107, 107, 0.5)";
        ctx.shadowBlur = 12 * scale;
        ctx.fillStyle = "#ff6b6b";
        ctx.font = `700 ${Math.max(
          28,
          56 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(t("game.gameOver"), canvasWidth / 2, cardY + 60 * scale);

        // 점수 표시
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = `600 ${Math.max(
          16,
          24 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillText(
          `${t("game.finalScore")}: ${gameState.score.toLocaleString()}`,
          canvasWidth / 2,
          cardY + 120 * scale
        );

        // 재시작 버튼 (프리미엄 스타일)
        const buttonX = canvasWidth / 2 - 110 * scale;
        const buttonY = cardY + 180 * scale;
        const buttonWidth = 220 * scale;
        const buttonHeight = 56 * scale;
        const buttonRadius = 14 * scale;

        const gradient = ctx.createLinearGradient(
          buttonX,
          buttonY,
          buttonX,
          buttonY + buttonHeight
        );
        gradient.addColorStop(0, "#ff6b6b");
        gradient.addColorStop(1, "#ee5a6f");

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          buttonX,
          buttonY,
          buttonWidth,
          buttonHeight,
          buttonRadius
        );
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        ctx.shadowColor = "rgba(255, 107, 107, 0.4)";
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillStyle = "#ffffff";
        ctx.font = `600 ${Math.max(
          16,
          22 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.retry"),
          canvasWidth / 2,
          buttonY + buttonHeight / 2
        );
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // 클리어 상태 확인
      const isCleared = gameState.goals.every(
        (goal) => goal.current >= goal.target
      );

      // 키보드로 선택된 셀 하이라이트 (젬 렌더링 전에 그리기)
      if (selectedCell && !gameState.isPaused && !gameState.isGameOver) {
        const gemX = gridStartX + selectedCell.col * cellSize;
        const gemY = gridStartY + selectedCell.row * cellSize;

        // 펄싱 효과를 위한 애니메이션
        const pulseTime = Date.now() % 1000;
        const pulseAlpha =
          0.4 + Math.sin((pulseTime / 1000) * Math.PI * 2) * 0.3;

        ctx.save();
        ctx.strokeStyle = "#667eea";
        ctx.lineWidth = Math.max(3, 4 * scale);
        ctx.setLineDash([5 * scale, 5 * scale]);
        ctx.strokeRect(gemX, gemY, cellSize, cellSize);
        ctx.fillStyle = `rgba(102, 126, 234, ${pulseAlpha * 0.3})`;
        ctx.fillRect(gemX, gemY, cellSize, cellSize);
        ctx.restore();
      }

      // 매칭된 젬 하이라이트 (젬 렌더링 전에 그리기)
      if (gameState.isAnimating) {
        const matches = findMatches(gameState.board);
        const matchedPositions = new Set<string>();

        for (const match of matches) {
          for (const pos of match.positions) {
            matchedPositions.add(`${pos.row},${pos.col}`);
          }
        }

        // 매칭된 젬 하이라이트
        matchedPositions.forEach((key) => {
          const [rowStr, colStr] = key.split(",");
          const row = Number(rowStr);
          const col = Number(colStr);

          if (
            !Number.isNaN(row) &&
            !Number.isNaN(col) &&
            row >= 0 &&
            row < gridRows &&
            col >= 0 &&
            col < gridCols
          ) {
            const gemX = gridStartX + col * cellSize;
            const gemY = gridStartY + row * cellSize;

            // 펄싱 효과를 위한 애니메이션
            const pulseTime = Date.now() % 1000;
            const pulseAlpha =
              0.3 + Math.sin((pulseTime / 1000) * Math.PI * 2) * 0.2;

            ctx.fillStyle = `rgba(255, 215, 61, ${pulseAlpha})`;
            ctx.strokeStyle = "#ffd93d";
            ctx.lineWidth = Math.max(2, 3 * scale);
            ctx.strokeRect(gemX, gemY, cellSize, cellSize);
            ctx.fillRect(gemX, gemY, cellSize, cellSize);
          }
        });
      }

      // 젬 렌더링 (클리어 시에는 어둡게)
      if (
        gameState.board &&
        gameState.board.length > 0 &&
        gemRendererRef.current
      ) {
        // 중력 애니메이션 상태 초기화 (매 프레임마다 확인)
        let hasGravityAnimation = false;

        gameState.board.forEach((row, rowIndex) => {
          if (!row) return;
          row.forEach((gem, colIndex) => {
            if (gem) {
              // Canvas 좌표 계산
              const gemX = gridStartX + colIndex * cellSize;
              const gemY = gridStartY + rowIndex * cellSize;

              // 드래그 중인 젬의 시각적 위치 조정
              if (
                isDraggingRef.current &&
                dragStartCellRef.current &&
                dragTargetCellRef.current &&
                dragStartPosRef.current
              ) {
                const startCell = dragStartCellRef.current;
                const targetCell = dragTargetCellRef.current;
                const startPos = dragStartPosRef.current;

                if (rowIndex === startCell.row && colIndex === startCell.col) {
                  // 드래그 시작한 젬: 마우스 위치를 직접 따라 이동
                  if (dragCurrentPosRef.current) {
                    // 드래그 시작 위치에서의 오프셋 계산
                    const offsetX = dragCurrentPosRef.current.x - startPos.x;
                    const offsetY = dragCurrentPosRef.current.y - startPos.y;

                    // 셀 범위를 넘지 않도록 제한 (최대 한 셀 크기)
                    const maxOffset = cellSize;
                    const clampedOffsetX = Math.max(
                      -maxOffset,
                      Math.min(maxOffset, offsetX)
                    );
                    const clampedOffsetY = Math.max(
                      -maxOffset,
                      Math.min(maxOffset, offsetY)
                    );

                    gem.x = gemX + clampedOffsetX;
                    gem.y = gemY + clampedOffsetY;
                  } else {
                    gem.x = gemX;
                    gem.y = gemY;
                  }
                } else if (
                  rowIndex === targetCell.row &&
                  colIndex === targetCell.col
                ) {
                  // 드래그 대상 젬: 반대 방향으로 이동
                  if (dragCurrentPosRef.current) {
                    // 드래그 시작 젬의 이동량 계산
                    const offsetX = dragCurrentPosRef.current.x - startPos.x;
                    const offsetY = dragCurrentPosRef.current.y - startPos.y;

                    // 반대 방향으로 같은 거리만큼 이동
                    const maxOffset = cellSize;
                    const clampedOffsetX = Math.max(
                      -maxOffset,
                      Math.min(maxOffset, -offsetX)
                    );
                    const clampedOffsetY = Math.max(
                      -maxOffset,
                      Math.min(maxOffset, -offsetY)
                    );

                    gem.x = gemX + clampedOffsetX;
                    gem.y = gemY + clampedOffsetY;
                  } else {
                    gem.x = gemX;
                    gem.y = gemY;
                  }
                } else {
                  // 다른 젬은 정상 위치
                  gem.x = gemX;
                  gem.y = gemY;
                }
              } else {
                // 드래그가 아닐 때는 기존 애니메이션 로직 사용
                // targetY가 설정되어 있으면 중력 애니메이션 중
                if (gem.targetY !== undefined) {
                  hasGravityAnimation = true; // 중력 애니메이션 진행 중

                  // targetY가 row 값인 경우 실제 Y 좌표로 변환
                  let targetYCoord: number;
                  if (gem.targetY < 100) {
                    // row 값으로 간주 (0-9 범위)
                    targetYCoord = gridStartY + gem.targetY * cellSize;
                  } else {
                    // 이미 픽셀 좌표
                    targetYCoord = gem.targetY;
                  }

                  // 초기 위치 설정 (아직 설정되지 않은 경우)
                  if (gem.y === undefined || gem.y === 0) {
                    gem.y = gemY;
                  }

                  // 목표 위치로 부드럽게 이동 (중력 효과)
                  const dy = targetYCoord - gem.y;
                  const speed = 0.15; // 이동 속도

                  if (Math.abs(dy) > 1) {
                    gem.y += dy * speed;
                    // 가속도 효과 추가 (떨어질수록 빨라짐)
                    if (dy > 0) {
                      gem.y += 1.0; // 아래로 떨어질 때 가속
                    }
                  } else {
                    gem.y = targetYCoord;
                    gem.targetY = undefined;
                  }

                  // X 좌표는 항상 정렬
                  gem.x = gemX;
                } else if (gem.targetX !== undefined) {
                  // targetX가 설정된 경우 (다른 애니메이션)
                  const dx = gem.targetX - gem.x;
                  const speed = 0.2;

                  if (Math.abs(dx) > 0.1) {
                    gem.x += dx * speed;
                  } else {
                    gem.x = gem.targetX;
                    gem.targetX = undefined;
                  }
                  gem.y = gemY;
                } else {
                  // 애니메이션 없이 즉시 위치 설정
                  // 초기 위치가 0이거나 설정되지 않은 경우 즉시 설정
                  if (
                    gem.x === 0 &&
                    gem.y === 0 &&
                    gem.targetX === undefined &&
                    gem.targetY === undefined
                  ) {
                    gem.x = gemX;
                    gem.y = gemY;
                  } else if (gem.x !== gemX || gem.y !== gemY) {
                    // 위치가 다르면 즉시 업데이트 (초기 로딩 시)
                    gem.x = gemX;
                    gem.y = gemY;
                  }
                }
              }

              // 선택된 젬 하이라이트
              if (
                gameState.selectedGem &&
                gameState.selectedGem.row === rowIndex &&
                gameState.selectedGem.col === colIndex
              ) {
                ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
                ctx.lineWidth = Math.max(2, 3 * scale);
                ctx.strokeRect(gemX, gemY, cellSize, cellSize);
                ctx.fillRect(gemX, gemY, cellSize, cellSize);
              }

              // 힌트 표시
              if (
                showHint &&
                hintRef.current &&
                ((hintRef.current.from.row === rowIndex &&
                  hintRef.current.from.col === colIndex) ||
                  (hintRef.current.to.row === rowIndex &&
                    hintRef.current.to.col === colIndex))
              ) {
                ctx.fillStyle = "rgba(255, 215, 61, 0.4)";
                ctx.strokeStyle = "#ffd93d";
                ctx.lineWidth = Math.max(3, 4 * scale);
                ctx.strokeRect(gemX, gemY, cellSize, cellSize);
                ctx.fillRect(gemX, gemY, cellSize, cellSize);
              }

              // 제거 애니메이션 처리
              let alpha = 1;
              let gemScale = gem.scale || 1;

              if (gem.isRemoving) {
                let removeState = removingGemsRef.current.get(gem.id);
                if (!removeState) {
                  removeState = { alpha: 1, scale: 1 };
                  removingGemsRef.current.set(gem.id, removeState);
                }

                // 페이드아웃 및 스케일 다운 (렌더링 루프에서 직접 업데이트)
                removeState.alpha = Math.max(0, removeState.alpha - 0.08);
                removeState.scale = Math.max(0, removeState.scale - 0.08);

                alpha = removeState.alpha;
                gemScale = removeState.scale;
                gem.alpha = alpha;
                gem.scale = gemScale;

                removingGemsRef.current.set(gem.id, removeState);
              } else {
                gem.alpha = 1;
                gem.scale = 1;
              }

              // 젬 렌더링 (alpha가 0보다 크면 렌더링)
              // 클리어 시에는 젬을 어둡게 렌더링
              if (alpha > 0) {
                const renderAlpha =
                  isCleared && !gameState.isAnimating
                    ? alpha * 0.3 // 클리어 시 30% 투명도로 어둡게
                    : alpha;
                gemRendererRef.current!.render(gem, renderAlpha);
              }

              // 제거 중인 젬에서 파티클 생성 (한 번만)
              if (
                gem.isRemoving &&
                alpha > 0.8 &&
                alpha < 0.9 &&
                particleSystemRef.current
              ) {
                const centerX = gem.x + cellSize / 2;
                const centerY = gem.y + cellSize / 2;
                particleSystemRef.current.emit(centerX, centerY, gem.color, 15);
              }
            }
          });
        });

        // 모든 젬 확인 후 중력 애니메이션 상태 업데이트
        const wasAnimating = gravityAnimatingRef.current;
        gravityAnimatingRef.current = hasGravityAnimation;

        // 중력 애니메이션이 완료되었을 때 (true -> false로 변경)
        // 매칭 체크를 트리거하기 위해 processMatches 호출
        if (wasAnimating && !hasGravityAnimation) {
          // 중력 애니메이션 완료 후 매칭 체크를 트리거하기 위해
          // 게임이 진행 중일 때만 체크
          if (
            gameState.isAnimating &&
            currentScreen === "game" &&
            !gameState.isGameOver &&
            !isProcessingRef.current
          ) {
            // 중력 애니메이션이 완전히 완료된 후 매칭 체크
            // 약간의 지연을 두어 중력 애니메이션이 완전히 완료된 후 체크
            setTimeout(() => {
              // 중력 애니메이션 완료 후 processMatches 호출
              // 이 시점에서 보드가 업데이트되어 있고, 새로운 매칭이 있는지 확인
              if (
                gameState.isAnimating &&
                currentScreen === "game" &&
                !gameState.isGameOver &&
                !isProcessingRef.current
              ) {
                isProcessingRef.current = true;
                processMatches();

                // processMatches가 완료되고 상태 업데이트가 반영될 때까지 대기
                setTimeout(() => {
                  isProcessingRef.current = false;
                  // processMatches가 보드를 업데이트했으므로,
                  // 새로운 매칭이 있으면 (isAnimating이 여전히 true) 콤보 처리를 위해
                  // lastBoardRef를 리셋하여 다음 중력 애니메이션 완료 시 다시 체크
                  lastBoardRef.current = "";
                }, 200);
              }
            }, 100);
          }
        }
      }

      // 파티클 렌더링
      if (particleSystemRef.current) {
        particleSystemRef.current.update(16); // 약 60fps 기준
        particleSystemRef.current.render();
      }

      // 클리어 화면 오버레이 (프리미엄 스타일)
      if (isCleared && !gameState.isAnimating && !gameState.isGameOver) {
        const stars = calculateStarRating(gameState);

        // 반투명 배경
        ctx.fillStyle = "rgba(15, 15, 30, 0.92)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 500 * scale;
        const cardHeight = 400 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 28 * scale;

        ctx.save();
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = "rgba(26, 26, 46, 0.9)";
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = "rgba(78, 205, 196, 0.4)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 클리어 메시지 (그라데이션 효과)
        ctx.shadowColor = "rgba(78, 205, 196, 0.5)";
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = "#4ecdc4";
        ctx.font = `700 ${Math.max(
          32,
          64 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.stageCleared"),
          canvasWidth / 2,
          cardY + 80 * scale
        );

        // 별점 표시 (프리미엄 스타일)
        const starSize = Math.max(24, 48 * scale);
        const starSpacing = starSize * 1.8;
        const starStartX = canvasWidth / 2 - starSpacing;
        const starY = cardY + 160 * scale;

        for (let i = 0; i < 3; i++) {
          const starX = starStartX + i * starSpacing;
          ctx.shadowColor =
            i < stars ? "rgba(255, 217, 61, 0.6)" : "transparent";
          ctx.shadowBlur = i < stars ? 12 * scale : 0;
          ctx.fillStyle = i < stars ? "#ffd93d" : "rgba(102, 102, 102, 0.5)";
          ctx.font = `${starSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", starX, starY);
        }

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 점수 표시
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.font = `600 ${Math.max(
          18,
          28 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillText(
          `${t("game.score")}: ${gameState.score.toLocaleString()}`,
          canvasWidth / 2,
          cardY + 220 * scale
        );

        // 다음 스테이지 버튼 (프리미엄 스타일)
        const buttonX = canvasWidth / 2 - 120 * scale;
        const buttonY = cardY + 280 * scale;
        const buttonWidth = 240 * scale;
        const buttonHeight = 60 * scale;
        const buttonRadius = 16 * scale;

        const gradient = ctx.createLinearGradient(
          buttonX,
          buttonY,
          buttonX,
          buttonY + buttonHeight
        );
        gradient.addColorStop(0, "#667eea");
        gradient.addColorStop(1, "#764ba2");

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          buttonX,
          buttonY,
          buttonWidth,
          buttonHeight,
          buttonRadius
        );
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        ctx.shadowColor = "rgba(102, 126, 234, 0.4)";
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillStyle = "#ffffff";
        ctx.font = `600 ${Math.max(
          16,
          22 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.nextStage"),
          canvasWidth / 2,
          buttonY + buttonHeight / 2
        );
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }
    },
    [config, gameState, showHint, t]
  );

  // render 함수를 먼저 정의
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    // Canvas의 실제 논리적 크기 계산
    // Canvas는 이미 dpr로 스케일링되어 있으므로, CSS 크기 또는 width/height를 dpr로 나눈 값 사용
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = canvas.width / dpr;
    const canvasHeight = canvas.height / dpr;

    // Canvas가 아직 초기화되지 않았으면 스킵
    if (canvasWidth === 0 || canvasHeight === 0) return;

    if (currentScreen === "stageSelect") {
      renderStageSelect(ctx, canvasWidth, canvasHeight);
    } else if (currentScreen === "game") {
      renderGameBoard(ctx, canvasWidth, canvasHeight);
    } else {
      // 기본 배경
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }, [currentScreen, renderStageSelect, renderGameBoard]);

  // 애니메이션 루프 시작 (성능 최적화: 필요할 때만 렌더링)
  useEffect(() => {
    let lastRenderTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // 성능 모니터링 구독
    const unsubscribe = performanceMonitor.subscribe((metrics) => {
      // 개발 환경에서만 성능 메트릭 로깅
      if (process.env.NODE_ENV === "development") {
        if (metrics.fps < 30) {
          logger.warn("Low FPS detected", {
            fps: metrics.fps,
            frameTime: metrics.frameTime,
            memoryUsage: metrics.memoryUsage,
          });
        }
      }
    });

    const startRenderLoop = () => {
      const animate = (currentTime: number) => {
        // FPS 제한으로 성능 최적화
        if (currentTime - lastRenderTime >= frameInterval) {
          render();
          // 성능 모니터링 업데이트
          performanceMonitor.update();
          lastRenderTime = currentTime;
        }
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (canvasRef.current && ctxRef.current) {
      startRenderLoop();
      logger.info("GameBoard render loop started", {
        stage: stageNumber,
        screen: currentScreen,
      });
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      unsubscribe();
      logger.debug("GameBoard render loop stopped");
    };
  }, [render, stageNumber, currentScreen]);

  // useCallback으로 메모이제이션하여 무한 루프 방지
  const handleCanvasReady = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      canvasRef.current = canvas;
      ctxRef.current = ctx;

      // 초기 렌더링
      render();
    },
    [render]
  );

  const handleCanvasResize = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      canvasRef.current = canvas;
      ctxRef.current = ctx;
      render();
    },
    [render]
  );

  useEffect(() => {
    // currentScreen이 변경되면 강제로 렌더링
    if (canvasRef.current && ctxRef.current) {
      // 약간의 지연을 두어 상태 업데이트가 완료된 후 렌더링
      const timeoutId = setTimeout(() => {
        render();
      }, 10);
      return () => clearTimeout(timeoutId);
    }
  }, [render, currentScreen, unlockedStages, stageNumber, gameState]);

  // 제거 애니메이션은 렌더링 루프에서 직접 처리됨

  // 매칭 처리 (애니메이션 후)
  useEffect(() => {
    if (
      gameState.isAnimating &&
      currentScreen === "game" &&
      !gameState.isGameOver &&
      !isProcessingRef.current
    ) {
      // 보드가 변경되었는지 확인 (새로운 매칭 감지)
      const boardKey = JSON.stringify(gameState.board);
      const isBoardChanged = boardKey !== lastBoardRef.current;

      if (isBoardChanged) {
        isProcessingRef.current = true;
        // processMatches 호출 전 현재 보드 상태 저장
        lastBoardRef.current = boardKey;

        // 기존 타임아웃 취소
        if (processMatchesTimeoutRef.current) {
          clearTimeout(processMatchesTimeoutRef.current);
        }

        // 제거 애니메이션 시간 대기 (300ms)
        processMatchesTimeoutRef.current = setTimeout(() => {
          // 중력 애니메이션이 완료될 때까지 대기
          const checkGravity = () => {
            if (!gravityAnimatingRef.current) {
              // 중력 애니메이션이 완료되었으므로 processMatches 호출
              processMatches();

              // processMatches가 완료되고 상태 업데이트가 반영될 때까지 대기
              setTimeout(() => {
                isProcessingRef.current = false;
                // processMatches가 보드를 업데이트했으므로,
                // 새로운 매칭이 있으면 (isAnimating이 여전히 true) 콤보 처리를 위해
                // lastBoardRef를 리셋하여 다음 중력 애니메이션 완료 시 다시 체크
                lastBoardRef.current = "";
              }, 200);
            } else {
              // 중력 애니메이션이 진행 중이면 다시 확인
              setTimeout(checkGravity, 50);
            }
          };
          checkGravity();
        }, 300); // 제거 애니메이션 시간

        return () => {
          if (processMatchesTimeoutRef.current) {
            clearTimeout(processMatchesTimeoutRef.current);
            processMatchesTimeoutRef.current = null;
          }
        };
      }
    } else if (!gameState.isAnimating) {
      // 애니메이션이 끝나면 보드 추적 및 처리 상태 리셋
      lastBoardRef.current = "";
      isProcessingRef.current = false;
    }
  }, [
    gameState.isAnimating,
    gameState.board,
    processMatches,
    currentScreen,
    gameState.isGameOver,
  ]);

  // 게임 오버/클리어 처리
  useEffect(() => {
    if (currentScreen !== "game") {
      prevIsGameOverRef.current = false;
      prevIsClearedRef.current = false;
      return;
    }

    const isCleared = gameState.goals.every(
      (goal) => goal.current >= goal.target
    );

    // 게임 오버 전환 감지
    if (!prevIsGameOverRef.current && gameState.isGameOver) {
      logger.info("Game Over", {
        stage: gameState.currentStage,
        score: gameState.score,
        moves: gameState.moves,
      });
      soundManager.playGameOver();
    }

    // 스테이지 클리어 전환 감지 (게임오버가 아닌 상태에서만)
    if (!prevIsClearedRef.current && isCleared && !gameState.isGameOver) {
      const stars = calculateStarRating(gameState);
      logger.info("Stage Cleared", {
        stage: gameState.currentStage,
        score: gameState.score,
        moves: gameState.moves,
        stars,
      });
      soundManager.playStageClear();

      // 스테이지 클리어 정보 저장
      const saved = storageManager.get<GameProgress>(
        "chipPuzzleGame_progress",
        { fallback: null }
      );
      
      const progress: GameProgress = saved || {
        highestStage: 1,
        stageRecords: {},
      };

        // 최고 스테이지 업데이트
        const currentStage = gameState.currentStage;
        if (currentStage >= progress.highestStage) {
          progress.highestStage = currentStage + 1;
        }

        // 스테이지 기록 업데이트
        if (!progress.stageRecords) {
          progress.stageRecords = {};
        }

        const stageKey = currentStage.toString();
        const existingRecord = progress.stageRecords[stageKey];

        if (!existingRecord || gameState.score > existingRecord.bestScore) {
          progress.stageRecords[stageKey] = {
            stageNumber: currentStage,
            stars: Math.max(existingRecord?.stars || 0, stars),
            score: gameState.score,
            bestScore: gameState.score,
            completedAt: new Date().toISOString(),
            attempts: (existingRecord?.attempts || 0) + 1,
          };
        } else {
          // 점수는 낮지만 별점이 더 높을 수 있음
          progress.stageRecords[stageKey] = {
            ...existingRecord,
            stars: Math.max(existingRecord.stars, stars),
            attempts: existingRecord.attempts + 1,
          };
        }

        const saveResult = storageManager.set("chipPuzzleGame_progress", progress);
        if (!saveResult) {
          logger.error("Failed to save progress", {
            stage: gameState.currentStage,
          });
        }
    }

    prevIsGameOverRef.current = gameState.isGameOver;
    prevIsClearedRef.current = isCleared;
  }, [
    gameState.isGameOver,
    gameState.goals,
    gameState.score,
    gameState.currentStage,
    currentScreen,
  ]);

  // Canvas 클릭 이벤트 처리
  const handleCanvasClick = useCallback(
    (event: MouseEvent) => {
      // 스와이프에서 이미 처리한 클릭은 무시
      if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;

      if (currentScreen === "stageSelect") {
        // 스테이지 선택 화면
        if (!onStartStage) return;

        // 기준 크기 (1200px 기준으로 설계)
        const baseWidth = 1200;
        const scale = canvasWidth / baseWidth;

        // 힌트 버튼 클릭 확인 (렌더링과 동일한 크기/위치 계산)
        const baseButtonWidth = 120;
        const baseButtonHeight = 40;
        const buttonMargin = 20 * scale;

        const hintButtonWidth = baseButtonWidth * scale;
        const hintButtonHeight = baseButtonHeight * scale;
        const hintButtonX = canvasWidth - hintButtonWidth - buttonMargin;
        const hintButtonY = buttonMargin;

        if (
          x >= hintButtonX &&
          x <= hintButtonX + hintButtonWidth &&
          y >= hintButtonY &&
          y <= hintButtonY + hintButtonHeight
        ) {
          // 힌트 토글
          if (showHint) {
            setShowHint(false);
            hintRef.current = null;
          } else {
            const hint = findPossibleMatches(gameState.board);
            if (hint) {
              hintRef.current = hint;
              setShowHint(true);
              // 3초 후 자동으로 힌트 숨기기
              setTimeout(() => {
                setShowHint(false);
                hintRef.current = null;
              }, 3000);
            }
          }
          return;
        }

        // 페이지네이션 버튼 클릭 확인
        const stagesPerPage = 50;
        const totalStages = 1000;
        const totalPages = Math.ceil(totalStages / stagesPerPage);
        const buttonHeight = 30 * scale;
        const buttonWidth = 80 * scale;
        const pageInfoY = canvasHeight - 60 * scale;
        const buttonY = pageInfoY + 20 * scale;
        const buttonGap = 10 * scale;

        // 이전 페이지 버튼
        if (currentPage > 1) {
          const prevButtonX = canvasWidth / 2 - buttonWidth - buttonGap / 2;
          if (
            x >= prevButtonX &&
            x <= prevButtonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
          ) {
            setCurrentPage(currentPage - 1);
            soundManager.playClick();
            return;
          }
        }

        // 다음 페이지 버튼
        if (currentPage < totalPages) {
          const nextButtonX = canvasWidth / 2 + buttonGap / 2;
          if (
            x >= nextButtonX &&
            x <= nextButtonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
          ) {
            setCurrentPage(currentPage + 1);
            soundManager.playClick();
            return;
          }
        }

        // 스테이지 그리드 클릭 감지
        const stagesPerRow = 8;
        const baseStageSize = 60;
        const baseGap = 15;
        const stageSize = baseStageSize * scale;
        const gap = baseGap * scale;
        const startX =
          (canvasWidth -
            (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) /
          2;
        const startY = 100 * scale;

        const col = Math.floor((x - startX) / (stageSize + gap));
        const row = Math.floor((y - startY) / (stageSize + gap));

        if (col >= 0 && col < stagesPerRow && row >= 0) {
          const startStage = (currentPage - 1) * stagesPerPage + 1;
          const stageNumber = startStage + row * stagesPerRow + col;
          if (stageNumber <= unlockedStages && stageNumber <= totalStages) {
            onStartStage(stageNumber);
          }
        }
      } else if (currentScreen === "game") {
        // 게임 화면

        // 기준 크기 (1200px 기준으로 설계)
        const baseWidth = 1200;
        const scale = canvasWidth / baseWidth;

        // 클리어 상태 확인
        const isCleared = gameState.goals.every(
          (goal) => goal.current >= goal.target
        );

        // 클리어 화면의 다음 스테이지 버튼 클릭 확인
        if (isCleared && !gameState.isAnimating && !gameState.isGameOver) {
          const buttonX = canvasWidth / 2 - 100 * scale;
          const buttonY = canvasHeight / 2 + 80 * scale;
          const buttonWidth = 200 * scale;
          const buttonHeight = 50 * scale;

          if (
            x >= buttonX &&
            x <= buttonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
          ) {
            // 다음 스테이지로 이동
            if (onStartStage) {
              const nextStage = stageNumber + 1;
              onStartStage(nextStage);
            }
            soundManager.playClick();
            return;
          }
          return; // 클리어 화면에서는 다른 클릭 무시
        }

        // 게임 오버 화면의 재시작 버튼 클릭 확인
        if (gameState.isGameOver) {
          const buttonX = canvasWidth / 2 - 100 * scale;
          const buttonY = canvasHeight / 2 + 100 * scale;
          const buttonWidth = 200 * scale;
          const buttonHeight = 50 * scale;

          if (
            x >= buttonX &&
            x <= buttonX + buttonWidth &&
            y >= buttonY &&
            y <= buttonY + buttonHeight
          ) {
            // 재시작
            if (onStartStage) {
              onStartStage(stageNumber);
            }
            soundManager.playClick();
            return;
          }
          return;
        }

        // 일시정지 상태에서는 클릭 무시
        if (gameState.isPaused) {
          // 일시정지 오버레이 클릭 시 재개
          togglePause();
          soundManager.playClick();
          return;
        }

        // 힌트 버튼 및 일시정지 버튼 클릭 확인 (렌더링과 동일한 크기/위치 계산)
        const baseButtonWidth = 120;
        const baseButtonHeight = 40;
        const buttonMargin = 20 * scale;
        const buttonGap = 10 * scale;

        const hintButtonWidth = baseButtonWidth * scale;
        const hintButtonHeight = baseButtonHeight * scale;
        const pauseButtonWidth = baseButtonWidth * scale;
        const pauseButtonHeight = baseButtonHeight * scale;

        const hintButtonX = canvasWidth - hintButtonWidth - buttonMargin;
        const hintButtonY = buttonMargin;
        const pauseButtonX = hintButtonX - pauseButtonWidth - buttonGap;
        const pauseButtonY = buttonMargin;

        // 일시정지 버튼 클릭
        if (
          x >= pauseButtonX &&
          x <= pauseButtonX + pauseButtonWidth &&
          y >= pauseButtonY &&
          y <= pauseButtonY + pauseButtonHeight
        ) {
          togglePause();
          soundManager.playClick();
          return;
        }

        // 힌트 버튼 클릭
        if (
          x >= hintButtonX &&
          x <= hintButtonX + hintButtonWidth &&
          y >= hintButtonY &&
          y <= hintButtonY + hintButtonHeight
        ) {
          // 힌트 토글
          if (showHint) {
            setShowHint(false);
            hintRef.current = null;
          } else {
            const hint = findPossibleMatches(gameState.board);
            if (hint) {
              hintRef.current = hint;
              setShowHint(true);
              // 3초 후 자동으로 힌트 숨기기
              setTimeout(() => {
                setShowHint(false);
                hintRef.current = null;
              }, 3000);
            }
          }
          soundManager.playClick();
          return;
        }

        // 일시정지 상태에서는 젬 클릭 무시
        if (gameState.isPaused) {
          return;
        }

        // 젬 클릭 처리
        const baseCellSize = config.cellSize || 70;
        const cellSize = baseCellSize * scale;
        const gridCols = config.gridCols || 9;
        const gridRows = config.gridRows || 9;

        const gridWidth = cellSize * gridCols;
        const gridHeight = cellSize * gridRows;
        const gridStartX = (canvasWidth - gridWidth) / 2;
        const gridStartY = (canvasHeight - gridHeight) / 2;

        // 클릭한 그리드 셀 계산
        const col = Math.floor((x - gridStartX) / cellSize);
        const row = Math.floor((y - gridStartY) / cellSize);

        if (
          col >= 0 &&
          col < gridCols &&
          row >= 0 &&
          row < gridRows &&
          gameState.board[row] &&
          gameState.board[row][col]
        ) {
          if (gameState.selectedGem) {
            // 이미 선택된 젬이 있으면 교환 시도
            swapGems(gameState.selectedGem, { row, col });
          } else {
            // 젬 선택
            selectGem(row, col);
          }
          soundManager.playClick();
        }
      }
    },
    [
      currentScreen,
      onStartStage,
      unlockedStages,
      config,
      gameState,
      selectGem,
      swapGems,
      showHint,
      togglePause,
    ]
  );


  // 포인터(마우스/터치) 기반 드래그 스와이프 처리
  const handlePointerDown = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (currentScreen !== "game") return;
      if (gameState.isPaused) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / dpr;
      const canvasHeight = canvas.height / dpr;

      // 기준 크기 (1200px 기준으로 설계)
      const baseWidth = 1200;
      const scale = canvasWidth / baseWidth;

      const baseCellSize = config.cellSize || 50;
      const cellSize = baseCellSize * scale;
      const gridCols = config.gridCols || 9;
      const gridRows = config.gridRows || 9;

      const gridWidth = cellSize * gridCols;
      const gridHeight = cellSize * gridRows;
      const gridStartX = (canvasWidth - gridWidth) / 2;
      const gridStartY = (canvasHeight - gridHeight) / 2;

      const col = Math.floor((x - gridStartX) / cellSize);
      const row = Math.floor((y - gridStartY) / cellSize);

      if (
        col >= 0 &&
        col < gridCols &&
        row >= 0 &&
        row < gridRows &&
        gameState.board[row] &&
        gameState.board[row][col]
      ) {
        dragStartCellRef.current = { row, col };
        dragStartPosRef.current = { x, y };
        isDraggingRef.current = true;
      }
    },
    [
      currentScreen,
      config,
      gameState.board,
      gameState.isPaused,
    ]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (currentScreen !== "game") return;
      if (gameState.isPaused) return;
      if (
        !isDraggingRef.current ||
        !dragStartCellRef.current ||
        !dragStartPosRef.current
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      const canvasWidth = canvas.width / dpr;

      // 기준 크기 (1200px 기준으로 설계)
      const baseWidth = 1200;
      const scale = canvasWidth / baseWidth;

      const gridCols = config.gridCols || 9;
      const gridRows = config.gridRows || 9;

      const startPos = dragStartPosRef.current;
      const dx = x - startPos.x;
      const dy = y - startPos.y;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const threshold = 10 * scale; // 최소 스와이프 거리
      if (distance < threshold) {
        dragCurrentPosRef.current = { x, y };
        dragTargetCellRef.current = null;
        return;
      }

      const startCell = dragStartCellRef.current;
      let targetCell = { row: startCell.row, col: startCell.col };

      if (Math.abs(dx) > Math.abs(dy)) {
        // 수평 스와이프
        if (dx > 0) {
          targetCell.col += 1;
        } else {
          targetCell.col -= 1;
        }
      } else {
        // 수직 스와이프
        if (dy > 0) {
          targetCell.row += 1;
        } else {
          targetCell.row -= 1;
        }
      }

      if (
        targetCell.col < 0 ||
        targetCell.col >= gridCols ||
        targetCell.row < 0 ||
        targetCell.row >= gridRows
      ) {
        // 보드 밖으로 스와이프한 경우 드래그만 종료
        isDraggingRef.current = false;
        dragStartCellRef.current = null;
        dragStartPosRef.current = null;
        dragTargetCellRef.current = null;
        dragCurrentPosRef.current = null;
        return;
      }

      // 드래그 중인 위치와 타겟 셀 저장 (실제 교환은 하지 않음)
      dragCurrentPosRef.current = { x, y };
      dragTargetCellRef.current = targetCell;
    },
    [currentScreen, config, gameState.isPaused]
  );

  const handlePointerUp = useCallback(() => {
    if (
      isDraggingRef.current &&
      dragStartCellRef.current &&
      dragTargetCellRef.current
    ) {
      // 드래그가 끝날 때 실제 교환 수행
      const startCell = dragStartCellRef.current;
      const targetCell = dragTargetCellRef.current;

      // 인접한 셀인지 확인
      const rowDiff = Math.abs(startCell.row - targetCell.row);
      const colDiff = Math.abs(startCell.col - targetCell.col);

      if (
        (rowDiff === 1 && colDiff === 0) ||
        (rowDiff === 0 && colDiff === 1)
      ) {
        swapGems(startCell, targetCell);
        soundManager.playClick();
        ignoreClickRef.current = true;
      }
    }

    // 드래그 상태 초기화
    isDraggingRef.current = false;
    dragStartCellRef.current = null;
    dragStartPosRef.current = null;
    dragTargetCellRef.current = null;
    dragCurrentPosRef.current = null;
  }, [swapGems]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("click", handleCanvasClick);
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [handleCanvasClick]);

  // 포인터 이벤트 등록 (마우스 + 터치 공통)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  // 키보드 이벤트 핸들러 (접근성)
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 게임 화면에서만 키보드 입력 처리
      if (currentScreen !== "game" || gameState.isPaused || gameState.isAnimating) {
        return;
      }

      const gridRows = config.gridRows || 9;
      const gridCols = config.gridCols || 9;

      // 현재 선택된 셀이 없으면 첫 번째 셀 선택
      if (!selectedCell) {
        setSelectedCell({ row: 0, col: 0 });
        return;
      }

      let newRow = selectedCell.row;
      let newCol = selectedCell.col;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          newRow = Math.max(0, selectedCell.row - 1);
          setSelectedCell({ row: newRow, col: selectedCell.col });
          break;
        case "ArrowDown":
          event.preventDefault();
          newRow = Math.min(gridRows - 1, selectedCell.row + 1);
          setSelectedCell({ row: newRow, col: selectedCell.col });
          break;
        case "ArrowLeft":
          event.preventDefault();
          newCol = Math.max(0, selectedCell.col - 1);
          setSelectedCell({ row: selectedCell.row, col: newCol });
          break;
        case "ArrowRight":
          event.preventDefault();
          newCol = Math.min(gridCols - 1, selectedCell.col + 1);
          setSelectedCell({ row: selectedCell.row, col: newCol });
          break;
        case " ":
        case "Enter":
          event.preventDefault();
          // 현재 선택된 젬 선택
          if (gameState.board[selectedCell.row] && gameState.board[selectedCell.row][selectedCell.col]) {
            selectGem(selectedCell.row, selectedCell.col);
          }
          break;
        case "Escape":
          event.preventDefault();
          // 일시정지 토글
          togglePause();
          break;
        case "h":
        case "H":
          event.preventDefault();
          // 힌트 토글
          if (showHint) {
            setShowHint(false);
            hintRef.current = null;
          } else {
            const hint = findPossibleMatches(gameState.board);
            if (hint) {
              hintRef.current = hint;
              setShowHint(true);
              setTimeout(() => {
                setShowHint(false);
                hintRef.current = null;
              }, 3000);
            }
          }
          break;
      }
    },
    [
      currentScreen,
      gameState.isPaused,
      gameState.isAnimating,
      gameState.board,
      selectedCell,
      config.gridRows,
      config.gridCols,
      selectGem,
      togglePause,
      showHint,
    ]
  );

  // 키보드 이벤트 등록
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("keydown", handleKeyDown);

    return () => {
      canvas.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // 게임 화면이 변경되거나 보드가 변경되면 선택된 셀 초기화
  useEffect(() => {
    if (currentScreen !== "game") {
      setSelectedCell(null);
    }
  }, [currentScreen, gameState.board]);

  // CSS transform을 사용하여 게임 화면 회전
  // 이전에 저장된 orientationPreference 데이터 정리
  useEffect(() => {
    if (typeof window !== "undefined") {
      storageManager.remove("chipPuzzleGame_orientationPreference", { silent: true });
    }
  }, []);

  return (
    <div className="game-board">
      <GameCanvas
        config={config}
        onReady={handleCanvasReady}
        onResize={handleCanvasResize}
      />
    </div>
  );
};

export default GameBoard;
