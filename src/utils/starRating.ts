import { GameState } from "@/types/game";

/**
 * 별점 계산 (0~3)
 * 개선된 알고리즘: 더 공정하고 명확한 평가 기준
 */
export function calculateStarRating(gameState: GameState): number {
  const { score, goals, moves, currentStage } = gameState;
  
  if (goals.length === 0) return 0;
  
  const goal = goals[0];
  if (goal.current < goal.target) return 0; // 목표 미달성
  
  // 목표 달성률 계산 (100% 이상)
  const completionRate = goal.current / goal.target;
  
  // 스테이지별 기준 이동 횟수 (난이도 고려)
  const baseMoves = Math.max(20, 50 - Math.floor(currentStage / 20));
  const movesBonus = moves / baseMoves; // 남은 이동 횟수 비율
  
  // 점수 보너스 (목표 대비 점수)
  const scoreBonus = Math.min(score / (goal.target * 1.5), 1); // 목표의 1.5배 이상이면 만점
  
  // 별점 계산 (더 명확한 기준)
  let stars = 0;
  
  if (completionRate >= 1.0) {
    stars = 1; // 최소 1스타 (목표 달성)
    
    // 2스타 조건: 목표 120% 이상 또는 이동 횟수 40% 이상 남음
    if (completionRate >= 1.2 || movesBonus >= 0.4) {
      stars = 2;
    }
    
    // 3스타 조건: 목표 150% 이상, 이동 횟수 50% 이상, 점수 보너스 80% 이상
    if (completionRate >= 1.5 && movesBonus >= 0.5 && scoreBonus >= 0.8) {
      stars = 3;
    }
  }
  
  return Math.min(stars, 3);
}









