import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { GameScreen } from "@/types/ui";
import "./Header.css";

interface HeaderProps {
  onNavigate?: (screen: GameScreen) => void;
  currentScreen?: GameScreen;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentScreen }) => {
  const { t } = useLanguage();

  const handleMenuClick = (screen: GameScreen) => {
    if (onNavigate) {
      onNavigate(screen);
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
            style={{ cursor: "pointer" }}
          >
            {t("header.logo")}
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
        <LanguageSelector />
      </div>
    </header>
  );
};

export default Header;


