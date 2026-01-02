import React from "react";
import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/hooks/useLanguage";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  url?: string;
  noindex?: boolean;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  keywords,
  image,
  type = "website",
  url = "https://chipgames.github.io/ChipPuzzleGame/",
  noindex = false,
}) => {
  const { language } = useLanguage();
  const { t } = useLanguage();

  // 기본값 설정
  const defaultTitle = t("seo.title") || "매칭 퍼즐 게임 - CHIP GAMES";
  const defaultDescription =
    t("seo.description") ||
    "무료 온라인 매칭 퍼즐 게임. 1000개의 도전적인 스테이지를 플레이하세요! 다양한 색상의 젬을 매칭하여 목표를 달성하는 재미있는 퍼즐 게임입니다.";
  const defaultKeywords =
    t("seo.keywords") ||
    "매칭게임, 퍼즐게임, 무료게임, 온라인게임, 퍼즐, 매칭3, 캔디크러시, 게임, 브라우저게임, HTML5게임";
  const defaultImage = "https://chipgames.github.io/ChipPuzzleGame/ChipGames_Logo.png";

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = image || defaultImage;

  // 구조화된 데이터 (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: finalTitle,
    description: finalDescription,
    image: finalImage,
    url: url,
    applicationCategory: "Game",
    operatingSystem: "Web Browser",
    gamePlatform: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      ratingCount: "100",
      bestRating: "5",
      worstRating: "1",
    },
    publisher: {
      "@type": "Organization",
      name: "CHIP GAMES",
      url: "https://chipgames.github.io",
    },
    genre: "Puzzle Game",
    gameItem: {
      "@type": "Thing",
      name: "Match Puzzle Game",
      description: "Match colorful gems to complete challenging stages",
    },
    inLanguage: language || "ko",
    datePublished: "2025-01-01",
    dateModified: new Date().toISOString().split("T")[0],
  };

  return (
    <Helmet>
      {/* 기본 메타 태그 */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph 태그 */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="CHIP GAMES" />
      <meta property="og:locale" content={language === "ko" ? "ko_KR" : language === "en" ? "en_US" : language === "ja" ? "ja_JP" : "zh_CN"} />

      {/* Twitter Card 태그 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />

      {/* 다국어 지원 */}
      <link rel="alternate" hrefLang="ko" href={`${url}?lang=ko`} />
      <link rel="alternate" hrefLang="en" href={`${url}?lang=en`} />
      <link rel="alternate" hrefLang="ja" href={`${url}?lang=ja`} />
      <link rel="alternate" hrefLang="zh" href={`${url}?lang=zh`} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* 구조화된 데이터 */}
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Helmet>
  );
};

export default SEOHead;

