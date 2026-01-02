/**
 * Service Worker 등록 및 관리 유틸리티
 */

import { logger } from "./logger";

/**
 * 개발 환경인지 확인
 */
function isDevelopment(): boolean {
  try {
    if (import.meta.env?.DEV) {
      return true;
    }
  } catch {
    // import.meta.env를 사용할 수 없는 경우
  }

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.includes("localhost")
  );
}

/**
 * Service Worker 등록
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    if (isDevelopment()) {
      logger.warn("Service Worker is not supported in this browser");
    }
    return;
  }

  // 개발 환경에서는 Service Worker 비활성화 (선택적)
  // Vite에서는 import.meta.env를 사용하지만, 브라우저에서는 직접 접근 불가
  // 환경 변수는 빌드 타임에 주입되므로, 런타임 체크는 불필요
  // 개발 환경에서 Service Worker를 비활성화하려면 주석 처리하세요

  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL || "/"}sw.js`;

    navigator.serviceWorker
      .register(swUrl, {
        scope: import.meta.env.BASE_URL || "/",
      })
      .then((registration) => {
        logger.info("Service Worker registered successfully", {
          scope: registration.scope,
        });

        // 업데이트 확인
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // 새 버전이 설치되었지만 아직 활성화되지 않음
              logger.info("New Service Worker version available");
              // 사용자에게 업데이트 알림을 표시할 수 있음
              if (confirm("새 버전이 사용 가능합니다. 업데이트하시겠습니까?")) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        logger.error("Service Worker registration failed", { error });
      });
  });

  // Service Worker 업데이트 확인
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    logger.info("Service Worker controller changed");
    // 페이지 새로고침으로 새 Service Worker 활성화
    window.location.reload();
  });
}

/**
 * Service Worker 해제
 */
export function unregisterServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
      logger.info("Service Worker unregistered");
    })
    .catch((error) => {
      logger.error("Service Worker unregistration failed", { error });
    });
}

/**
 * Service Worker 상태 확인
 */
export function getServiceWorkerStatus(): Promise<{
  registered: boolean;
  active: boolean;
  installing: boolean;
  waiting: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      resolve({
        registered: false,
        active: false,
        installing: false,
        waiting: false,
      });
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      resolve({
        registered: true,
        active: registration.active !== null,
        installing: registration.installing !== null,
        waiting: registration.waiting !== null,
      });
    });
  });
}

