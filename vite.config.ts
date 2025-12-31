import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

// package.json에서 버전 읽기
const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));
const version = packageJson.version;

// 개발 환경에서는 "/", 프로덕션 빌드에서는 "/ChipPuzzleGame/"
export default defineConfig(({ command, mode }) => {
  // 개발 서버에서는 "/", 빌드 시에는 mode에 따라 결정
  const base =
    command === "serve" || mode === "development"
      ? "/"
      : "/ChipPuzzleGame/";

  return {
    plugins: [react()],
    base,
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/components": path.resolve(__dirname, "./src/components"),
        "@/hooks": path.resolve(__dirname, "./src/hooks"),
        "@/services": path.resolve(__dirname, "./src/services"),
        "@/utils": path.resolve(__dirname, "./src/utils"),
        "@/types": path.resolve(__dirname, "./src/types"),
        "@/constants": path.resolve(__dirname, "./src/constants"),
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      minify: "esbuild",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
          },
          // 버전 정보를 파일명에 포함하여 캐시 무효화
          entryFileNames: `assets/[name]-${version}-[hash].js`,
          chunkFileNames: `assets/[name]-${version}-[hash].js`,
          assetFileNames: `assets/[name]-${version}-[hash].[ext]`,
        },
      },
      chunkSizeWarningLimit: 1000,
    },
    server: {
      port: 3000,
      open: true,
      host: true, // 모든 네트워크 인터페이스에서 접근 가능
    },
  };
});

