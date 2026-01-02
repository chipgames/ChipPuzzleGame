import { Gem } from "./gem";
import { Goal } from "./game";

export interface Obstacle {
  type: string;
  position: { row: number; col: number };
  [key: string]: unknown; // 확장 가능한 속성
}

export interface StageConfig {
  stageNumber: number;
  gridSize: { rows: number; cols: number };
  targetScore: number;
  maxMoves: number;
  goals: Goal[];
  obstacles?: Obstacle[];
  initialBoard?: (Gem | null)[][];
}

export interface StageRecord {
  stageNumber: number;
  stars: number;
  score: number;
  bestScore: number;
  completedAt: string;
  attempts: number;
}










