/**
 * 배포 시 버전 자동 업데이트 스크립트
 * package.json과 Service Worker의 버전을 동기화하여 업데이트
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 버전 증가 타입 (patch, minor, major)
const versionType = process.argv[2] || "patch";

// package.json 읽기
const packagePath = join(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));

// 현재 버전 파싱
const [major, minor, patch] = packageJson.version.split(".").map(Number);

// 버전 증가
let newVersion;
switch (versionType) {
  case "major":
    newVersion = `${major + 1}.0.0`;
    break;
  case "minor":
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case "patch":
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// package.json 업데이트
const oldVersion = packageJson.version;
packageJson.version = newVersion;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
console.log(`✅ package.json 버전 업데이트: ${oldVersion} → ${newVersion}`);

// Service Worker 업데이트
const swPath = join(process.cwd(), "public", "sw.js");
let swContent = readFileSync(swPath, "utf-8");

// CACHE_VERSION 업데이트
const cacheVersion = `chip-puzzle-v${newVersion}`;
swContent = swContent.replace(
  /const CACHE_VERSION = "chip-puzzle-v[\d.]+";/,
  `const CACHE_VERSION = "${cacheVersion}";`
);

writeFileSync(swPath, swContent);
console.log(`✅ Service Worker 캐시 버전 업데이트: ${cacheVersion}`);

console.log(`\n📦 새 버전: ${newVersion}`);
console.log(`🚀 배포 준비 완료!\n`);
