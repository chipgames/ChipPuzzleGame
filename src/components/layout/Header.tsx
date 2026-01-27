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

const Header: React.FC<HeaderProps> = memo(({ onNavigate, currentScreen: _currentScreen }) => {
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return storageManager.get<boolean>("chipPuzzleGame_soundEnabled", {
      fallback: true,
      silent: true,
    }) ?? true;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  const showBackButton = false; // 가이드, 도움말 화면에서도 뒤로 버튼 표시 안 함

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


