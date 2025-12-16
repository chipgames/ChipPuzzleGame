import { useState, useCallback } from "react";
import { GameScreen } from "@/types/ui";

export const useGameScreen = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("menu");
  const [previousScreen, setPreviousScreen] = useState<GameScreen | undefined>();

  const navigateTo = useCallback((screen: GameScreen) => {
    setPreviousScreen(currentScreen);
    setCurrentScreen(screen);
  }, [currentScreen]);

  const goBack = useCallback(() => {
    if (previousScreen) {
      setCurrentScreen(previousScreen);
      setPreviousScreen(undefined);
    } else {
      setCurrentScreen("menu");
    }
  }, [previousScreen]);

  return {
    currentScreen,
    previousScreen,
    navigateTo,
    goBack,
  };
};

