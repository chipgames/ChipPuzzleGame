import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            canvas: ["./src/components/canvas/CanvasRenderer.ts"],
          },
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

