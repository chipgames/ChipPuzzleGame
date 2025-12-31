import { GameState } from "@/types/game";

/**
 * 별점 계산 (0~3)
 */
export function calculateStarRating(gameState: GameState): number {
  const { score, goals, moves } = gameState;
  
  if (goals.length === 0) return 0;
  
  const goal = goals[0];
  if (goal.current < goal.target) return 0; // 목표 미달성
  
  // 목표 달성률 계산 (100% 이상)
  const completionRate = goal.current / goal.target;
  
  // 이동 횟수 보너스 (남은 이동 횟수가 많을수록 높은 점수)
  const movesBonus = moves / 50; // 최대 50 이동 기준
  
  // 점수 보너스
  const scoreBonus = Math.min(score / (goal.target * 2), 1); // 목표의 2배 이상이면 만점
  
  // 별점 계산
  let stars = 0;
  
  if (completionRate >= 1.0) {
    stars = 1; // 최소 1스타
    
    if (completionRate >= 1.2 || movesBonus >= 0.5) {
      stars = 2; // 2스타
    }
    
    if (completionRate >= 1.5 && movesBonus >= 0.6 && scoreBonus >= 0.8) {
      stars = 3; // 3스타
    }
  }
  
  return Math.min(stars, 3);
}









