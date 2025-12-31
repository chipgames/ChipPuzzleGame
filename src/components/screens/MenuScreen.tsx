import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./MenuScreen.css";

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
            src="/ChipGames_Logo.png" 
            onError={(e) => {
              // PNG 파일이 없으면 SVG 사용
              const target = e.target as HTMLImageElement;
              if (target.src && !target.src.includes('.svg')) {
                target.src = '/ChipGames_Logo.svg';
              }
            }}
            alt="CHIP GAMES" 
            className="menu-logo"
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









