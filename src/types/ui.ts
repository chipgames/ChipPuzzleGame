export type GameScreen = "menu" | "stageSelect" | "game" | "guide" | "help";

export interface ScreenState {
  currentScreen: GameScreen;
  previousScreen?: GameScreen;
}
