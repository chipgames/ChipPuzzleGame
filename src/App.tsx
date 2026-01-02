import React, { useState, useEffect } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import GameBoard from "@/components/game/GameBoard";
import SEOHead from "@/components/seo/SEOHead";
import { GameScreen } from "@/types/ui";
import { initializeAdSense, setupAdObserver, preventAdSenseErrors } from "@/utils/adsense";
import "@/styles/App.css";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("stageSelect");
  const [currentStage, setCurrentStage] = useState<number | null>(null);

  // AdSense 초기화 (프로덕션 환경에서만)
  useEffect(() => {
    // 개발 환경에서는 AdSense 초기화를 건너뜀
    let isDev = false;
    try {
      // @ts-ignore - Vite의 import.meta.env는 런타임에 사용 가능
      isDev = import.meta.env?.DEV || false;
    } catch {
      // import.meta.env를 사용할 수 없는 경우 hostname으로 확인
    }
    
    if (!isDev) {
      isDev = window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1" ||
              window.location.hostname.includes("localhost");
    }
    
    if (!isDev) {
      // DOM 로드 후 AdSense 초기화
      preventAdSenseErrors();
      initializeAdSense();
      setupAdObserver();
    }
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
      <SEOHead />
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

