/**
 * Google AdSense 유틸리티
 * 광고 초기화, 오류 방지, 접근성 개선
 */

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

/**
 * 개발 환경인지 확인
 */
function isDevelopment(): boolean {
  // Vite의 import.meta.env를 사용하거나, hostname으로 확인
  try {
    // @ts-ignore - Vite의 import.meta.env는 런타임에 사용 가능
    if (import.meta.env?.DEV) {
      return true;
    }
  } catch {
    // import.meta.env를 사용할 수 없는 경우 hostname으로 확인
  }
  
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
}

/**
 * AdSense 오류 방지
 */
export function preventAdSenseErrors(): void {
  // adsbygoogle 배열이 이미 존재하는지 확인
  if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
    return;
  }
  
  // adsbygoogle 배열 초기화
  window.adsbygoogle = window.adsbygoogle || [];
}

/**
 * AdSense 중복 설정 방지
 */
export function preventDuplicateAdSense(): boolean {
  // 안전한 배열 확인
  if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
    // 이미 enable_page_level_ads가 설정되었는지 확인
    if (window.adsbygoogle.some((ad: any) => ad.enable_page_level_ads)) {
      return false;
    }
  }
  return true;
}

/**
 * 광고 iframe 접근성 개선
 */
export function improveAdAccessibility(): void {
  // Google AdSense iframe들의 aria-hidden 속성 제거
  const adIframes = document.querySelectorAll(
    'iframe[src*="googlesyndication.com"], iframe[src*="doubleclick.net"]'
  );
  adIframes.forEach((iframe) => {
    try {
      // HTMLIFrameElement로 타입 캐스팅
      const iframeElement = iframe as HTMLIFrameElement;
      if (iframeElement.contentDocument) {
        const body = iframeElement.contentDocument.body;
        if (body && body.getAttribute("aria-hidden") === "true") {
          body.removeAttribute("aria-hidden");
        }
      }
    } catch (e) {
      // Cross-origin iframe 접근 오류는 무시
    }
  });
}

/**
 * AdSense 초기화 (React 컴포넌트에서 사용)
 */
export function initializeAdSense(): void {
  // 개발 환경에서는 AdSense 초기화를 건너뜀 (localhost에서 광고가 작동하지 않음)
  if (isDevelopment()) {
    return;
  }
  
  preventAdSenseErrors();
  
  if (!preventDuplicateAdSense()) {
    return;
  }
  
  try {
    if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
      window.adsbygoogle.push({
        google_ad_client: "ca-pub-2533613198240039",
        enable_page_level_ads: true,
      });
    }
  } catch (error) {
    // AdSense 설정 오류는 조용히 처리
    // 개발 환경에서만 경고 표시 (프로덕션에서는 console이 제거됨)
    if (isDevelopment()) {
      console.warn("AdSense initialization error:", error);
    }
  }
}

/**
 * 광고 동적 로드 감지 및 접근성 개선
 */
export function setupAdObserver(): void {
  // 개발 환경에서는 관찰자 설정을 건너뜀
  if (isDevelopment()) {
    return;
  }
  
  // 광고 로드 후 접근성 개선
  setTimeout(improveAdAccessibility, 2000);
  
  // 광고 동적 로드 감지
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node as Element).tagName === "IFRAME"
          ) {
            setTimeout(improveAdAccessibility, 1000);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

