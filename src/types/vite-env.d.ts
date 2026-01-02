/**
 * Vite 환경 변수 타입 정의
 */

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
  readonly BASE_URL: string;
  // 추가 환경 변수가 있으면 여기에 정의
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

