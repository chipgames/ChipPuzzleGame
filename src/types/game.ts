import { Gem } from "./gem";

export interface Match {
  type: "horizontal" | "vertical";
  positions: { row: number; col: number }[];
}

export interface Goal {
  type: "score" | "collect" | "clearBlock" | "clearObstacle";
  target: number;
  current: number;
  gemColor?: string;
}

export interface GameState {
  board: (Gem | null)[][];
  score: number;
  moves: number;
  goals: Goal[];
  isGameOver: boolean;
  isPaused: boolean;
  currentStage: number;
  isAnimating: boolean;
  selectedGem: { row: number; col: number } | null;
}


