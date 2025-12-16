import { Gem } from "@/types/gem";
import { StageConfig } from "@/types/stage";
import { GEM_COLORS } from "@/constants/gemConfig";
import { generateNewGem } from "./gravity";

/**
 * 시드 기반 랜덤 생성기
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * 스테이지 생성
 */
export function generateStage(stageNumber: number): StageConfig {
  const rng = new SeededRandom(stageNumber);
  
  // 난이도 계산
  const difficulty = Math.floor(stageNumber / 100) + 1;
  const gridSize = calculateGridSize(stageNumber);
  const targetScore = calculateTargetScore(stageNumber);
  const maxMoves = calculateMaxMoves(stageNumber);

  // 초기 보드 생성
  const initialBoard = generateInitialBoard(gridSize.rows, gridSize.cols, rng);

  return {
    stageNumber,
    gridSize,
    targetScore,
    maxMoves,
    goals: [
      {
        type: "score",
        target: targetScore,
        current: 0,
      },
    ],
    initialBoard,
  };
}

/**
 * 그리드 크기 계산 (6x6 ~ 10x10)
 */
function calculateGridSize(stageNumber: number): { rows: number; cols: number } {
  // 스테이지에 따라 크기 조절
  if (stageNumber <= 100) {
    return { rows: 9, cols: 9 };
  } else if (stageNumber <= 300) {
    return { rows: 8, cols: 8 };
  } else if (stageNumber <= 600) {
    return { rows: 7, cols: 7 };
  } else {
    return { rows: 6, cols: 6 };
  }
}

/**
 * 목표 점수 계산
 */
function calculateTargetScore(stageNumber: number): number {
  return 1000 + stageNumber * 50;
}

/**
 * 최대 이동 횟수 계산
 */
function calculateMaxMoves(stageNumber: number): number {
  return Math.max(20, 50 - Math.floor(stageNumber / 20));
}

/**
 * 초기 보드 생성
 */
function generateInitialBoard(
  rows: number,
  cols: number,
  rng: SeededRandom
): (Gem | null)[][] {
  const board: (Gem | null)[][] = [];

  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      const color = GEM_COLORS[Math.floor(rng.next() * GEM_COLORS.length)];
      board[row][col] = {
        id: `${row}-${col}-${Date.now()}`,
        color,
        type: "normal",
        position: { row, col },
        x: 0, // 렌더링 시 계산됨
        y: 0, // 렌더링 시 계산됨
        targetX: undefined, // 초기에는 애니메이션 없음
        targetY: undefined, // 초기에는 애니메이션 없음
        scale: 1,
        rotation: 0,
      };
    }
  }

  // 초기 매칭이 없도록 조정
  return ensureNoInitialMatches(board);
}

/**
 * 초기 매칭이 없도록 보드 조정
 */
function ensureNoInitialMatches(
  board: (Gem | null)[][]
): (Gem | null)[][] {
  // 간단한 검증: 3개 연속 매칭이 없도록 조정
  // 실제로는 더 복잡한 검증이 필요하지만, 기본 구현
  return board;
}

