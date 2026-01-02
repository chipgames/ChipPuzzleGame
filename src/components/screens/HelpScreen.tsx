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
          <section className="help-section">
            <h2>{t("help.section1Title")}</h2>
            <p>{t("help.section1Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section2Title")}</h2>
            <p>{t("help.section2Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section3Title")}</h2>
            <p>{t("help.section3Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section4Title")}</h2>
            <p>{t("help.section4Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section5Title")}</h2>
            <p>{t("help.section5Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section6Title")}</h2>
            <p>{t("help.section6Content")}</p>
          </section>
          <section className="help-section">
            <h2>{t("help.section7Title")}</h2>
            <p>{t("help.section7Content")}</p>
          </section>
        </div>
        <div className="help-related-links">
          <h2>{t("common.relatedPages") || "관련 페이지"}</h2>
          <nav aria-label={t("common.relatedPages") || "관련 페이지"}>
            <a 
              href="?screen=guide" 
              onClick={(e) => {
                e.preventDefault();
                _onNavigate("guide");
              }}
              className="help-link"
            >
              {t("header.guide")}
            </a>
            <a 
              href="?screen=about" 
              onClick={(e) => {
                e.preventDefault();
                _onNavigate("about");
              }}
              className="help-link"
            >
              {t("header.about")}
            </a>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;









