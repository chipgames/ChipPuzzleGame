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
          <section className="about-section">
            <h2>{t("about.section1Title")}</h2>
            <p>{t("about.section1Content")}</p>
          </section>
          <section className="about-section">
            <h2>{t("about.section2Title")}</h2>
            <p>{t("about.section2Content")}</p>
          </section>
          <section className="about-section">
            <h2>{t("about.section3Title")}</h2>
            <p>{t("about.section3Content")}</p>
          </section>
          <section className="about-section">
            <h2>{t("about.section4Title")}</h2>
            <p>{t("about.section4Content")}</p>
          </section>
          <section className="about-section">
            <h2>{t("about.section5Title")}</h2>
            <p>{t("about.section5Content")}</p>
          </section>
          <section className="about-section">
            <h2>{t("about.section6Title")}</h2>
            <p>{t("about.section6Content")}</p>
          </section>
        </div>
        <div className="about-related-links">
          <h2>{t("common.relatedPages") || "관련 페이지"}</h2>
          <nav aria-label={t("common.relatedPages") || "관련 페이지"}>
            <a 
              href="?screen=guide" 
              onClick={(e) => {
                e.preventDefault();
                _onNavigate("guide");
              }}
              className="about-link"
            >
              {t("header.guide")}
            </a>
            <a 
              href="?screen=help" 
              onClick={(e) => {
                e.preventDefault();
                _onNavigate("help");
              }}
              className="about-link"
            >
              {t("header.help")}
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;

