import React from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from "@/constants/languages";
import type { SupportedLanguage } from "@/constants/languages";

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="language-selector"
      aria-label="Language selector"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_NAMES[lang]}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;


