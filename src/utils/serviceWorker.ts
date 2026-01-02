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

  // 새로고침 플래그 (무한 루프 방지) - sessionStorage 사용
  const RELOAD_FLAG = "sw_reloading";
  const isReloading = sessionStorage.getItem(RELOAD_FLAG) === "true";

  // 이미 새로고침 중이면 플래그 제거하고 리턴
  if (isReloading) {
    sessionStorage.removeItem(RELOAD_FLAG);
    return;
  }

  // controllerchange 이벤트 리스너 (한 번만 등록)
  const handleControllerChange = () => {
    if (sessionStorage.getItem(RELOAD_FLAG) === "true") {
      return; // 이미 새로고침 중이면 무시
    }

    logger.info("Service Worker controller changed");
    // 플래그 설정 후 페이지 새로고침 (한 번만)
    sessionStorage.setItem(RELOAD_FLAG, "true");
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // 이벤트 리스너가 이미 등록되어 있는지 확인
  if (!(navigator.serviceWorker as any).__controllerChangeListenerAdded) {
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    (navigator.serviceWorker as any).__controllerChangeListenerAdded = true;
  }

  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL || "/"}sw.js`;

    navigator.serviceWorker
      .register(swUrl, {
        scope: import.meta.env.BASE_URL || "/",
        updateViaCache: "none", // Service Worker 파일 자체는 항상 네트워크에서 가져오기
      })
      .then((registration) => {
        logger.info("Service Worker registered successfully", {
          scope: registration.scope,
        });

        // 주기적으로 업데이트 확인 (1시간마다)
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // 업데이트 확인
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // 새 버전이 설치되었지만 아직 활성화되지 않음
                logger.info("New Service Worker version available");
                // 자동으로 새 버전 활성화
                newWorker.postMessage({ type: "SKIP_WAITING" });
                // 플래그 설정 후 페이지 새로고침 (한 번만)
                if (sessionStorage.getItem(RELOAD_FLAG) !== "true") {
                  sessionStorage.setItem(RELOAD_FLAG, "true");
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                }
              } else {
                // 첫 설치
                logger.info("Service Worker installed for the first time");
              }
            }
          });
        });

        // 초기 로드 시에만 업데이트 확인 (무한 루프 방지)
        if (navigator.serviceWorker.controller) {
          // 이미 Service Worker가 활성화되어 있으면 업데이트 확인
          registration.update();
        }
      })
      .catch((error) => {
        logger.error("Service Worker registration failed", { error });
      });
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

