import React, { useState, useEffect, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import OptimizedImage from "@/components/ui/OptimizedImage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { GameScreen } from "@/types/ui";
import { soundManager } from "@/utils/SoundManager";
import { storageManager } from "@/utils/storage";
import "./Header.css";

interface HeaderProps {
  onNavigate?: (screen: GameScreen) => void;
  currentScreen?: GameScreen;
}

// PWA 설치 프롬프트 타입 정의
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Header: React.FC<HeaderProps> = memo(({ onNavigate, currentScreen: _currentScreen }) => {
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return storageManager.get<boolean>("chipPuzzleGame_soundEnabled", {
      fallback: true,
      silent: true,
    }) ?? true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    storageManager.set("chipPuzzleGame_soundEnabled", soundEnabled, {
      silent: true,
    });
  }, [soundEnabled]);

  // 모바일 메뉴가 열렸을 때 스크롤 방지
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // 모바일 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isMobileMenuOpen &&
        !target.closest(".header-nav") &&
        !target.closest(".header-hamburger")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [isMobileMenuOpen]);

  // PWA 설치 프롬프트 캡처 및 iOS/Standalone 감지
  useEffect(() => {
    // iOS 감지
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    // 이미 설치되어 있는지 확인
    const isStandaloneMode = 
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches ||
      document.referrer.includes("android-app://");
    setIsStandalone(isStandaloneMode);

    // Android PWA 설치 프롬프트 캡처
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleMenuClick = (screen: GameScreen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
    // 모바일 메뉴 클릭 시 메뉴 닫기
    setIsMobileMenuOpen(false);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
      soundManager.playClick();
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (soundEnabled) {
      soundManager.playClick();
    }
  };

  // PWA 설치 핸들러
  const handleInstallClick = async () => {
    if (soundEnabled) {
      soundManager.playClick();
    }

    // Android: 설치 프롬프트 표시
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error("PWA 설치 프롬프트 오류:", error);
      }
    } else if (isIOS) {
      // iOS: 안내 메시지 표시
      alert(
        "홈 화면에 추가하려면:\n\n" +
        "1. Safari 하단의 공유 버튼(□↑)을 클릭하세요\n" +
        "2. '홈 화면에 추가'를 선택하세요\n" +
        "3. '추가' 버튼을 클릭하세요"
      );
    } else {
      // 기타: 일반 안내
      alert(
        "홈 화면에 추가하려면:\n\n" +
        "Android: 브라우저 메뉴(⋮) → '홈 화면에 추가' 또는 '앱 설치'\n" +
        "iOS: Safari 공유 버튼(□↑) → '홈 화면에 추가'"
      );
    }

    // 메뉴 닫기
    setIsMobileMenuOpen(false);
  };

  const showBackButton = false; // 가이드, 도움말 화면에서도 뒤로 버튼 표시 안 함
  
  // 설치 버튼 표시 여부 (모바일이고, 설치되지 않았을 때만)
  const showInstallButton = typeof window !== "undefined" && 
    window.innerWidth <= 768 && 
    !isStandalone && 
    (deferredPrompt !== null || isIOS);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {showBackButton && (
            <button 
              className="header-back-button"
              onClick={() => handleMenuClick("menu")}
            >
              ← {t("common.back")}
            </button>
          )}
          <div 
            className="header-logo" 
            onClick={() => handleMenuClick("stageSelect")}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "12px" }}
          >
            <OptimizedImage
              src="ChipGames_Logo.png"
              alt={t("header.gameTitle") + " - CHIP GAMES 로고"}
              style={{ height: "40px", width: "auto" }}
              loading="eager"
              width="120"
              height="40"
            />
            <span className="header-game-title">
              {t("header.gameTitle")}
            </span>
          </div>
        </div>
        {/* 모바일 메뉴 오버레이 */}
        {isMobileMenuOpen && (
          <div 
            className="header-nav-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
        <nav className={`header-nav ${isMobileMenuOpen ? "mobile-open" : ""}`}>
          <button 
            className="header-nav-button"
            onClick={() => handleMenuClick("stageSelect")}
          >
            {t("header.playGame")}
          </button>
          <button 
            className="header-nav-button"
            onClick={() => handleMenuClick("guide")}
          >
            {t("header.guide")}
          </button>
          <button 
            className="header-nav-button"
            onClick={() => handleMenuClick("help")}
          >
            {t("header.help")}
          </button>
          <button 
            className="header-nav-button"
            onClick={() => handleMenuClick("about")}
          >
            {t("header.about")}
          </button>
          {/* 모바일에서만 홈 화면 추가/앱 설치 버튼 표시 */}
          {showInstallButton && (
            <>
              <div className="header-nav-divider" />
              <button 
                className="header-nav-button header-install-button"
                onClick={handleInstallClick}
              >
                <span className="install-icon">📱</span>
                <span>{isIOS ? "홈 화면에 추가" : "앱 설치"}</span>
              </button>
            </>
          )}
        </nav>
        <div className="header-right">
          <ThemeToggle />
          <button
            className="header-sound-button"
            onClick={toggleSound}
            title={soundEnabled ? t("header.soundOff") : t("header.soundOn")}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <LanguageSelector />
          <button
            className="header-hamburger"
            onClick={toggleMobileMenu}
            aria-label="메뉴"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}></span>
            <span className={`hamburger-line ${isMobileMenuOpen ? "active" : ""}`}></span>
          </button>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;


