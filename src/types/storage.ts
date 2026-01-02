import { StageRecord } from "./stage";

/**
 * 게임 진행 상황 데이터 구조
 */
export interface GameProgress {
  highestStage: number;
  stageRecords: Record<string, StageRecord>;
}

/**
 * LocalStorage에 저장되는 전체 데이터 구조
 */
export interface StorageData {
  version: string;
  progress: GameProgress;
  settings?: {
    language?: string;
    soundEnabled?: boolean;
    orientationPreference?: string;
  };
}

