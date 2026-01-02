import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./MenuScreen.css";

// Base URL을 고려한 로고 경로
const getLogoPath = (filename: string) => {
  const baseUrl = (import.meta as any).env?.BASE_URL || "/";
  return `${baseUrl}${filename}`;
};

interface MenuScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help") => void;
}

const MenuScreen: React.FC<MenuScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="menu-screen">
      <div className="menu-content">
        <div className="menu-logo-container">
          <img 
            src={getLogoPath("ChipGames_Logo.png")} 
            onError={(e) => {
              // PNG 파일이 없으면 SVG 사용
              const target = e.target as HTMLImageElement;
              if (target.src && !target.src.includes('.svg')) {
                target.src = getLogoPath("ChipGames_Logo.svg");
              }
            }}
            alt={t("menu.title") + " - CHIP GAMES 로고"} 
            className="menu-logo"
            loading="eager"
            width="200"
            height="200"
          />
        </div>
        <h1 className="menu-title">{t("menu.title")}</h1>
        <div className="menu-buttons">
          <button 
            className="menu-button primary"
            onClick={() => onNavigate("stageSelect")}
          >
            {t("menu.playGame")}
          </button>
          <button 
            className="menu-button"
            onClick={() => onNavigate("guide")}
          >
            {t("menu.guide")}
          </button>
          <button 
            className="menu-button"
            onClick={() => onNavigate("help")}
          >
            {t("menu.help")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MenuScreen;









