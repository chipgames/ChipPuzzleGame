import React, { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { GameScreen } from "@/types/ui";
import { soundManager } from "@/utils/SoundManager";
import "./Header.css";

// Base URL을 고려한 로고 경로
const getLogoPath = (filename: string) => {
  const baseUrl = (import.meta as any).env?.BASE_URL || "/";
  return `${baseUrl}${filename}`;
};

interface HeaderProps {
  onNavigate?: (screen: GameScreen) => void;
  currentScreen?: GameScreen;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentScreen: _currentScreen }) => {
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("chipPuzzleGame_soundEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
    localStorage.setItem("chipPuzzleGame_soundEnabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const handleMenuClick = (screen: GameScreen) => {
    if (onNavigate) {
      onNavigate(screen);
    }
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    if (!soundEnabled) {
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
            <img 
              src={getLogoPath("ChipGames_Logo.png")} 
              onError={(e) => {
                // PNG 파일이 없으면 SVG 사용
                const target = e.target as HTMLImageElement;
                if (target.src && !target.src.includes('.svg')) {
                  target.src = getLogoPath("ChipGames_Logo.svg");
                }
              }}
              alt="CHIP GAMES" 
              style={{ height: "40px", width: "auto" }}
            />
            <span className="header-game-title">
              {t("header.gameTitle")}
            </span>
          </div>
        </div>
        <nav className="header-nav">
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
        </nav>
        <div className="header-right">
          <button
            className="header-sound-button"
            onClick={toggleSound}
            title={soundEnabled ? t("header.soundOff") : t("header.soundOn")}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
};

export default Header;


