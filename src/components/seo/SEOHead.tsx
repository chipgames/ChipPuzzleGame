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

  // 현재 페이지 감지
  const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
  const isGuide = currentPath.includes("screen=guide") || url.includes("screen=guide");
  const isHelp = currentPath.includes("screen=help") || url.includes("screen=help");
  const isAbout = currentPath.includes("screen=about") || url.includes("screen=about");

  // 페이지별 기본값 설정
  let defaultTitle: string;
  let defaultDescription: string;
  let defaultKeywords: string;

  if (isGuide) {
    defaultTitle = t("seo.guideTitle") || t("seo.title");
    defaultDescription = t("seo.guideDescription") || t("seo.description");
    defaultKeywords = t("seo.guideKeywords") || t("seo.keywords");
  } else if (isHelp) {
    defaultTitle = t("seo.helpTitle") || t("seo.title");
    defaultDescription = t("seo.helpDescription") || t("seo.description");
    defaultKeywords = t("seo.helpKeywords") || t("seo.keywords");
  } else if (isAbout) {
    defaultTitle = t("seo.aboutTitle") || t("seo.title");
    defaultDescription = t("seo.aboutDescription") || t("seo.description");
    defaultKeywords = t("seo.aboutKeywords") || t("seo.keywords");
  } else {
    defaultTitle = t("seo.title") || "매칭 퍼즐 게임 - CHIP GAMES";
    defaultDescription =
      t("seo.description") ||
      "무료 온라인 매칭 퍼즐 게임. 1000개의 도전적인 스테이지를 플레이하세요! 다양한 색상의 젬을 매칭하여 목표를 달성하는 재미있는 퍼즐 게임입니다.";
    defaultKeywords =
      t("seo.keywords") ||
      "매칭게임, 퍼즐게임, 무료게임, 온라인게임, 퍼즐, 매칭3, 캔디크러시, 게임, 브라우저게임, HTML5게임";
  }

  const defaultImage = "https://chipgames.github.io/ChipPuzzleGame/ChipGames_Logo.png";

  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  const finalKeywords = keywords || defaultKeywords;
  const finalImage = image || defaultImage;

  // 구조화된 데이터 (JSON-LD)
  const baseUrl = "https://chipgames.github.io/ChipPuzzleGame/";
  const langParam = language !== "ko" ? `?lang=${language}` : "";
  
  // Organization 스키마
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CHIP GAMES",
    url: "https://chipgames.github.io",
    logo: "https://chipgames.github.io/ChipPuzzleGame/ChipGames_Logo.png",
    sameAs: [],
  };

  // VideoGame 스키마 (메인 페이지용)
  const videoGameSchema = {
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

  // BreadcrumbList 스키마
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      position: 1,
      name: language === "ko" ? "홈" : language === "en" ? "Home" : language === "ja" ? "ホーム" : "首页",
      item: `${baseUrl}${langParam}`,
    },
  ];

  if (isGuide) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: t("guide.title") || "게임 가이드",
      item: `${baseUrl}?screen=guide${langParam}`,
    });
  } else if (isHelp) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: t("help.title") || "도움말",
      item: `${baseUrl}?screen=help${langParam}`,
    });
  } else if (isAbout) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: t("about.title") || "게임 소개",
      item: `${baseUrl}?screen=about${langParam}`,
    });
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // FAQPage 스키마 (도움말 페이지용)
  const faqSchema = isHelp ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("help.section7Title") || "자주 묻는 질문",
        acceptedAnswer: {
          "@type": "Answer",
          text: t("help.section7Content") || "",
        },
      },
    ],
  } : null;

  // WebSite 스키마
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CHIP GAMES - Match Puzzle Game",
    url: baseUrl,
    publisher: {
      "@type": "Organization",
      name: "CHIP GAMES",
    },
    inLanguage: [language || "ko", "en", "ja", "zh"],
  };

  // 페이지별 구조화된 데이터 배열
  const structuredDataArray: object[] = [organizationSchema, websiteSchema];
  
  if (!isGuide && !isHelp && !isAbout) {
    structuredDataArray.push(videoGameSchema);
  }
  
  structuredDataArray.push(breadcrumbSchema);
  
  if (faqSchema) {
    structuredDataArray.push(faqSchema);
  }

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
      {structuredDataArray.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;

