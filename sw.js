/**
 * Service Worker for Chip Puzzle Game
 * 오프라인 지원 및 캐싱 전략 구현
 */

// 캐시 버전 업데이트 (코드 변경 시마다 증가)
const CACHE_VERSION = "chip-puzzle-v1.1.1";
const CACHE_NAME = `${CACHE_VERSION}`;
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// 캐시할 정적 리소스 목록
const STATIC_ASSETS = [
  "/ChipPuzzleGame/",
  "/ChipPuzzleGame/index.html",
  "/ChipPuzzleGame/manifest.json",
  "/ChipPuzzleGame/robots.txt",
  "/ChipPuzzleGame/sitemap.xml",
];

// 설치 이벤트: 정적 리소스 캐싱
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...", CACHE_VERSION);

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        // 캐시 실패해도 설치 계속 진행
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn("[Service Worker] Failed to cache some assets:", error);
        });
      })
      .then(() => {
        // 즉시 활성화 (skipWaiting)
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트: 오래된 캐시 정리
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 현재 버전이 아닌 캐시 삭제
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith("chip-puzzle-")
            ) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // 모든 클라이언트에 즉시 제어권 부여
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트: 네트워크 요청 가로채기
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 같은 origin만 처리
  if (url.origin !== location.origin) {
    return;
  }

  // GET 요청만 캐싱
  if (request.method !== "GET") {
    return;
  }

  // AdSense 등 외부 리소스는 캐싱하지 않음
  if (
    url.hostname.includes("googlesyndication.com") ||
    url.hostname.includes("googleadservices.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 응답이 유효한지 확인
        if (!response || response.status !== 200 || response.type !== "basic") {
          // 네트워크 응답이 유효하지 않으면 캐시 확인
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || response;
          });
        }

        // 응답 복제 (한 번만 읽을 수 있으므로)
        const responseToCache = response.clone();

        // 동적 캐시에 저장 (비동기, 응답 지연 없음)
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          // 이미지, 폰트, 스타일시트, 스크립트만 캐싱
          if (
            request.destination === "image" ||
            request.destination === "font" ||
            request.destination === "style" ||
            request.destination === "script" ||
            url.pathname.endsWith(".js") ||
            url.pathname.endsWith(".css") ||
            url.pathname.endsWith(".png") ||
            url.pathname.endsWith(".jpg") ||
            url.pathname.endsWith(".svg") ||
            url.pathname.endsWith(".ico")
          ) {
            cache.put(request, responseToCache);
          }
        });

        return response;
      })
      .catch(() => {
        // 네트워크 오류 시 캐시 확인
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 캐시도 없으면 오프라인 페이지 반환
          if (request.destination === "document") {
            return caches.match("/ChipPuzzleGame/index.html");
          }
          // 이미지 등은 빈 응답 반환
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});

// 메시지 이벤트: 클라이언트와 통신
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    // 특정 URL들을 캐시하도록 요청
    event.waitUntil(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

