import { useState, useEffect } from "react";
import { LanguageService } from "@/services/LanguageService";
import type { SupportedLanguage } from "@/constants/languages";

const translationsCache: Record<string, any> = {};

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
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // 폴백: 영어 로드
        try {
          const fallback = await import(`../locales/en.json`);
          setTranslations(fallback.default);
        } catch (fallbackError) {
          console.error("Failed to load fallback translations:", fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();

    // 언어 변경 이벤트 리스너
    const handleLanguageChange = (event: CustomEvent) => {
      setLanguageState(event.detail);
    };

    window.addEventListener("languageChanged" as any, handleLanguageChange);

    return () => {
      window.removeEventListener("languageChanged" as any, handleLanguageChange);
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


