import { useState, useCallback, useRef, useEffect } from "react";
import { GameState } from "@/types/game";
import { Gem } from "@/types/gem";
import { StageConfig } from "@/types/stage";
import { generateStage } from "@/utils/stageGenerator";
import { findMatches } from "@/utils/matchDetection";
import { applyGravity } from "@/utils/gravity";
import { prioritizeSpecialGems, SpecialGemInfo } from "@/utils/specialGem";
import { activateSpecialGem } from "@/utils/specialGemEffects";

export const useGameState = (stageNumber: number) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const stageConfig = generateStage(stageNumber);
    
    return {
      board: stageConfig.initialBoard || [],
      score: 0,
      moves: stageConfig.maxMoves,
      goals: stageConfig.goals,
      isGameOver: false,
      isPaused: false,
      currentStage: stageNumber,
      isAnimating: false,
      selectedGem: null,
    };
  });

  // stageNumber가 변경되면 게임 상태 재초기화
  useEffect(() => {
    const stageConfig = generateStage(stageNumber);
    setGameState({
      board: stageConfig.initialBoard || [],
      score: 0,
      moves: stageConfig.maxMoves,
      goals: stageConfig.goals,
      isGameOver: false,
      isPaused: false,
      currentStage: stageNumber,
      isAnimating: false,
      selectedGem: null,
    });
  }, [stageNumber]);

  const selectedGemRef = useRef<{ row: number; col: number } | null>(null);

  /**
   * 젬 선택
   */
  const selectGem = useCallback((row: number, col: number) => {
    setGameState((prev) => {
      if (prev.isGameOver) return prev;
      
      const newSelectedGem = prev.selectedGem?.row === row && prev.selectedGem?.col === col
        ? null
        : { row, col };
      
      selectedGemRef.current = newSelectedGem;
      
      return {
        ...prev,
        selectedGem: newSelectedGem,
      };
    });
  }, []);

  /**
   * 젬 교환
   */
  const swapGems = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    setGameState((prev) => {
      if (prev.isGameOver) return prev;
      if (prev.moves <= 0) return prev;
      // 애니메이션 중이어도 새로운 스와이프는 허용 (사용자 입력 우선)

      // 인접한 젬인지 확인
      const rowDiff = Math.abs(from.row - to.row);
      const colDiff = Math.abs(from.col - to.col);
      if (!((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1))) {
        return prev;
      }

      // 보드 복사
      const newBoard = prev.board.map((row) => row.map((gem) => gem ? { ...gem } : null));
      
      // 젬 교환
      const temp = newBoard[from.row][from.col];
      newBoard[from.row][from.col] = newBoard[to.row][to.col];
      newBoard[to.row][to.col] = temp;

      // 위치 업데이트
      if (newBoard[from.row][from.col]) {
        newBoard[from.row][from.col]!.position = { ...from };
      }
      if (newBoard[to.row][to.col]) {
        newBoard[to.row][to.col]!.position = { ...to };
      }

      // 매칭 확인
      const matches = findMatches(newBoard);
      
      if (matches.length === 0) {
        // 매칭이 없으면 되돌리기
        return prev;
      }

      // 특수 젬 생성 확인
      const specialGems = prioritizeSpecialGems(matches);
      
      // 특수 젬 적용
      for (const specialGem of specialGems) {
        const gem = newBoard[specialGem.position.row]?.[specialGem.position.col];
        if (gem) {
          gem.type = specialGem.type;
          if (specialGem.stripedDirection) {
            gem.stripedDirection = specialGem.stripedDirection;
          }
        }
      }

      // 매칭이 있으면 처리 (항상 isAnimating을 true로 설정)
      return {
        ...prev,
        board: newBoard,
        moves: prev.moves - 1,
        isAnimating: true, // 새로운 매칭 시작
        selectedGem: null,
      };
    });
  }, []);

  /**
   * 매칭 제거 및 중력 적용
   */
  const processMatches = useCallback(() => {
    setGameState((prev) => {
      if (!prev.isAnimating) return prev;

      // 현재 보드에서 매칭 찾기
      const matches = findMatches(prev.board);
      if (matches.length === 0) {
        // 매칭이 없으면 애니메이션 종료
        return {
          ...prev,
          isAnimating: false,
        };
      }

      // 보드 복사
      const boardCopy = prev.board.map((row) =>
        row.map((gem) => (gem ? { ...gem } : null))
      );

      // 매칭된 위치를 모두 제거
      const removeSet = new Set<string>();
      for (const match of matches) {
        for (const pos of match.positions) {
          removeSet.add(`${pos.row},${pos.col}`);
        }
      }

      for (const key of removeSet) {
        const [rowStr, colStr] = key.split(",");
        const r = Number(rowStr);
        const c = Number(colStr);
        if (!Number.isNaN(r) && !Number.isNaN(c) && boardCopy[r]) {
          boardCopy[r][c] = null;
        }
      }

      // 중력 적용 (cellSize는 나중에 렌더링 시 계산되므로 임시로 50 사용)
      const boardAfterGravity = applyGravity(boardCopy, 50);
      
      // 중력 적용 후 새로운 매칭 확인
      const newMatches = findMatches(boardAfterGravity);
      const hasNewMatches = newMatches.length > 0;

      // 점수 계산
      const matchScore = matches.reduce(
        (sum, match) => sum + match.positions.length * 10,
        0
      );
      const newScore = prev.score + matchScore;

      // 목표 업데이트
      const totalScore = matchScore;
      const newGoals = prev.goals.map((goal) => {
        if (goal.type === "score") {
          return {
            ...goal,
            current: Math.min(goal.current + totalScore, goal.target),
          };
        }
        return goal;
      });

      // 게임 클리어 확인
      const isCleared = newGoals.every((goal) => goal.current >= goal.target);
      
      // 게임 오버 확인 (이동 횟수 소진)
      const isGameOver = prev.moves <= 0 && !isCleared;

      return {
        ...prev,
        board: boardAfterGravity,
        score: newScore,
        goals: newGoals,
        isGameOver: isGameOver || prev.isGameOver,
        isAnimating: hasNewMatches && !isCleared && !isGameOver, // 새로운 매칭이 있으면 계속 애니메이션
      };
    });
  }, []);

  return {
    gameState,
    selectGem,
    swapGems,
    processMatches,
  };
};

