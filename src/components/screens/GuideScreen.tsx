import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./GuideScreen.css";

interface GuideScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help" | "about") => void;
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
          <h3>{t("guide.specialGemsTitle")}</h3>
          <p>{t("guide.specialGemsDescription")}</p>
          <ul>
            <li>{t("guide.specialGem1")}</li>
            <li>{t("guide.specialGem2")}</li>
            <li>{t("guide.specialGem3")}</li>
          </ul>
          <h3>{t("guide.strategyTitle")}</h3>
          <ul>
            <li>{t("guide.strategy1")}</li>
            <li>{t("guide.strategy2")}</li>
            <li>{t("guide.strategy3")}</li>
            <li>{t("guide.strategy4")}</li>
          </ul>
          <h3>{t("guide.tipsTitle")}</h3>
          <ul>
            <li>{t("guide.tip1")}</li>
            <li>{t("guide.tip2")}</li>
            <li>{t("guide.tip3")}</li>
            <li>{t("guide.tip4")}</li>
            <li>{t("guide.tip5")}</li>
            <li>{t("guide.tip6")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GuideScreen;









