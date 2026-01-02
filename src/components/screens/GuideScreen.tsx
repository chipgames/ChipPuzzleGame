import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./GuideScreen.css";

interface GuideScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help") => void;
}

const GuideScreen: React.FC<GuideScreenProps> = ({ onNavigate: _onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="guide-screen">
      <div className="guide-content">
        <h1 className="guide-title">{t("guide.title")}</h1>
        <div className="guide-text">
          <p>{t("guide.description")}</p>
          <h3>{t("guide.howToPlay")}</h3>
          <ol>
            <li>{t("guide.step1")}</li>
            <li>{t("guide.step2")}</li>
            <li>{t("guide.step3")}</li>
            <li>{t("guide.step4")}</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default GuideScreen;









