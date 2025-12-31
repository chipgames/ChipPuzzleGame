import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./HelpScreen.css";

interface HelpScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help") => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="help-screen">
      <div className="help-content">
        <button 
          className="back-button"
          onClick={() => onNavigate("menu")}
        >
          ← {t("common.back")}
        </button>
        <h1 className="help-title">{t("help.title")}</h1>
        <div className="help-text">
          <p>{t("help.description")}</p>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;









