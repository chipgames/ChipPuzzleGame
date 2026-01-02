import type { Plugin } from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * HTML 파일에 버전 쿼리 파라미터를 자동으로 추가하는 플러그인
 */
export function htmlVersionPlugin(): Plugin {
  let version: string;
  let base: string;
  let isProduction: boolean;

  return {
    name: "html-version",
    configResolved(config) {
      // package.json에서 버전 읽기
      const packageJson = JSON.parse(
        readFileSync(resolve(config.root, "package.json"), "utf-8")
      );
      version = packageJson.version;
      base = config.base || "/";
      isProduction = config.command === "build";
    },
    transformIndexHtml(html) {
      // 캐시 방지 메타 태그 추가 (없는 경우에만)
      let result = html;
      if (!html.includes('http-equiv="Cache-Control"')) {
        result = result.replace(
          /(<meta name="viewport"[^>]*>)/i,
          `$1\n    <!-- 캐시 방지 메타 태그 (버전: ${version}) -->\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />\n    <meta http-equiv="Pragma" content="no-cache" />\n    <meta http-equiv="Expires" content="0" />\n    <meta name="app-version" content="${version}" />`
        );
      }

      // 개발 환경에서는 AdSense 스크립트 제거
      if (!isProduction) {
        // AdSense 스크립트 태그 제거 (googlesyndication.com 또는 adsbygoogle 포함)
        result = result.replace(
          /<script[^>]*googlesyndication[^>]*>[\s\S]*?<\/script>/gi,
          '<!-- AdSense 스크립트는 프로덕션 환경에서만 로드됩니다 -->'
        );
        result = result.replace(
          /<script[^>]*adsbygoogle[^>]*>[\s\S]*?<\/script>/gi,
          '<!-- AdSense 스크립트는 프로덕션 환경에서만 로드됩니다 -->'
        );
        // self-closing 스크립트 태그도 제거
        result = result.replace(
          /<script[^>]*googlesyndication[^>]*\/>/gi,
          '<!-- AdSense 스크립트는 프로덕션 환경에서만 로드됩니다 -->'
        );
        result = result.replace(
          /<script[^>]*adsbygoogle[^>]*\/>/gi,
          '<!-- AdSense 스크립트는 프로덕션 환경에서만 로드됩니다 -->'
        );
        // AdSense DNS 프리페치 제거
        result = result.replace(
          /<link[^>]*dns-prefetch[^>]*googlesyndication[^>]*>/gi,
          '<!-- AdSense DNS 프리페치는 프로덕션 환경에서만 로드됩니다 -->'
        );
        result = result.replace(
          /<link[^>]*googlesyndication[^>]*dns-prefetch[^>]*>/gi,
          '<!-- AdSense DNS 프리페치는 프로덕션 환경에서만 로드됩니다 -->'
        );
      }

      // 프로덕션 빌드에서만 HTML 내의 모든 스크립트와 링크 태그에 버전 쿼리 파라미터 추가
      // 개발 모드에서는 소스 파일에 쿼리 파라미터를 추가하면 Vite가 오류를 발생시킴
      if (isProduction) {
        result = result
          .replace(
            /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/g,
            (match, prefix, src, suffix) => {
              // 이미 쿼리 파라미터가 있으면 추가하지 않음
              if (src.includes("?") || src.includes("v=")) {
                return match;
              }
              // 개발 모드 소스 파일은 제외 (/src/로 시작하는 경로)
              if (src.startsWith("/src/") || src.startsWith("./src/") || src.startsWith("src/")) {
                return match;
              }
              const separator = src.includes("?") ? "&" : "?";
              return `${prefix}${src}${separator}v=${version}${suffix}`;
            }
          )
          .replace(
            /(<link[^>]*href=["'])([^"']+)(["'][^>]*>)/g,
            (match, prefix, href, suffix) => {
              // 이미 버전 쿼리 파라미터가 있으면 추가하지 않음
              if (href.includes("v=")) {
                return match;
              }
              // 외부 리소스는 제외
              if (href.startsWith("http://") || href.startsWith("https://")) {
                return match;
              }
              // data: 또는 javascript: 프로토콜은 제외
              if (href.startsWith("data:") || href.startsWith("javascript:")) {
                return match;
              }
              // 빈 href는 제외
              if (!href || href.trim() === "") {
                return match;
              }
              // 개발 모드 소스 파일은 제외 (/src/로 시작하는 경로)
              if (href.startsWith("/src/") || href.startsWith("./src/") || href.startsWith("src/")) {
                return match;
              }
              const separator = href.includes("?") ? "&" : "?";
              return `${prefix}${href}${separator}v=${version}${suffix}`;
            }
          );
      }

      return result;
    },
  };
}

