import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import "./Footer.css";

// 버전 정보 (빌드 시 주입됨)
declare const __APP_VERSION__: string;
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.1.0";

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
        <div className="footer-copyright">
          {t("footer.copyright")} | v{APP_VERSION}
        </div>
      </div>
    </footer>
  );
};

export default Footer;










