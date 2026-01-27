import React, { useState, useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GameContainer from "@/components/layout/GameContainer";
import GameBoard from "@/components/game/GameBoard";
import SEOHead from "@/components/seo/SEOHead";
import { GameScreen } from "@/types/ui";
import { useTheme } from "@/hooks/useTheme";
import { setupAdObserver, preventAdSenseErrors } from "@/utils/adsense";
import { getWebVitals, logWebVitals } from "@/utils/webVitals";
import { registerServiceWorker } from "@/utils/serviceWorker";
import "@/styles/App.css";
import "@/styles/UIHideButton.css";
import "@/styles/OrientationLockButton.css";

// Lazy loading for large components
const GuideScreen = lazy(() => import("@/components/screens/GuideScreen"));
const HelpScreen = lazy(() => import("@/components/screens/HelpScreen"));
const AboutScreen = lazy(() => import("@/components/screens/AboutScreen"));

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>("stageSelect");
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [isUIHidden, setIsUIHidden] = useState<boolean>(() => {
    // localStorage에서 UI 숨김 상태 불러오기
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chipPuzzleGame_uiHidden");
      return saved === "true";
    }
    return false;
  });

  const [isOrientationLocked, setIsOrientationLocked] = useState<boolean>(() => {
    // localStorage에서 화면 고정 상태 불러오기
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chipPuzzleGame_orientationLocked");
      return saved === "true";
    }
    return false;
  });
  
  // 테마 초기화
  useTheme();

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
      // AdSense 스크립트가 이미 index.html에 로드되어 있으므로
      // 자동으로 초기화됩니다. 중복 초기화를 방지하기 위해
      // initializeAdSense()는 호출하지 않습니다.
      // 대신 오류 방지와 접근성 개선만 수행합니다.
      preventAdSenseErrors();
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

  // Service Worker 등록
  useEffect(() => {
    registerServiceWorker();
  }, []);

  const handleNavigate = (screen: GameScreen) => {
    setCurrentScreen(screen);
  };

  const handleStartStage = (stageNumber: number) => {
    setCurrentStage(stageNumber);
    setCurrentScreen("game");
  };

  // UI 숨김/표시 토글
  const toggleUI = () => {
    const newState = !isUIHidden;
    setIsUIHidden(newState);
    localStorage.setItem("chipPuzzleGame_uiHidden", String(newState));
  };

  // 화면 고정 토글
  const toggleOrientationLock = async () => {
    if (typeof window === "undefined" || !screen.orientation) {
      alert("이 브라우저는 화면 고정을 지원하지 않습니다.");
      return;
    }

    try {
      if (isOrientationLocked) {
        // 화면 고정 해제
        await (screen.orientation as any).unlock();
        setIsOrientationLocked(false);
        localStorage.setItem("chipPuzzleGame_orientationLocked", "false");
      } else {
        // 전체화면 모드 진입 시도 (화면 고정이 더 잘 작동함)
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).mozRequestFullScreen) {
            await (document.documentElement as any).mozRequestFullScreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        } catch (fullscreenError) {
          // 전체화면 실패해도 계속 진행
          console.warn("전체화면 모드 진입 실패:", fullscreenError);
        }

        // 현재 화면 방향에 따라 고정
        const currentOrientation = screen.orientation.type;
        let lockType: "portrait" | "landscape" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary" | "any" = "any";
        
        // 현재 방향에 따라 적절한 고정 타입 선택
        if (currentOrientation.startsWith("portrait")) {
          lockType = "portrait";
        } else if (currentOrientation.startsWith("landscape")) {
          lockType = "landscape";
        }
        
        await (screen.orientation as any).lock(lockType);
        setIsOrientationLocked(true);
        localStorage.setItem("chipPuzzleGame_orientationLocked", "true");
      }
    } catch (error: unknown) {
      // 화면 고정이 지원되지 않거나 실패한 경우
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn("화면 고정 실패:", errorMessage);
      
      // 사용자에게 안내
      if (errorMessage.includes("not allowed") || errorMessage.includes("denied")) {
        alert("화면 고정을 사용하려면 전체화면 모드가 필요합니다. 또는 브라우저 설정에서 화면 회전을 허용해주세요.");
      } else {
        alert("화면 고정을 지원하지 않거나 사용할 수 없습니다.");
      }
    }
  };

  // 화면 고정 상태 초기화
  useEffect(() => {
    if (typeof window === "undefined" || !screen.orientation) {
      return;
    }

    // 저장된 화면 고정 상태 복원
    if (isOrientationLocked) {
      const currentOrientation = screen.orientation.type;
      let lockType: "portrait" | "landscape" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary" | "any" = "any";
      
      if (currentOrientation.startsWith("portrait")) {
        lockType = "portrait";
      } else if (currentOrientation.startsWith("landscape")) {
        lockType = "landscape";
      }
      
      (screen.orientation as any).lock(lockType).catch((error: unknown) => {
        console.warn("화면 고정 복원 실패:", error);
        setIsOrientationLocked(false);
        localStorage.setItem("chipPuzzleGame_orientationLocked", "false");
      });
    }
  }, []);

  // 모바일 여부 확인 (가로/세로 모드 모두 고려)
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    // 터치 지원 여부 또는 화면 크기로 판단
    return (
      window.innerWidth <= 768 ||
      window.innerHeight <= 768 ||
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  });

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      if (typeof window === "undefined") return;
      setIsMobile(
        window.innerWidth <= 768 ||
        window.innerHeight <= 768 ||
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)
      );
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

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
        {!isUIHidden && <Header onNavigate={handleNavigate} currentScreen={currentScreen} />}
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
        {!isUIHidden && <Footer />}
        {/* 모바일에서만 UI 숨김/표시 토글 버튼 */}
        {isMobile && (
          <>
            <button
              className="ui-toggle-button"
              onClick={toggleUI}
              aria-label={isUIHidden ? "UI 표시" : "UI 숨김"}
              title={isUIHidden ? "메뉴 및 푸터 표시" : "메뉴 및 푸터 숨김"}
            >
              {isUIHidden ? "👁️" : "🙈"}
            </button>
            {/* 화면 고정 토글 버튼 */}
            {typeof window !== "undefined" && screen.orientation && (
              <button
                className="orientation-lock-button"
                onClick={toggleOrientationLock}
                aria-label={isOrientationLocked ? "화면 고정 해제" : "화면 고정"}
                title={isOrientationLocked ? "화면 고정 해제" : "화면 고정"}
              >
                {isOrientationLocked ? "🔒" : "🔓"}
              </button>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;

