import React, { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import GameBoard from "@/components/game/GameBoard";
import { GameScreen } from "@/types/ui";
import { initializeAdSense, setupAdObserver, preventAdSenseErrors } from "@/utils/adsense";
import "@/styles/App.css";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("stageSelect");
  const [currentStage, setCurrentStage] = useState<number | null>(null);

  // AdSense 초기화
  useEffect(() => {
    // DOM 로드 후 AdSense 초기화
    preventAdSenseErrors();
    initializeAdSense();
    setupAdObserver();
  }, []);

  const handleNavigate = (screen: GameScreen) => {
    setCurrentScreen(screen);
  };

  const handleStartStage = (stageNumber: number) => {
    setCurrentStage(stageNumber);
    setCurrentScreen("game");
  };


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

