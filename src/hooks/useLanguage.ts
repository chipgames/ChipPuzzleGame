import { useState, useEffect } from "react";
import { LanguageService } from "@/services/LanguageService";
import type { SupportedLanguage } from "@/constants/languages";
import { logger } from "@/utils/logger";

const translationsCache: Record<string, any> = {};

/**
 * 다국어 지원을 위한 Custom Hook
 * 
 * 언어 파일을 동적으로 로드하고, 번역 함수를 제공합니다.
 * 언어 변경 시 자동으로 새로운 번역 파일을 로드합니다.
 * 
 * @returns 언어 상태 및 번역 함수
 * 
 * @example
 * ```typescript
 * const { language, setLanguage, t } = useLanguage();
 * 
 * // 언어 변경
 * setLanguage("en");
 * 
 * // 번역 텍스트 가져오기
 * const title = t("header.gameTitle");
 * ```
 */
export const useLanguage = () => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const service = new LanguageService();
    return service.getCurrentLanguage();
  });
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 언어 파일 동적 로드
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // 캐시 확인
        if (translationsCache[language]) {
          setTranslations(translationsCache[language]);
          setIsLoading(false);
          return;
        }

        // 동적 import (Vite에서 지원)
        const module = await import(`../locales/${language}.json`);
        translationsCache[language] = module.default;
        setTranslations(module.default);
        logger.debug("Translations loaded", { language });
      } catch (error) {
        logger.error("Failed to load translations", { language, error });
        // 폴백: 영어 로드
        try {
          const fallback = await import(`../locales/en.json`);
          setTranslations(fallback.default);
          logger.info("Fallback translations loaded", { language: "en" });
        } catch (fallbackError) {
          logger.error("Failed to load fallback translations", {
            error: fallbackError,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();

    // 언어 변경 이벤트 리스너
    const handleLanguageChange = (event: CustomEvent<string>) => {
      setLanguageState(event.detail as SupportedLanguage);
    };

    window.addEventListener("languageChanged", handleLanguageChange as EventListener);

    return () => {
      window.removeEventListener("languageChanged", handleLanguageChange as EventListener);
    };
  }, [language]);

  const setLanguage = (lang: string) => {
    const service = new LanguageService();
    service.setLanguage(lang);
    // setLanguageState는 이벤트 리스너에서 업데이트됨
  };

  const t = (key: string): string => {
    if (isLoading || !translations) {
      return key; // 로딩 중이면 키 반환
    }

    const keys = key.split(".");
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return value || key;
  };

  return { language, setLanguage, t, isLoading };
};










