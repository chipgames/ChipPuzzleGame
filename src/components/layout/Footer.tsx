import React, { useState, useEffect, memo } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { soundManager } from "@/utils/SoundManager";
import { logger } from "@/utils/logger";
import "./Footer.css";

// 버전 정보 (빌드 시 주입됨)
declare const __APP_VERSION__: string;
const APP_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.1.0";

const Footer: React.FC = memo(() => {
  const { t } = useLanguage();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const handlePrivacyClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowPrivacyModal(true);
    soundManager.playClick();
    logger.info("Privacy policy modal opened");
  };

  const handleContactClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setShowContactModal(true);
    soundManager.playClick();
    logger.info("Contact modal opened");
  };

  const handleCloseModal = () => {
    setShowPrivacyModal(false);
    setShowContactModal(false);
    soundManager.playClick();
  };

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (showPrivacyModal || showContactModal)) {
        handleCloseModal();
      }
    };

    if (showPrivacyModal || showContactModal) {
      document.addEventListener("keydown", handleEscape);
      // 모달이 열려있을 때 body 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showPrivacyModal, showContactModal]);

  return (
    <>
      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <nav className="footer-links" aria-label={t("footer.navigation")}>
            <a
              href="#privacy"
              onClick={handlePrivacyClick}
              aria-label={t("footer.privacyPolicy")}
              className="footer-link"
            >
              {t("footer.privacyPolicy")}
            </a>
            <a
              href="#contact"
              onClick={handleContactClick}
              aria-label={t("footer.contactUs")}
              className="footer-link"
            >
              {t("footer.contactUs")}
            </a>
          </nav>
          <div className="footer-center">
            <LanguageSelector />
          </div>
          <div className="footer-copyright" aria-label={t("footer.copyright")}>
            {t("footer.copyright")} | v{APP_VERSION}
          </div>
        </div>
      </footer>

      {/* 개인정보처리방침 모달 */}
      {showPrivacyModal && (
        <div
          className="footer-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-modal-title"
        >
          <div className="footer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="footer-modal-header">
              <h2 id="privacy-modal-title">{t("footer.privacyPolicy")}</h2>
              <button
                className="footer-modal-close"
                onClick={handleCloseModal}
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>
            <div className="footer-modal-content">
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection1Title")}</h3>
                <p>{t("footer.privacySection1Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection2Title")}</h3>
                <p>{t("footer.privacySection2Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection3Title")}</h3>
                <p>{t("footer.privacySection3Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection4Title")}</h3>
                <p>{t("footer.privacySection4Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection5Title")}</h3>
                <p>{t("footer.privacySection5Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.privacySection6Title")}</h3>
                <p>{t("footer.privacySection6Content")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 문의하기 모달 */}
      {showContactModal && (
        <div
          className="footer-modal-overlay"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
        >
          <div className="footer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="footer-modal-header">
              <h2 id="contact-modal-title">{t("footer.contactUs")}</h2>
              <button
                className="footer-modal-close"
                onClick={handleCloseModal}
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>
            <div className="footer-modal-content">
              <div className="footer-modal-section">
                <h3>{t("footer.contactSection1Title")}</h3>
                <p>{t("footer.contactSection1Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.contactSection2Title")}</h3>
                <p>{t("footer.contactSection2Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.contactSection3Title")}</h3>
                <p>{t("footer.contactSection3Content")}</p>
              </div>
              <div className="footer-modal-section">
                <h3>{t("footer.contactSection4Title")}</h3>
                <p>{t("footer.contactSection4Content")}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

Footer.displayName = "Footer";

export default Footer;
