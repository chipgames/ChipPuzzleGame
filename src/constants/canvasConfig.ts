export interface CanvasConfig {
  aspectRatio: number; // 16:9 = 1.777...
  cellSize: number;
  gridRows: number;
  gridCols: number;
  pixelRatio: number;
  logicalWidth: number;
  logicalHeight: number;
}

export const DEFAULT_CANVAS_CONFIG: Partial<CanvasConfig> = {
  aspectRatio: 16 / 9,
  gridRows: 9,
  gridCols: 9,
  pixelRatio: window.devicePixelRatio || 1,
};


