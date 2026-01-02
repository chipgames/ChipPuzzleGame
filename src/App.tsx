import React, { useState, useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import GameBoard from "@/components/game/GameBoard";
import SEOHead from "@/components/seo/SEOHead";
import { GameScreen } from "@/types/ui";
import { initializeAdSense, setupAdObserver, preventAdSenseErrors } from "@/utils/adsense";
import { getWebVitals, logWebVitals } from "@/utils/webVitals";
import "@/styles/App.css";

// Lazy loading for large components
const GuideScreen = lazy(() => import("@/components/screens/GuideScreen"));
const HelpScreen = lazy(() => import("@/components/screens/HelpScreen"));
const AboutScreen = lazy(() => import("@/components/screens/AboutScreen"));

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

  // Web Vitals 측정
  useEffect(() => {
    getWebVitals(logWebVitals);

    // 페이지 언로드 시 성능 리포트 로깅
    const handleBeforeUnload = () => {
      // 동적 import로 순환 참조 방지
      import("@/utils/performanceAnalytics").then(({ performanceAnalytics }) => {
        performanceAnalytics.logReport();
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const handleNavigate = (screen: GameScreen) => {
    setCurrentScreen(screen);
  };

  const handleStartStage = (stageNumber: number) => {
    setCurrentStage(stageNumber);
    setCurrentScreen("game");
  };

  // 페이지별 SEO 설정
  const getSEOProps = () => {
    const baseUrl = "https://chipgames.github.io/ChipPuzzleGame/";
    const lang = new URLSearchParams(window.location.search).get("lang") || "ko";
    const langParam = lang !== "ko" ? `?lang=${lang}` : "";
    
    switch (currentScreen) {
      case "guide":
        return {
          title: undefined, // SEOHead에서 다국어 처리
          description: undefined,
          keywords: undefined,
          url: `${baseUrl}?screen=guide${langParam}`,
          type: "article" as const,
        };
      case "help":
        return {
          title: undefined,
          description: undefined,
          keywords: undefined,
          url: `${baseUrl}?screen=help${langParam}`,
          type: "article" as const,
        };
      case "about":
        return {
          title: undefined,
          description: undefined,
          keywords: undefined,
          url: `${baseUrl}?screen=about${langParam}`,
          type: "article" as const,
        };
      default:
        return {
          title: undefined,
          description: undefined,
          keywords: undefined,
          url: `${baseUrl}${langParam}`,
          type: "website" as const,
        };
    }
  };

  return (
    <ErrorBoundary>
      <SEOHead {...getSEOProps()} />
      <div className="app-container">
        <Header onNavigate={handleNavigate} currentScreen={currentScreen} />
        <GameContainer>
          {currentScreen === "guide" ? (
            <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>로딩 중...</div>}>
              <GuideScreen onNavigate={handleNavigate} />
            </Suspense>
          ) : currentScreen === "help" ? (
            <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>로딩 중...</div>}>
              <HelpScreen onNavigate={handleNavigate} />
            </Suspense>
          ) : currentScreen === "about" ? (
            <Suspense fallback={<div style={{ padding: "20px", textAlign: "center" }}>로딩 중...</div>}>
              <AboutScreen onNavigate={handleNavigate} />
            </Suspense>
          ) : (
            <GameBoard 
              stageNumber={currentStage || 1} 
              currentScreen={currentScreen}
              onNavigate={handleNavigate}
              onStartStage={handleStartStage}
            />
          )}
        </GameContainer>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

export default App;

