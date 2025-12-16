export type GemColor = "red" | "yellow" | "blue" | "green" | "purple" | "orange";

export type GemType = "normal" | "striped" | "wrapped" | "colorBomb";

export interface Gem {
  id: string;
  color: GemColor;
  type: GemType;
  stripedDirection?: "horizontal" | "vertical";
  position: { row: number; col: number };
  x: number; // Canvas 좌표
  y: number; // Canvas 좌표
  targetX?: number; // 애니메이션 목표 X
  targetY?: number; // 애니메이션 목표 Y
  scale: number; // 스케일 애니메이션
  rotation: number; // 회전 애니메이션
  alpha?: number; // 알파 값 (제거 애니메이션용)
  isRemoving?: boolean; // 제거 중인지 여부
}


