import { Gem } from "@/types/gem";
import { StageConfig } from "@/types/stage";
import { GEM_COLORS } from "@/constants/gemConfig";
import { findMatches } from "./matchDetection";

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
 * 목표 점수 계산 (개선된 밸런스)
 */
function calculateTargetScore(stageNumber: number): number {
  // 초기 스테이지는 낮은 점수, 후반부는 높은 점수
  const baseScore = 1000;
  const stageMultiplier = 50;
  const difficultyBonus = Math.floor(stageNumber / 100) * 500; // 100스테이지마다 보너스
  
  return baseScore + stageNumber * stageMultiplier + difficultyBonus;
}

/**
 * 최대 이동 횟수 계산 (개선된 밸런스)
 */
function calculateMaxMoves(stageNumber: number): number {
  // 초기: 50회, 점진적으로 감소하되 최소 20회 유지
  const baseMoves = 50;
  const reduction = Math.floor(stageNumber / 20);
  const minMoves = 20;
  
  // 후반부 스테이지는 더 빠르게 감소
  if (stageNumber > 500) {
    return Math.max(minMoves, baseMoves - reduction - Math.floor((stageNumber - 500) / 10));
  }
  
  return Math.max(minMoves, baseMoves - reduction);
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

  // 초기 매칭이 없도록 조정 (시드 기반 랜덤 전달)
  return ensureNoInitialMatches(board, rng);
}

/**
 * 초기 매칭이 없도록 보드 조정 (시드 기반 랜덤 사용)
 */
function ensureNoInitialMatches(
  board: (Gem | null)[][],
  rng?: SeededRandom
): (Gem | null)[][] {
  const maxAttempts = 100; // 최대 시도 횟수
  let attempts = 0;
  
  // 시드 기반 랜덤이 없으면 일반 랜덤 사용
  const getRandom = rng 
    ? () => rng.next() 
    : () => Math.random();
  
  try {
    while (attempts < maxAttempts) {
      const matches = findMatches(board);
      
      if (matches.length === 0) {
        // 매칭이 없으면 완료
        return board;
      }
      
      // 매칭이 있으면 해당 위치의 색상 변경
      for (const match of matches) {
        for (const pos of match.positions) {
          const gem = board[pos.row]?.[pos.col];
          if (gem) {
            // 다른 색상으로 변경
            const currentColorIndex = GEM_COLORS.indexOf(gem.color);
            const availableColors = GEM_COLORS.filter((_, idx) => idx !== currentColorIndex);
            
            if (availableColors.length === 0) {
              // 사용 가능한 색상이 없으면 스킵
              continue;
            }
            
            // 인접한 젬의 색상도 고려하여 다른 색상 선택
            let newColor = gem.color;
            let colorAttempts = 0;
            
            while (colorAttempts < 10 && newColor === gem.color) {
              const randomIndex = Math.floor(getRandom() * availableColors.length);
              const randomColor = availableColors[randomIndex];
              
              // 인접한 젬과 같은 색상이 아닌지 확인
              const neighbors = [
                board[pos.row - 1]?.[pos.col],
                board[pos.row + 1]?.[pos.col],
                board[pos.row]?.[pos.col - 1],
                board[pos.row]?.[pos.col + 1],
              ].filter(Boolean);
              
              const hasSameColorNeighbor = neighbors.some(n => n?.color === randomColor);
              
              if (!hasSameColorNeighbor) {
                newColor = randomColor;
              } else {
                colorAttempts++;
              }
            }
            
            if (newColor === gem.color && availableColors.length > 0) {
              newColor = availableColors[0];
            }
            
            gem.color = newColor;
          }
        }
      }
      
      attempts++;
    }
  } catch (error) {
    console.error("Error in ensureNoInitialMatches:", error);
    // 에러 발생 시 현재 보드 반환
  }
  
  // 최대 시도 횟수를 초과해도 매칭이 있으면 그대로 반환
  // (극히 드문 경우)
  return board;
}

