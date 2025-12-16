import React, { useState } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import GameBoard from "@/components/game/GameBoard";
import MenuScreen from "@/components/screens/MenuScreen";
import StageSelectScreen from "@/components/screens/StageSelectScreen";
import GuideScreen from "@/components/screens/GuideScreen";
import HelpScreen from "@/components/screens/HelpScreen";
import { GameScreen } from "@/types/ui";
import "@/styles/App.css";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("stageSelect");
  const [currentStage, setCurrentStage] = useState<number | null>(null);

  const handleNavigate = (screen: GameScreen) => {
    setCurrentScreen(screen);
  };

  const handleStartStage = (stageNumber: number) => {
    setCurrentStage(stageNumber);
    setCurrentScreen("game");
  };

  const renderOverlay = () => {
    switch (currentScreen) {
      case "menu":
        return <MenuScreen onNavigate={handleNavigate} />;
      case "stageSelect":
        return (
          <StageSelectScreen
            onNavigate={handleNavigate}
            onStartStage={handleStartStage}
          />
        );
      case "guide":
        return <GuideScreen onNavigate={handleNavigate} />;
      case "help":
        return <HelpScreen onNavigate={handleNavigate} />;
      default:
        return null;
    }
  };

  // 게임 화면이 아닐 때는 Canvas 위에 오버레이 표시
  const showOverlay = currentScreen !== "game";

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Header onNavigate={handleNavigate} currentScreen={currentScreen} />
        <GameContainer>
          <GameBoard 
            stageNumber={currentStage || 1} 
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            onStartStage={handleStartStage}
          />
        </GameContainer>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default App;

