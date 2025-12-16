import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
} from "@/constants/languages";

export class LanguageService {
  private supportedLanguages = SUPPORTED_LANGUAGES;
  private defaultLanguage = DEFAULT_LANGUAGE;

  // 브라우저 언어 자동 감지
  public detectBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language.split("-")[0];

    if (this.supportedLanguages.includes(browserLang as SupportedLanguage)) {
      return browserLang as SupportedLanguage;
    }

    return this.defaultLanguage;
  }

  // LocalStorage에서 저장된 언어 불러오기
  public getStoredLanguage(): string | null {
    try {
      return localStorage.getItem("language");
    } catch (error) {
      console.error("Failed to get stored language:", error);
      return null;
    }
  }

  // 언어 설정
  public setLanguage(lang: string): void {
    if (this.supportedLanguages.includes(lang as SupportedLanguage)) {
      try {
        localStorage.setItem("language", lang);
        // 언어 변경 이벤트 발생
        window.dispatchEvent(
          new CustomEvent("languageChanged", { detail: lang })
        );
      } catch (error) {
        console.error("Failed to set language:", error);
      }
    }
  }

  // 현재 언어 가져오기
  public getCurrentLanguage(): SupportedLanguage {
    const stored = this.getStoredLanguage();
    if (stored && this.supportedLanguages.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }

    return this.detectBrowserLanguage();
  }
}


