import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import "./Footer.css";

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-links">
          <a href="#privacy">{t("footer.privacyPolicy")}</a>
          <a href="#contact">{t("footer.contactUs")}</a>
        </div>
        <LanguageSelector />
        <div className="footer-copyright">{t("footer.copyright")}</div>
      </div>
    </footer>
  );
};

export default Footer;


