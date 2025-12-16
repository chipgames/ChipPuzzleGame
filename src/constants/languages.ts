export const SUPPORTED_LANGUAGES = ["en", "ko", "zh", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: "English",
  ko: "한국어",
  zh: "中文",
  ja: "日本語",
};


