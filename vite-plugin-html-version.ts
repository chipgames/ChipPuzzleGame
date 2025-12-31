import type { Plugin } from "vite";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * HTML 파일에 버전 쿼리 파라미터를 자동으로 추가하는 플러그인
 */
export function htmlVersionPlugin(): Plugin {
  let version: string;
  let base: string;

  return {
    name: "html-version",
    configResolved(config) {
      // package.json에서 버전 읽기
      const packageJson = JSON.parse(
        readFileSync(resolve(config.root, "package.json"), "utf-8")
      );
      version = packageJson.version;
      base = config.base || "/";
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

      // HTML 내의 모든 스크립트와 링크 태그에 버전 쿼리 파라미터 추가
      result = result
        .replace(
          /(<script[^>]*src=["'])([^"']+)(["'][^>]*>)/g,
          (match, prefix, src, suffix) => {
            // 이미 쿼리 파라미터가 있으면 추가하지 않음
            if (src.includes("?") || src.includes("v=")) {
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
            const separator = href.includes("?") ? "&" : "?";
            return `${prefix}${href}${separator}v=${version}${suffix}`;
          }
        );

      return result;
    },
  };
}

