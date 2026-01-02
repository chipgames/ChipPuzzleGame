/**
 * Window 객체 확장 타입 정의
 */

import type { AdSenseConfig } from "./adsense";

declare global {
  interface Window {
    /**
     * Google AdSense 광고 배열
     */
    adsbygoogle?: AdSenseConfig[];
    
    /**
     * WebKit AudioContext (Safari 등)
     */
    webkitAudioContext?: typeof AudioContext;
    
    /**
     * 언어 변경 이벤트
     */
    addEventListener(
      type: "languageChanged",
      listener: (event: CustomEvent<string>) => void
    ): void;
    
    removeEventListener(
      type: "languageChanged",
      listener: (event: CustomEvent<string>) => void
    ): void;
  }
}

export {};

