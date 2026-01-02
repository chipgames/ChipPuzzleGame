import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import "./AboutScreen.css";

interface AboutScreenProps {
  onNavigate: (screen: "menu" | "stageSelect" | "game" | "guide" | "help" | "about") => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate: _onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="about-screen">
      <div className="about-content">
        <h1 className="about-title">{t("about.title")}</h1>
        <div className="about-text">
          <p>{t("about.description")}</p>
          <div className="about-section">
            <h3>{t("about.section1Title")}</h3>
            <p>{t("about.section1Content")}</p>
          </div>
          <div className="about-section">
            <h3>{t("about.section2Title")}</h3>
            <p>{t("about.section2Content")}</p>
          </div>
          <div className="about-section">
            <h3>{t("about.section3Title")}</h3>
            <p>{t("about.section3Content")}</p>
          </div>
          <div className="about-section">
            <h3>{t("about.section4Title")}</h3>
            <p>{t("about.section4Content")}</p>
          </div>
          <div className="about-section">
            <h3>{t("about.section5Title")}</h3>
            <p>{t("about.section5Content")}</p>
          </div>
          <div className="about-section">
            <h3>{t("about.section6Title")}</h3>
            <p>{t("about.section6Content")}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;

