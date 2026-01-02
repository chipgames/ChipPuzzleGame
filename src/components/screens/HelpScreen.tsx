import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./HelpScreen.css";

interface HelpScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help" | "about") => void;
}

const HelpScreen: React.FC<HelpScreenProps> = ({ onNavigate: _onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="help-screen">
      <div className="help-content">
        <h1 className="help-title">{t("help.title")}</h1>
        <div className="help-text">
          <p>{t("help.description")}</p>
          <div className="help-section">
            <h3>{t("help.section1Title")}</h3>
            <p>{t("help.section1Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section2Title")}</h3>
            <p>{t("help.section2Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section3Title")}</h3>
            <p>{t("help.section3Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section4Title")}</h3>
            <p>{t("help.section4Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section5Title")}</h3>
            <p>{t("help.section5Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section6Title")}</h3>
            <p>{t("help.section6Content")}</p>
          </div>
          <div className="help-section">
            <h3>{t("help.section7Title")}</h3>
            <p>{t("help.section7Content")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;









