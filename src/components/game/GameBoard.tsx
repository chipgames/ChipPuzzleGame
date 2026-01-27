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
import { getThemeColors, hexToRgba } from "@/utils/themeColors";
import "./GameBoard.css";

/**
 * 게임 보드 컴포넌트의 Props
 */
interface GameBoardProps {
  /** 현재 스테이지 번호 (기본값: 1) */
  stageNumber?: number;
  /** 현재 화면 상태 */
  currentScreen?: GameScreen;
  /** 화면 네비게이션 콜백 */
  onNavigate?: (screen: GameScreen) => void;
  /** 스테이지 시작 콜백 */
  onStartStage?: (stageNumber: number) => void;
}

/**
 * 게임 보드 컴포넌트
 *
 * Canvas를 사용하여 게임을 렌더링하고, 사용자 입력을 처리합니다.
 * 스테이지 선택 화면과 게임 플레이 화면을 모두 렌더링합니다.
 *
 * @param props - GameBoardProps
 * @returns 게임 보드 JSX
 */
const GameBoard: React.FC<GameBoardProps> = ({
  stageNumber = 1,
  currentScreen = "stageSelect",
  onNavigate: _onNavigate,
  onStartStage,
}) => {
  const initializedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
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
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  // 가로/세로 모드 상태 (모바일에서 게임 보드 회전)
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = storageManager.get<boolean>(
        "chipPuzzleGame_landscapeMode",
        { fallback: false, silent: true }
      );
      return saved ?? false;
    }
    return false;
  });

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
    try {
      const progress = storageManager.get<GameProgress>(
        "chipPuzzleGame_progress",
        { fallback: null, silent: true }
      );

      if (progress) {
        setUnlockedStages(Math.max(1, progress.highestStage || 1));
        logger.info("Game progress loaded", {
          highestStage: progress.highestStage || 1,
        });
      }
    } catch (error) {
      // 게임 상태 복구 실패 시 조용히 처리 (새 게임 시작)
      logger.warn("Failed to recover game state", { error });
      setUnlockedStages(1);
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

      // 배경 및 테마 색상 (먼저 선언)
      const {
        canvasBg,
        textPrimary,
        accentPrimary: accentPrimaryStage,
        accentSecondary: accentSecondaryStage,
        bgTertiary,
      } = getThemeColors();
      const isLightStage =
        document.documentElement.getAttribute("data-theme") === "light";
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 제목
      ctx.fillStyle = textPrimary;
      const titleFontSize = Math.max(16, 32 * scale); // 최소 16px
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(t("stageSelect.title"), canvasWidth / 2, 50 * scale);

      // 스테이지 그리드 렌더링
      const baseStageSize = 75; // 70 → 75로 증가
      const baseGap = 20; // 18 → 20로 증가
      const stageSize = baseStageSize * scale;
      const gap = baseGap * scale;
      const totalStages = 1000;
      const stagesPerPage = 50;
      const totalPages = Math.ceil(totalStages / stagesPerPage);
      const startStage = (currentPage - 1) * stagesPerPage + 1;
      const endStage = Math.min(startStage + stagesPerPage - 1, totalStages);
      const stagesToShow = endStage - startStage + 1;

      // 스테이지 수에 따라 동적으로 열 수 계산
      // 50개일 때는 10열 × 5행으로 표시 (가로로 10개, 세로로 5개)
      // 그 이상이면 8열로 표시
      let stagesPerRow = stagesToShow === 50 ? 10 : 8;

      const startX =
        (canvasWidth - (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) /
        2;
      const startY = 100 * scale;

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
          // 테마에 맞는 그라데이션 색상 사용
          gradient.addColorStop(0, accentPrimaryStage);
          gradient.addColorStop(1, accentSecondaryStage);
          ctx.fillStyle = gradient;
        } else {
          // 잠긴 스테이지 - 테마에 맞는 배경색
          ctx.fillStyle = bgTertiary || (isLightStage ? "#e0e0e5" : "#1a1a1a");
        }
        ctx.fillRect(x, y, stageSize, stageSize);

        // 테두리 - 테마에 맞는 색상
        ctx.strokeStyle = isUnlocked
          ? accentPrimaryStage
          : isLightStage
          ? "#cccccc"
          : "#444";
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(x, y, stageSize, stageSize);

        // 잠긴 스테이지인 경우 잠금 아이콘과 번호를 함께 표시
        if (!isUnlocked) {
          // 잠금 아이콘 (위쪽)
          ctx.fillStyle = "#ffa500";
          const lockFontSize = Math.max(16, 24 * scale); // 최소 16px
          ctx.font = `${lockFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "🔒",
            x + stageSize / 2,
            y + stageSize / 2 - 8 * scale // 위쪽에 배치
          );

          // 스테이지 번호 (아래쪽)
          ctx.fillStyle = textPrimary;
          const numberFontSize = Math.max(10, 14 * scale); // 잠긴 스테이지는 조금 작게
          ctx.font = `bold ${numberFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            stageNumber.toString(),
            x + stageSize / 2,
            y + stageSize / 2 + 12 * scale // 아래쪽에 배치
          );
        } else {
          // 해제된 스테이지는 번호만 중앙에 표시
          ctx.fillStyle = textPrimary;
          const numberFontSize = Math.max(12, 20 * scale); // 최소 12px
          ctx.font = `bold ${numberFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            stageNumber.toString(),
            x + stageSize / 2,
            y + stageSize / 2
          );
        }
      }

      // 페이지네이션 (프리미엄 스타일) - << 페이지 2/20 >> 형식
      const buttonHeight = 40 * scale;
      const buttonWidth = 90 * scale;
      const pageInfoY = canvasHeight - 60 * scale;
      const buttonY = pageInfoY;
      const buttonGap = 15 * scale;
      const buttonRadius = 10 * scale;
      const buttonBorderColor = isLightStage
        ? "rgba(255, 255, 255, 0.5)"
        : "rgba(255, 255, 255, 0.3)";
      const shadowAlpha = isLightStage ? 0.2 : 0.4;
      const { textTertiary: textTertiaryStage } = getThemeColors();

      // 페이지 정보 텍스트 너비 계산
      const pageInfoText = `${t(
        "stageSelect.page"
      )} ${currentPage} / ${totalPages}`;
      ctx.font = `bold ${Math.max(12, 18 * scale)}px Arial`;
      const pageInfoWidth = ctx.measureText(pageInfoText).width;

      // 전체 너비 계산 (이전 버튼 + 간격 + 페이지 정보 + 간격 + 다음 버튼)
      const totalWidth =
        buttonWidth + buttonGap + pageInfoWidth + buttonGap + buttonWidth;
      const paginationStartX = (canvasWidth - totalWidth) / 2;

      // 이전 페이지 버튼 (항상 표시, 비활성화 상태 포함)
      const prevButtonX = paginationStartX;
      const isPrevDisabled = currentPage <= 1;
      const isNextDisabled = currentPage >= totalPages;

      // 버튼 배경 (그라데이션 또는 비활성화 색상)
      const prevGradient = ctx.createLinearGradient(
        prevButtonX,
        buttonY,
        prevButtonX,
        buttonY + buttonHeight
      );
      if (isPrevDisabled) {
        prevGradient.addColorStop(0, isLightStage ? "#cccccc" : "#444");
        prevGradient.addColorStop(1, isLightStage ? "#bbbbbb" : "#333");
      } else {
        prevGradient.addColorStop(0, accentPrimaryStage);
        prevGradient.addColorStop(1, accentSecondaryStage);
      }

      ctx.save();
      ctx.globalAlpha = isPrevDisabled ? 0.4 : 1;
      ctx.beginPath();
      ctx.roundRect(
        prevButtonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        buttonRadius
      );
      ctx.fillStyle = prevGradient;
      ctx.fill();
      ctx.strokeStyle = isPrevDisabled
        ? isLightStage
          ? "#aaaaaa"
          : "#555"
        : buttonBorderColor;
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.stroke();
      ctx.restore();

      // 그림자 효과 (활성화된 경우만)
      if (!isPrevDisabled) {
        ctx.shadowColor = hexToRgba(accentPrimaryStage, shadowAlpha);
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isPrevDisabled ? textTertiaryStage : textPrimary;
      ctx.font = `600 ${Math.max(
        12,
        16 * scale
      )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "«",
        prevButtonX + buttonWidth / 2,
        buttonY + buttonHeight / 2
      );

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // 페이지 정보 표시
      const pageInfoX = prevButtonX + buttonWidth + buttonGap;
      ctx.fillStyle = textPrimary;
      ctx.font = `bold ${Math.max(12, 18 * scale)}px Arial`;
      ctx.textAlign = "left";
      ctx.fillText(
        pageInfoText,
        pageInfoX,
        buttonY + buttonHeight / 2 + 4 * scale
      );

      // 다음 페이지 버튼 (항상 표시, 비활성화 상태 포함)
      const nextButtonX = pageInfoX + pageInfoWidth + buttonGap;

      // 버튼 배경 (그라데이션 또는 비활성화 색상)
      const nextGradient = ctx.createLinearGradient(
        nextButtonX,
        buttonY,
        nextButtonX,
        buttonY + buttonHeight
      );
      if (isNextDisabled) {
        nextGradient.addColorStop(0, isLightStage ? "#cccccc" : "#444");
        nextGradient.addColorStop(1, isLightStage ? "#bbbbbb" : "#333");
      } else {
        nextGradient.addColorStop(0, accentPrimaryStage);
        nextGradient.addColorStop(1, accentSecondaryStage);
      }

      ctx.save();
      ctx.globalAlpha = isNextDisabled ? 0.4 : 1;
      ctx.beginPath();
      ctx.roundRect(
        nextButtonX,
        buttonY,
        buttonWidth,
        buttonHeight,
        buttonRadius
      );
      ctx.fillStyle = nextGradient;
      ctx.fill();
      ctx.strokeStyle = isNextDisabled
        ? isLightStage
          ? "#aaaaaa"
          : "#555"
        : buttonBorderColor;
      ctx.lineWidth = Math.max(1, 1.5 * scale);
      ctx.stroke();
      ctx.restore();

      // 그림자 효과 (활성화된 경우만)
      if (!isNextDisabled) {
        ctx.shadowColor = hexToRgba(accentPrimaryStage, shadowAlpha);
        ctx.shadowBlur = 6 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
      } else {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = isNextDisabled ? textTertiaryStage : textPrimary;
      ctx.font = `600 ${Math.max(
        12,
        16 * scale
      )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "»",
        nextButtonX + buttonWidth / 2,
        buttonY + buttonHeight / 2
      );

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
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
      const {
        canvasBg,
        textPrimary,
        accentPrimary,
        accentSecondary,
        accentSuccess,
      } = getThemeColors();
      const isLight =
        document.documentElement.getAttribute("data-theme") === "light";

      // 배경
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // 게임 정보 패널 크기 계산 (게임 보드 위치 조정을 위해 먼저 계산)
      const infoFontSize = Math.max(10, 20 * scale);
      const infoMarginX = 24 * scale;
      const infoCardPadding = 16 * scale;
      const infoCardWidth = 280 * scale;
      const infoLineHeight = infoFontSize + 8 * scale;
      const infoCardHeight = infoLineHeight * 4 + infoCardPadding * 2;
      const infoPanelRightEdge = infoMarginX - infoCardPadding + infoCardWidth;
      const infoPanelMargin = 20 * scale; // 정보 패널과 게임 보드 사이 여백

      // 그리드 배경 그리기
      const baseCellSize = config.cellSize || 70;
      const cellSize = baseCellSize * scale;
      const gridCols = config.gridCols || 9;
      const gridRows = config.gridRows || 9;

      const gridWidth = cellSize * gridCols;
      const gridHeight = cellSize * gridRows;
      
      // 게임 보드 시작 X 좌표: 정보 패널 오른쪽에 여백을 두고 배치
      // 오른쪽 버튼 영역도 고려 (버튼 너비 + 여백)
      const buttonMargin = 20 * scale;
      const baseButtonWidth = 120;
      const buttonWidth = baseButtonWidth * scale;
      const rightButtonArea = buttonWidth + buttonMargin;
      
      // 사용 가능한 너비 계산
      const availableWidth = canvasWidth - infoPanelRightEdge - infoPanelMargin - rightButtonArea;
      
      // 게임 보드가 사용 가능한 너비보다 작으면 중앙 정렬, 크면 정보 패널 오른쪽에 배치
      let gridStartX: number;
      if (gridWidth <= availableWidth) {
        // 중앙 정렬하되, 정보 패널과 겹치지 않도록 조정
        const centerX = canvasWidth / 2;
        const minStartX = infoPanelRightEdge + infoPanelMargin;
        gridStartX = Math.max(minStartX, centerX - gridWidth / 2);
      } else {
        // 게임 보드가 크면 정보 패널 오른쪽에 배치
        gridStartX = infoPanelRightEdge + infoPanelMargin;
      }
      
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

      // 그리드 배경 (프리미엄 스타일) - 테마에 맞는 색상
      const { bgTertiary } = getThemeColors();
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = isLight
        ? hexToRgba(bgTertiary, 0.6)
        : "rgba(22, 22, 46, 0.8)";
      ctx.beginPath();
      ctx.roundRect(gridStartX, gridStartY, gridWidth, gridHeight, 8 * scale);
      ctx.fill();
      ctx.restore();

      // 그리드 선 그리기 (개선된 스타일) - 테마에 맞는 색상
      ctx.strokeStyle = isLight
        ? "rgba(0, 0, 0, 0.08)"
        : "rgba(255, 255, 255, 0.08)";
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
      // (infoFontSize, infoMarginX, infoCardPadding, infoCardWidth, infoLineHeight는 위에서 이미 계산됨)
      const infoMarginY = 24 * scale;
      const infoY = infoMarginY;
      const infoCardRadius = 16 * scale;

      // 정보 카드 배경 (글래스모피즘 효과)
      const { bgCard, borderColor } = getThemeColors();
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = bgCard;
      ctx.beginPath();
      ctx.roundRect(
        infoMarginX - infoCardPadding,
        infoMarginY - infoCardPadding,
        infoCardWidth,
        infoCardHeight,
        infoCardRadius
      );
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      ctx.restore();

      // 텍스트 스타일 (테마에 맞는 그림자)
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.shadowColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * scale;

      // 스테이지 번호 표시 (가장 위에)
      ctx.font = `700 ${Math.max(
        14,
        infoFontSize * 1.1
      )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = accentPrimary; // 강조 색상
      ctx.fillText(`${t("game.stage")} ${stageNumber}`, infoMarginX, infoY);

      // 점수 표시 (그라데이션 효과)
      ctx.font = `600 ${infoFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = textPrimary;
      ctx.fillText(
        `${t("game.score")}: ${gameState.score.toLocaleString()}`,
        infoMarginX,
        infoY + infoLineHeight
      );

      // 이동 횟수 표시
      const { textSecondary } = getThemeColors();
      ctx.fillStyle = textSecondary;
      ctx.fillText(
        `${t("game.moves")}: ${gameState.moves}`,
        infoMarginX,
        infoY + infoLineHeight * 2
      );

      // 목표 표시
      if (gameState.goals.length > 0) {
        const goal = gameState.goals[0];
        const progress = goal.current / goal.target;
        const { accentSuccess } = getThemeColors();
        ctx.fillStyle = progress >= 1 ? accentSuccess : textPrimary;
        ctx.fillText(
          `${t(
            "game.goal"
          )}: ${goal.current.toLocaleString()}/${goal.target.toLocaleString()}`,
          infoMarginX,
          infoY + infoLineHeight * 3
        );
      }

      // 콤보 표시 (프리미엄 스타일)
      if (gameState.comboCount > 0) {
        const { accentWarning } = getThemeColors();
        ctx.shadowColor = hexToRgba(accentWarning, isLight ? 0.4 : 0.6);
        ctx.shadowBlur = 12 * scale;
        ctx.font = `700 ${Math.max(
          14,
          24 * scale
        )}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.fillStyle = accentWarning;
        ctx.textAlign = "left";
        ctx.fillText(
          `${t("game.combo")} x${gameState.comboCount}!`,
          infoMarginX,
          infoY + infoLineHeight * 4
        );
        ctx.shadowColor = isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 4 * scale;
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // 힌트 버튼, 일시정지 버튼, 스테이지 목록 버튼 (우측 상단, 세로 배치) - 모바일 비율 고려
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
        const backToStagesButtonWidth = baseButtonWidth * scale;
        const backToStagesButtonHeight = baseButtonHeight * scale;

        // 모든 버튼의 X 좌표는 동일 (세로 배치)
        const buttonX = canvasWidth - hintButtonWidth - buttonMargin;
        
        // 힌트 버튼 (맨 위)
        const hintButtonY = buttonMargin;
        // 일시정지 버튼 (중간)
        const pauseButtonY = hintButtonY + hintButtonHeight + buttonGap;
        // 스테이지 목록 버튼 (맨 아래)
        const backToStagesButtonY = pauseButtonY + pauseButtonHeight + buttonGap;
        
        const buttonRadius = 12 * scale;

        // 버튼 배경 (그라데이션)
        const hintGradient = ctx.createLinearGradient(
          buttonX,
          hintButtonY,
          buttonX,
          hintButtonY + hintButtonHeight
        );
        // 테마에 맞는 그라데이션 색상 사용
        if (showHint) {
          hintGradient.addColorStop(0, accentSuccess);
          hintGradient.addColorStop(1, accentSuccess);
        } else {
          hintGradient.addColorStop(0, accentPrimary);
          hintGradient.addColorStop(1, accentSecondary);
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          buttonX,
          hintButtonY,
          hintButtonWidth,
          hintButtonHeight,
          buttonRadius
        );
        ctx.fillStyle = hintGradient;
        ctx.fill();
        // 테마에 맞는 테두리 색상
        const buttonBorderColor = isLight
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(255, 255, 255, 0.3)";
        ctx.strokeStyle = buttonBorderColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        // 그림자 효과 (테마에 맞게 조정)
        const shadowAlpha = isLight ? 0.2 : 0.4;
        ctx.shadowColor = showHint
          ? hexToRgba(accentSuccess, shadowAlpha)
          : hexToRgba(accentPrimary, shadowAlpha);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;

        ctx.fillStyle = textPrimary;
        const hintFontSize = 16 * scale;
        ctx.font = `600 ${hintFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.hint"),
          buttonX + hintButtonWidth / 2,
          hintButtonY + hintButtonHeight / 2
        );

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 일시정지 버튼 (프리미엄 스타일)
        // 버튼 배경 (그라데이션)
        const pauseGradient = ctx.createLinearGradient(
          buttonX,
          pauseButtonY,
          buttonX,
          pauseButtonY + pauseButtonHeight
        );
        // 테마에 맞는 그라데이션 색상 사용
        if (gameState.isPaused) {
          const { accentDanger } = getThemeColors();
          pauseGradient.addColorStop(0, accentDanger);
          pauseGradient.addColorStop(1, accentDanger);
        } else {
          pauseGradient.addColorStop(0, accentPrimary);
          pauseGradient.addColorStop(1, accentSecondary);
        }

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          buttonX,
          pauseButtonY,
          pauseButtonWidth,
          pauseButtonHeight,
          buttonRadius
        );
        ctx.fillStyle = pauseGradient;
        ctx.fill();
        // 테마에 맞는 테두리 색상
        ctx.strokeStyle = buttonBorderColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        // 그림자 효과 (테마에 맞게 조정)
        const { accentDanger } = getThemeColors();
        ctx.shadowColor = gameState.isPaused
          ? hexToRgba(accentDanger, shadowAlpha)
          : hexToRgba(accentPrimary, shadowAlpha);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;

        ctx.fillStyle = textPrimary;
        const pauseFontSize = 16 * scale;
        ctx.font = `600 ${pauseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          gameState.isPaused ? t("game.resume") : t("game.pause"),
          buttonX + pauseButtonWidth / 2,
          pauseButtonY + pauseButtonHeight / 2
        );

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 스테이지 목록 버튼 (프리미엄 스타일)
        const backToStagesGradient = ctx.createLinearGradient(
          buttonX,
          backToStagesButtonY,
          buttonX,
          backToStagesButtonY + backToStagesButtonHeight
        );
        backToStagesGradient.addColorStop(0, accentPrimary);
        backToStagesGradient.addColorStop(1, accentSecondary);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(
          buttonX,
          backToStagesButtonY,
          backToStagesButtonWidth,
          backToStagesButtonHeight,
          buttonRadius
        );
        ctx.fillStyle = backToStagesGradient;
        ctx.fill();
        ctx.strokeStyle = buttonBorderColor;
        ctx.lineWidth = Math.max(1, 1.5 * scale);
        ctx.stroke();
        ctx.restore();

        // 그림자 효과
        ctx.shadowColor = hexToRgba(accentPrimary, shadowAlpha);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;

        ctx.fillStyle = textPrimary;
        const backToStagesFontSize = 16 * scale;
        ctx.font = `600 ${backToStagesFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          t("game.backToStages"),
          buttonX + backToStagesButtonWidth / 2,
          backToStagesButtonY + backToStagesButtonHeight / 2
        );

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
      }

      // 게임 오버 메시지 (프리미엄 스타일)
      if (gameState.isGameOver) {
        const {
          bgOverlayDark,
          bgCard,
          accentDanger: accentDangerGameOver,
        } = getThemeColors();
        const buttonBorderColorGameOver = isLight
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(255, 255, 255, 0.3)";
        const shadowAlphaGameOver = isLight ? 0.2 : 0.4;

        // 반투명 배경
        ctx.fillStyle = bgOverlayDark;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 450 * scale;
        const cardHeight = 300 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 24 * scale;

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = bgCard;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accentDangerGameOver, isLight ? 0.3 : 0.3);
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 제목 텍스트
        ctx.shadowColor = hexToRgba(accentDangerGameOver, isLight ? 0.3 : 0.5);
        ctx.shadowBlur = 12 * scale;
        ctx.fillStyle = accentDangerGameOver;
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
        ctx.fillStyle = textPrimary;
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
        // 테마에 맞는 그라데이션 색상 사용
        gradient.addColorStop(0, accentDangerGameOver);
        gradient.addColorStop(1, accentDangerGameOver);

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
        ctx.strokeStyle = buttonBorderColorGameOver;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        ctx.shadowColor = hexToRgba(accentDangerGameOver, shadowAlphaGameOver);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillStyle = textPrimary;
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

      // 일시정지 오버레이 (프리미엄 스타일) - 젬 렌더링 이후에 그려서 위에 표시
      if (gameState.isPaused && !gameState.isGameOver) {
        const {
          bgOverlayDark,
          bgCard,
          accentPrimary: accentPrimaryPause,
          textSecondary: textSecondaryPause,
        } = getThemeColors();

        // 반투명 배경
        ctx.fillStyle = bgOverlayDark;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 400 * scale;
        const cardHeight = 200 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 24 * scale;

        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = bgCard;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accentPrimaryPause, isLight ? 0.2 : 0.3);
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 제목 텍스트 (그라데이션 효과)
        ctx.shadowColor = hexToRgba(accentPrimaryPause, isLight ? 0.3 : 0.5);
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = textPrimary;
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
        ctx.fillStyle = textSecondaryPause;
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

      // 클리어 화면 오버레이 (프리미엄 스타일)
      if (isCleared && !gameState.isAnimating && !gameState.isGameOver) {
        const stars = calculateStarRating(gameState);
        const { bgOverlayDark, bgCard, accentSuccess, textTertiary } =
          getThemeColors();
        const buttonBorderColorClear = isLight
          ? "rgba(255, 255, 255, 0.5)"
          : "rgba(255, 255, 255, 0.3)";
        const shadowAlphaClear = isLight ? 0.2 : 0.4;

        // 반투명 배경
        ctx.fillStyle = bgOverlayDark;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 글래스모피즘 카드
        const cardWidth = 500 * scale;
        const cardHeight = 400 * scale;
        const cardX = (canvasWidth - cardWidth) / 2;
        const cardY = (canvasHeight - cardHeight) / 2;
        const cardRadius = 28 * scale;

        ctx.save();
        ctx.globalAlpha = 0.96;
        ctx.fillStyle = bgCard;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(accentSuccess, isLight ? 0.3 : 0.4);
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        // 클리어 메시지 (그라데이션 효과)
        ctx.shadowColor = hexToRgba(accentSuccess, isLight ? 0.3 : 0.5);
        ctx.shadowBlur = 12 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = accentSuccess;
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
        const { accentWarning } = getThemeColors();
        const starSize = Math.max(24, 48 * scale);
        const starSpacing = starSize * 1.8;
        const starStartX = canvasWidth / 2 - starSpacing;
        const starY = cardY + 160 * scale;

        for (let i = 0; i < 3; i++) {
          const starX = starStartX + i * starSpacing;
          ctx.shadowColor =
            i < stars
              ? hexToRgba(accentWarning, isLight ? 0.4 : 0.6)
              : "transparent";
          ctx.shadowBlur = i < stars ? 12 * scale : 0;
          ctx.fillStyle = i < stars ? accentWarning : textTertiary;
          ctx.font = `${starSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("★", starX, starY);
        }

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 점수 표시
        ctx.fillStyle = textPrimary;
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
        // 테마에 맞는 그라데이션 색상 사용
        gradient.addColorStop(0, accentPrimary);
        gradient.addColorStop(1, accentSecondary);

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
        ctx.strokeStyle = buttonBorderColorClear;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();

        ctx.shadowColor = hexToRgba(accentPrimary, shadowAlphaClear);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillStyle = textPrimary;
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
      // 기본 배경 (테마 색상 사용)
      const { canvasBg } = getThemeColors();
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
  }, [currentScreen, renderStageSelect, renderGameBoard, stageNumber]);

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

      const saveResult = storageManager.set(
        "chipPuzzleGame_progress",
        progress
      );
      if (!saveResult) {
        logger.error("Failed to save progress", {
          stage: gameState.currentStage,
        });
        // 사용자에게 알림 (조용히 처리하여 게임 플레이 방해 최소화)
        // 메모리 저장소를 사용 중이면 세션 동안만 유지됨을 알림
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
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      let canvasWidth = canvas.width / dpr;
      let canvasHeight = canvas.height / dpr;

      // 가로 모드일 때 클릭 좌표 변환 (90도 시계방향 회전의 역변환)
      // 
      // [문제 상황]
      // - CSS로 컨테이너가 90도 시계방향 회전됨 (transform: rotate(90deg))
      // - Canvas는 회전되지 않았지만, 시각적으로는 회전되어 보임
      // - 클릭 좌표는 회전된 화면 기준이지만, 게임 로직은 원래 좌표계 필요
      //
      // [변환 과정]
      // 1. 화면 클릭 좌표 → 회전된 canvas 기준 상대 좌표 (x, y)
      // 2. 회전된 좌표를 중심 기준 상대 좌표로 변환 (relativeX, relativeY)
      // 3. -90도 회전 (역변환)하여 원래 좌표계의 상대 좌표로 변환
      // 4. 원래 캔버스 중심 기준 절대 좌표로 변환
      //
      if (isLandscapeMode && window.innerWidth <= 768) {
        // [단계 1] 원래 캔버스 크기 확인
        // Canvas 자체는 회전되지 않았으므로, 원래 크기는 변하지 않음
        const originalWidth = canvasWidth;   // 예: 1200px
        const originalHeight = canvasHeight;   // 예: 675px
        
        // [단계 2] 회전된 요소의 경계 상자 크기
        // getBoundingClientRect()는 회전된 요소의 경계 상자(bounding box)를 반환
        // 90도 회전하면 width와 height가 교환됨
        // 예: 원래 1200×675 → 회전 후 경계 상자는 약 675×1200
        const rotatedWidth = rect.width;      // 회전 후 width (원래 height와 비슷)
        const rotatedHeight = rect.height;     // 회전 후 height (원래 width와 비슷)
        
        // [단계 3] 회전 중심 계산
        // transform-origin: center center이므로 회전 중심은 중앙
        const rotatedCenterX = rotatedWidth / 2;   // 회전된 요소의 중심 X
        const rotatedCenterY = rotatedHeight / 2;  // 회전된 요소의 중심 Y
        const originalCenterX = originalWidth / 2;  // 원래 캔버스의 중심 X
        const originalCenterY = originalHeight / 2; // 원래 캔버스의 중심 Y
        
        // [단계 4] 회전된 좌표를 중심 기준 상대 좌표로 변환
        // 현재 x, y는 회전된 canvas 기준 절대 좌표
        // 중심점을 기준으로 상대 좌표로 변환하여 회전 변환을 쉽게 함
        const relativeX = x - rotatedCenterX;  // 중심 기준 상대 X
        const relativeY = y - rotatedCenterY;   // 중심 기준 상대 Y
        
        // [단계 5] -90도 회전 (90도 시계방향 회전의 역변환)
        //
        // [수학적 원리]
        // 90도 시계방향 회전 공식: (x, y) → (y, width - x)
        // 역변환 공식: (x', y') → (height - y', x')
        //
        // [예시]
        // 원래 상대 좌표: (100, 50)
        // 90도 회전 후: (50, width - 100) = (50, 1200 - 100) = (50, 1100)
        // 역변환: (height - 1100, 50) = (675 - 1100, 50) = (-425, 50)
        //
        // 하지만 실제로는 회전된 좌표계에서:
        // - rotatedWidth = originalHeight (회전 후 width는 원래 height)
        // - rotatedHeight = originalWidth (회전 후 height는 원래 width)
        //
        // 따라서 역변환:
        //const originalRelativeX = originalHeight - relativeY;  // height - y'
        const originalRelativeX = relativeY;  // height - y'
        const originalRelativeY = -relativeX;                      // x'
        
        // [단계 6] 원래 캔버스의 중심을 기준으로 절대 좌표로 변환
        // 상대 좌표를 다시 절대 좌표로 변환하여 최종 클릭 위치 계산
        x = originalCenterX + originalRelativeX;
        y = originalCenterY + originalRelativeY;
      }

      // 캔버스 컨텍스트 가져오기 (텍스트 너비 측정용)
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      if (currentScreen === "stageSelect") {
        // 스테이지 선택 화면
        if (!onStartStage) return;

        // 기준 크기 (1200px 기준으로 설계)
        const baseWidth = 1200;
        const scale = canvasWidth / baseWidth;

        // 공통 상수
        const totalStages = 1000;
        const stagesPerPage = 50;

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
        const totalPages = Math.ceil(totalStages / stagesPerPage);
        const buttonHeight = 40 * scale;
        const buttonWidth = 90 * scale;
        const pageInfoY = canvasHeight - 60 * scale;
        const buttonY = pageInfoY;
        const buttonGap = 15 * scale;

        // 페이지 정보 텍스트 너비 측정 (렌더링과 동일한 방식)
        const pageInfoText = `${t(
          "stageSelect.page"
        )} ${currentPage} / ${totalPages}`;
        ctx.font = `bold ${Math.max(12, 18 * scale)}px Arial`;
        const pageInfoWidth = ctx.measureText(pageInfoText).width;

        // 전체 너비 계산 (렌더링과 동일)
        const totalWidth =
          buttonWidth + buttonGap + pageInfoWidth + buttonGap + buttonWidth;
        const paginationStartX = (canvasWidth - totalWidth) / 2;

        // 이전 페이지 버튼 클릭 감지
        const prevButtonX = paginationStartX;
        const isPrevDisabled = currentPage <= 1;
        const prevButtonRight = prevButtonX + buttonWidth;
        const prevButtonBottom = buttonY + buttonHeight;

        if (
          !isPrevDisabled &&
          x >= prevButtonX &&
          x <= prevButtonRight &&
          y >= buttonY &&
          y <= prevButtonBottom
        ) {
          logger.debug("이전 페이지 버튼 클릭", {
            x,
            y,
            prevButtonX,
            prevButtonRight,
            buttonY,
            prevButtonBottom,
            currentPage,
          });
          setCurrentPage(currentPage - 1);
          soundManager.playClick();
          return;
        }

        // 다음 페이지 버튼 클릭 감지
        const pageInfoX = prevButtonX + buttonWidth + buttonGap;
        const nextButtonX = pageInfoX + pageInfoWidth + buttonGap;
        const isNextDisabled = currentPage >= totalPages;
        const nextButtonRight = nextButtonX + buttonWidth;
        const nextButtonBottom = buttonY + buttonHeight;

        if (
          !isNextDisabled &&
          x >= nextButtonX &&
          x <= nextButtonRight &&
          y >= buttonY &&
          y <= nextButtonBottom
        ) {
          logger.debug("다음 페이지 버튼 클릭", {
            x,
            y,
            nextButtonX,
            nextButtonRight,
            buttonY,
            nextButtonBottom,
            currentPage,
            totalPages,
          });
          setCurrentPage(currentPage + 1);
          soundManager.playClick();
          return;
        }

        // 스테이지 그리드 클릭 감지
        const baseStageSize = 75; // 70 → 75로 증가 (렌더링과 동일)
        const baseGap = 20; // 18 → 20로 증가 (렌더링과 동일)
        const stageSize = baseStageSize * scale;
        const gap = baseGap * scale;
        const startStage = (currentPage - 1) * stagesPerPage + 1;
        const endStage = Math.min(startStage + stagesPerPage - 1, totalStages);
        const stagesToShow = endStage - startStage + 1;

        // 스테이지 수에 따라 동적으로 열 수 계산 (렌더링과 동일)
        // 50개일 때는 10열 × 5행으로 표시 (가로로 10개, 세로로 5개)
        const stagesPerRow = stagesToShow === 50 ? 10 : 8;

        let col: number;
        let row: number;

        // 가로 모드일 때는 세로 모드와 동일한 로직 사용 (좌표 변환이 이미 적용됨)
        if (isLandscapeMode && window.innerWidth <= 768) {
          // 좌표 변환이 이미 적용되었으므로, 세로 모드와 동일하게 계산
          const startX =
            (canvasWidth -
              (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) /
            2;
          const startY = 100 * scale;
          
          col = Math.floor((x - startX) / (stageSize + gap));
          row = Math.floor((y - startY) / (stageSize + gap));
        } else {
          // 일반 모드
          const startX =
            (canvasWidth -
              (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) /
            2;
          const startY = 100 * scale;

          col = Math.floor((x - startX) / (stageSize + gap));
          row = Math.floor((y - startY) / (stageSize + gap));
        }

        if (col >= 0 && col < stagesPerRow && row >= 0) {
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

        // 힌트 버튼, 일시정지 버튼, 스테이지 목록 버튼 클릭 확인 (렌더링과 동일한 크기/위치 계산, 세로 배치)
        const baseButtonWidth = 120;
        const baseButtonHeight = 40;
        const buttonMargin = 20 * scale;
        const buttonGap = 10 * scale;

        const hintButtonWidth = baseButtonWidth * scale;
        const hintButtonHeight = baseButtonHeight * scale;
        const pauseButtonWidth = baseButtonWidth * scale;
        const pauseButtonHeight = baseButtonHeight * scale;
        const backToStagesButtonWidth = baseButtonWidth * scale;
        const backToStagesButtonHeight = baseButtonHeight * scale;

        // 모든 버튼의 X 좌표는 동일 (세로 배치)
        const buttonX = canvasWidth - hintButtonWidth - buttonMargin;
        
        // 힌트 버튼 (맨 위)
        const hintButtonY = buttonMargin;
        // 일시정지 버튼 (중간)
        const pauseButtonY = hintButtonY + hintButtonHeight + buttonGap;
        // 스테이지 목록 버튼 (맨 아래)
        const backToStagesButtonY = pauseButtonY + pauseButtonHeight + buttonGap;

        // 힌트 버튼 클릭
        if (
          x >= buttonX &&
          x <= buttonX + hintButtonWidth &&
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

        // 일시정지 버튼 클릭
        if (
          x >= buttonX &&
          x <= buttonX + pauseButtonWidth &&
          y >= pauseButtonY &&
          y <= pauseButtonY + pauseButtonHeight
        ) {
          togglePause();
          soundManager.playClick();
          return;
        }

        // 스테이지 목록 버튼 클릭
        if (
          x >= buttonX &&
          x <= buttonX + backToStagesButtonWidth &&
          y >= backToStagesButtonY &&
          y <= backToStagesButtonY + backToStagesButtonHeight
        ) {
          if (_onNavigate) {
            _onNavigate("stageSelect");
          }
          soundManager.playClick();
          return;
        }

        // 일시정지 상태에서는 젬 클릭 무시
        if (gameState.isPaused) {
          return;
        }

        // 젬 클릭 처리 (렌더링과 동일한 계산 사용)
        const baseCellSize = config.cellSize || 70;
        const cellSize = baseCellSize * scale;
        const gridCols = config.gridCols || 9;
        const gridRows = config.gridRows || 9;

        const gridWidth = cellSize * gridCols;
        const gridHeight = cellSize * gridRows;
        
        // 게임 보드 위치 계산 (렌더링과 동일)
        // buttonMargin과 baseButtonWidth는 위에서 이미 선언됨 (2038번째 줄, 2036번째 줄)
        const infoMarginX = 24 * scale;
        const infoCardPadding = 16 * scale;
        const infoCardWidth = 280 * scale;
        const infoPanelRightEdge = infoMarginX - infoCardPadding + infoCardWidth;
        const infoPanelMargin = 20 * scale;
        const buttonWidth = baseButtonWidth * scale;
        const rightButtonArea = buttonWidth + buttonMargin;
        const availableWidth = canvasWidth - infoPanelRightEdge - infoPanelMargin - rightButtonArea;
        
        let gridStartX: number;
        if (gridWidth <= availableWidth) {
          const centerX = canvasWidth / 2;
          const minStartX = infoPanelRightEdge + infoPanelMargin;
          gridStartX = Math.max(minStartX, centerX - gridWidth / 2);
        } else {
          gridStartX = infoPanelRightEdge + infoPanelMargin;
        }
        
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
      currentPage,
      t,
      isLandscapeMode,
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
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      let canvasWidth = canvas.width / dpr;
      let canvasHeight = canvas.height / dpr;

      // 가로 모드일 때 클릭 좌표 변환 (90도 시계방향 회전의 역변환)
      // 
      // [문제 상황]
      // - CSS로 컨테이너가 90도 시계방향 회전됨 (transform: rotate(90deg))
      // - Canvas는 회전되지 않았지만, 시각적으로는 회전되어 보임
      // - 클릭 좌표는 회전된 화면 기준이지만, 게임 로직은 원래 좌표계 필요
      //
      // [변환 과정]
      // 1. 화면 클릭 좌표 → 회전된 canvas 기준 상대 좌표 (x, y)
      // 2. 회전된 좌표를 중심 기준 상대 좌표로 변환 (relativeX, relativeY)
      // 3. -90도 회전 (역변환)하여 원래 좌표계의 상대 좌표로 변환
      // 4. 원래 캔버스 중심 기준 절대 좌표로 변환
      //
      if (isLandscapeMode && window.innerWidth <= 768) {
        // [단계 1] 원래 캔버스 크기 확인
        // Canvas 자체는 회전되지 않았으므로, 원래 크기는 변하지 않음
        const originalWidth = canvasWidth;   // 예: 1200px
        const originalHeight = canvasHeight;   // 예: 675px
        
        // [단계 2] 회전된 요소의 경계 상자 크기
        // getBoundingClientRect()는 회전된 요소의 경계 상자(bounding box)를 반환
        // 90도 회전하면 width와 height가 교환됨
        // 예: 원래 1200×675 → 회전 후 경계 상자는 약 675×1200
        const rotatedWidth = rect.width;      // 회전 후 width (원래 height와 비슷)
        const rotatedHeight = rect.height;     // 회전 후 height (원래 width와 비슷)
        
        // [단계 3] 회전 중심 계산
        // transform-origin: center center이므로 회전 중심은 중앙
        const rotatedCenterX = rotatedWidth / 2;   // 회전된 요소의 중심 X
        const rotatedCenterY = rotatedHeight / 2;  // 회전된 요소의 중심 Y
        const originalCenterX = originalWidth / 2;  // 원래 캔버스의 중심 X
        const originalCenterY = originalHeight / 2; // 원래 캔버스의 중심 Y
        
        // [단계 4] 회전된 좌표를 중심 기준 상대 좌표로 변환
        // 현재 x, y는 회전된 canvas 기준 절대 좌표
        // 중심점을 기준으로 상대 좌표로 변환하여 회전 변환을 쉽게 함
        const relativeX = x - rotatedCenterX;  // 중심 기준 상대 X
        const relativeY = y - rotatedCenterY;   // 중심 기준 상대 Y
        
        // [단계 5] -90도 회전 (90도 시계방향 회전의 역변환)
        //
        // [수학적 원리]
        // 90도 시계방향 회전 공식: (x, y) → (y, width - x)
        // 역변환 공식: (x', y') → (height - y', x')
        //
        // [예시]
        // 원래 상대 좌표: (100, 50)
        // 90도 회전 후: (50, width - 100) = (50, 1200 - 100) = (50, 1100)
        // 역변환: (height - 1100, 50) = (675 - 1100, 50) = (-425, 50)
        //
        // 하지만 실제로는 회전된 좌표계에서:
        // - rotatedWidth = originalHeight (회전 후 width는 원래 height)
        // - rotatedHeight = originalWidth (회전 후 height는 원래 width)
        //
        // 따라서 역변환:
        const originalRelativeX = relativeY;  // height - y'
        const originalRelativeY = -relativeX;                      // x'
        
        // [단계 6] 원래 캔버스의 중심을 기준으로 절대 좌표로 변환
        // 상대 좌표를 다시 절대 좌표로 변환하여 최종 클릭 위치 계산
        x = originalCenterX + originalRelativeX;
        y = originalCenterY + originalRelativeY;
      }

      // 기준 크기 (1200px 기준으로 설계)
      const baseWidth = 1200;
      const scale = canvasWidth / baseWidth;

      const baseCellSize = config.cellSize || 50;
      const cellSize = baseCellSize * scale;
      const gridCols = config.gridCols || 9;
      const gridRows = config.gridRows || 9;

      const gridWidth = cellSize * gridCols;
      const gridHeight = cellSize * gridRows;
      
      // 게임 보드 위치 계산 (렌더링과 동일)
      const infoMarginX = 24 * scale;
      const infoCardPadding = 16 * scale;
      const infoCardWidth = 280 * scale;
      const infoPanelRightEdge = infoMarginX - infoCardPadding + infoCardWidth;
      const infoPanelMargin = 20 * scale;
      const buttonMargin = 20 * scale;
      const baseButtonWidth = 120;
      const buttonWidth = baseButtonWidth * scale;
      const rightButtonArea = buttonWidth + buttonMargin;
      const availableWidth = canvasWidth - infoPanelRightEdge - infoPanelMargin - rightButtonArea;
      
      let gridStartX: number;
      if (gridWidth <= availableWidth) {
        const centerX = canvasWidth / 2;
        const minStartX = infoPanelRightEdge + infoPanelMargin;
        gridStartX = Math.max(minStartX, centerX - gridWidth / 2);
      } else {
        gridStartX = infoPanelRightEdge + infoPanelMargin;
      }
      
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
    [currentScreen, config, gameState.board, gameState.isPaused, isLandscapeMode]
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
      let x = event.clientX - rect.left;
      let y = event.clientY - rect.top;

      const dpr = window.devicePixelRatio || 1;
      let canvasWidth = canvas.width / dpr;
      let canvasHeight = canvas.height / dpr;

      // 가로 모드일 때 클릭 좌표 변환 (90도 시계방향 회전의 역변환)
      // 
      // [문제 상황]
      // - CSS로 컨테이너가 90도 시계방향 회전됨 (transform: rotate(90deg))
      // - Canvas는 회전되지 않았지만, 시각적으로는 회전되어 보임
      // - 클릭 좌표는 회전된 화면 기준이지만, 게임 로직은 원래 좌표계 필요
      //
      // [변환 과정]
      // 1. 화면 클릭 좌표 → 회전된 canvas 기준 상대 좌표 (x, y)
      // 2. 회전된 좌표를 중심 기준 상대 좌표로 변환 (relativeX, relativeY)
      // 3. -90도 회전 (역변환)하여 원래 좌표계의 상대 좌표로 변환
      // 4. 원래 캔버스 중심 기준 절대 좌표로 변환
      //
      if (isLandscapeMode && window.innerWidth <= 768) {
        // [단계 1] 원래 캔버스 크기 확인
        // Canvas 자체는 회전되지 않았으므로, 원래 크기는 변하지 않음
        const originalWidth = canvasWidth;   // 예: 1200px
        const originalHeight = canvasHeight;   // 예: 675px
        
        // [단계 2] 회전된 요소의 경계 상자 크기
        // getBoundingClientRect()는 회전된 요소의 경계 상자(bounding box)를 반환
        // 90도 회전하면 width와 height가 교환됨
        // 예: 원래 1200×675 → 회전 후 경계 상자는 약 675×1200
        const rotatedWidth = rect.width;      // 회전 후 width (원래 height와 비슷)
        const rotatedHeight = rect.height;     // 회전 후 height (원래 width와 비슷)
        
        // [단계 3] 회전 중심 계산
        // transform-origin: center center이므로 회전 중심은 중앙
        const rotatedCenterX = rotatedWidth / 2;   // 회전된 요소의 중심 X
        const rotatedCenterY = rotatedHeight / 2;  // 회전된 요소의 중심 Y
        const originalCenterX = originalWidth / 2;  // 원래 캔버스의 중심 X
        const originalCenterY = originalHeight / 2; // 원래 캔버스의 중심 Y
        
        // [단계 4] 회전된 좌표를 중심 기준 상대 좌표로 변환
        // 현재 x, y는 회전된 canvas 기준 절대 좌표
        // 중심점을 기준으로 상대 좌표로 변환하여 회전 변환을 쉽게 함
        const relativeX = x - rotatedCenterX;  // 중심 기준 상대 X
        const relativeY = y - rotatedCenterY;   // 중심 기준 상대 Y
        
        // [단계 5] -90도 회전 (90도 시계방향 회전의 역변환)
        //
        // [수학적 원리]
        // 90도 시계방향 회전 공식: (x, y) → (y, width - x)
        // 역변환 공식: (x', y') → (height - y', x')
        //
        // [예시]
        // 원래 상대 좌표: (100, 50)
        // 90도 회전 후: (50, width - 100) = (50, 1200 - 100) = (50, 1100)
        // 역변환: (height - 1100, 50) = (675 - 1100, 50) = (-425, 50)
        //
        // 하지만 실제로는 회전된 좌표계에서:
        // - rotatedWidth = originalHeight (회전 후 width는 원래 height)
        // - rotatedHeight = originalWidth (회전 후 height는 원래 width)
        //
        // 따라서 역변환:
        //const originalRelativeX = originalHeight - relativeY;  // height - y'
        const originalRelativeX = relativeY;  // height - y'
        const originalRelativeY = -relativeX;                      // x'
        
        // [단계 6] 원래 캔버스의 중심을 기준으로 절대 좌표로 변환
        // 상대 좌표를 다시 절대 좌표로 변환하여 최종 클릭 위치 계산
        x = originalCenterX + originalRelativeX;
        y = originalCenterY + originalRelativeY;
      }

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
    [currentScreen, config, gameState.isPaused, isLandscapeMode]
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
      if (
        currentScreen !== "game" ||
        gameState.isPaused ||
        gameState.isAnimating
      ) {
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
          if (
            gameState.board[selectedCell.row] &&
            gameState.board[selectedCell.row][selectedCell.col]
          ) {
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

  // 가로/세로 모드 토글 핸들러
  const toggleOrientationMode = useCallback(() => {
    const newMode = !isLandscapeMode;
    setIsLandscapeMode(newMode);
    // localStorage에 저장
    storageManager.set("chipPuzzleGame_landscapeMode", newMode);
    soundManager.playClick();
  }, [isLandscapeMode]);

  // CSS transform을 사용하여 게임 화면 회전
  // 이전에 저장된 orientationPreference 데이터 정리
  useEffect(() => {
    if (typeof window !== "undefined") {
      storageManager.remove("chipPuzzleGame_orientationPreference", {
        silent: true,
      });
    }
  }, []);

  // 모바일 여부 확인
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  return (
    <div className="game-board">
      <div
        ref={containerRef}
        className={`game-board-container ${isLandscapeMode ? "landscape-mode" : ""}`}
      >
        <GameCanvas
          config={config}
          onReady={handleCanvasReady}
          onResize={handleCanvasResize}
        />
      </div>
      {/* 모바일에서만 방향 전환 버튼 표시 (스테이지 선택 화면과 게임 화면) */}
      {isMobile && (currentScreen === "stageSelect" || currentScreen === "game") && (
        <button
          className={`orientation-toggle-button ${isLandscapeMode ? "landscape-mode" : ""}`}
          onClick={toggleOrientationMode}
          aria-label={
            isLandscapeMode
              ? t("game.switchToPortrait")
              : t("game.switchToLandscape")
          }
          title={
            isLandscapeMode
              ? t("game.switchToPortrait")
              : t("game.switchToLandscape")
          }
        >
          <span className="orientation-icon">
            {isLandscapeMode ? "📱" : "🔄"}
          </span>
          <span className="orientation-text">
            {isLandscapeMode
              ? t("game.portraitMode")
              : t("game.landscapeMode")}
          </span>
        </button>
      )}
    </div>
  );
};

export default GameBoard;
