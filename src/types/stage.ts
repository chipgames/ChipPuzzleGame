import { Gem } from "./gem";
import { Goal } from "./game";

export interface StageConfig {
  stageNumber: number;
  gridSize: { rows: number; cols: number };
  targetScore: number;
  maxMoves: number;
  goals: Goal[];
  obstacles?: any[];
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


