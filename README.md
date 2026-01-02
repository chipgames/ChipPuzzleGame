# Chip Puzzle Game

1000개의 도전적인 스테이지가 있는 매칭 퍼즐 게임

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

## 🎮 게임 소개

매칭 퍼즐 게임은 브라우저에서 바로 플레이할 수 있는 무료 온라인 퍼즐 게임입니다.
1000개의 다양한 스테이지에서 색상의 젬을 매칭하여 목표를 달성하는 재미있는 게임입니다.

### 주요 특징

- 🎯 **1000개 스테이지**: 다양한 난이도와 목표로 구성된 풍부한 콘텐츠
- 🎨 **아름다운 그래픽**: Canvas 기반의 부드러운 애니메이션과 시각 효과
- 🌍 **다국어 지원**: 한국어, 영어, 일본어, 중국어 지원
- 📱 **반응형 디자인**: PC와 모바일 모두에서 최적화된 경험
- ⌨️ **키보드 접근성**: 키보드로도 게임 플레이 가능 (WCAG 준수)
- 🎁 **특수 젬 시스템**: 4개 이상 매칭 시 특수 젬 생성으로 전략적 플레이
- 💾 **자동 저장**: 게임 진행 상황 자동 저장
- ⭐ **별점 시스템**: 성과에 따라 0~3스타 평가

## 기술 스택

- **React 18** + **TypeScript** - 현대적인 UI 프레임워크와 타입 안정성
- **Vite** - 빠른 빌드 도구
- **Canvas API** - 고성능 게임 렌더링
- **Jest** - 단위 테스트
- **GitHub Pages** - 무료 호스팅

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
# 일반 빌드
npm run build

# 번들 분석 포함 빌드
npm run build:analyze
```

번들 분석을 실행하면 `dist/stats.html` 파일이 생성되며, 브라우저에서 번들 크기를 시각적으로 확인할 수 있습니다.

### 테스트

```bash
# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage
```

### 배포

```bash
npm run deploy
```

**중요**: 배포 후 GitHub에서 Pages 설정을 확인하세요:

1. 저장소 Settings > Pages로 이동
2. Source를 `gh-pages` 브랜치, `/ (root)` 폴더로 설정
3. 접속 URL: https://chipgames.github.io/ChipPuzzleGame/

자세한 내용은 [DEPLOYMENT.md](./DEPLOYMENT.md) 참고

## 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── canvas/         # Canvas 관련 컴포넌트
│   ├── game/           # 게임 보드 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트 (Header, Footer, ErrorBoundary)
│   ├── screens/        # 화면 컴포넌트 (Guide, Help, About)
│   ├── seo/            # SEO 관련 컴포넌트
│   └── ui/             # UI 컴포넌트 (LanguageSelector)
├── hooks/              # Custom Hooks
│   ├── useGameState.ts # 게임 상태 관리
│   ├── useLanguage.ts  # 다국어 지원
│   └── useAnimation.ts # 애니메이션 관리
├── services/           # 비즈니스 로직
│   └── LanguageService.ts
├── utils/              # 유틸리티 함수
│   ├── matchDetection.ts    # 매칭 감지 알고리즘
│   ├── starRating.ts        # 별점 계산
│   ├── storage.ts           # LocalStorage 관리
│   ├── gravity.ts           # 중력 시스템
│   ├── particles.ts         # 파티클 효과
│   └── __tests__/          # 단위 테스트
├── types/              # TypeScript 타입 정의
├── constants/          # 상수 정의
├── locales/            # 다국어 파일 (ko, en, ja, zh)
└── styles/             # CSS 파일
```

## 주요 기능

### 게임 플레이

- **매칭 시스템**: 같은 색상의 젬을 3개 이상 가로/세로로 연결하여 제거
- **스와이프 조작**: 마우스 드래그 또는 터치 스와이프로 젬 교환
- **중력 시스템**: 젬 제거 후 위의 젬이 자동으로 떨어짐
- **연쇄 반응**: 떨어지는 젬으로 인한 추가 매칭 자동 처리
- **특수 젬**: 4개 이상 매칭 시 특수 젬 생성 (폭발, 번개, 무지개)
- **힌트 기능**: 가능한 매칭 위치 표시
- **일시정지**: 언제든지 게임 일시정지 가능

### 스테이지 시스템

- **1000개 스테이지**: 절차적 생성으로 다양한 스테이지 제공
- **난이도 조절**: 스테이지 번호에 따라 자동 난이도 조절
- **별점 평가**: 성과에 따라 0~3스타 평가
- **진행 상황 저장**: LocalStorage에 자동 저장

### 사용자 경험

- **다국어 지원**: 한국어, 영어, 일본어, 중국어
- **반응형 디자인**: PC, 태블릿, 모바일 최적화
- **키보드 접근성**: 화살표 키로 게임 플레이 가능
- **PWA 지원**: 홈 화면에 설치 가능, 오프라인 지원
- **Service Worker**: 오프라인 캐싱 및 빠른 로딩
- **에러 처리**: 친화적인 에러 메시지 및 복구 메커니즘

### 기술적 특징

- **Canvas 렌더링**: 고성능 2D 그래픽 렌더링
- **타입 안정성**: TypeScript로 타입 안정성 보장
- **성능 최적화**: React.memo, Lazy Loading 적용
- **성능 모니터링**: Web Vitals 측정 및 분석
- **애니메이션 최적화**: GPU 가속, will-change CSS 속성
- **폰트 최적화**: 시스템 폰트 사용, 플랫폼별 최적 폰트 자동 선택
- **PWA 완성**: Service Worker를 통한 오프라인 지원
- **보안**: CSP 적용, 데이터 검증
- **SEO 최적화**: 구조화된 데이터, 메타 태그

### 성능 모니터링

프로젝트는 Google의 Core Web Vitals를 측정하고 분석합니다:

- **LCP (Largest Contentful Paint)**: 가장 큰 콘텐츠 렌더링 시간
- **FID (First Input Delay)**: 첫 사용자 입력 지연 시간
- **CLS (Cumulative Layout Shift)**: 누적 레이아웃 이동
- **FCP (First Contentful Paint)**: 첫 콘텐츠 렌더링 시간
- **TTFB (Time to First Byte)**: 첫 바이트 도착 시간

성능 메트릭은 자동으로 수집되며, 개발 환경에서는 상세 로그가 출력되고, 프로덕션에서는 나쁜 점수만 경고로 표시됩니다.

## 테스트

프로젝트에는 핵심 로직에 대한 단위 테스트가 포함되어 있습니다:

### 단위 테스트

- `matchDetection.ts`: 매칭 감지 알고리즘 테스트
- `starRating.ts`: 별점 계산 로직 테스트
- `storage.ts`: LocalStorage 유틸리티 테스트

### 컴포넌트 테스트

- `ErrorBoundary`: 에러 처리 테스트
- `LanguageSelector`: 언어 선택 기능 테스트

### 테스트 커버리지 목표

- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

## 게임 플레이 방법

### 기본 조작

1. **젬 선택**: 마우스 클릭 또는 터치로 젬 선택
2. **젬 교환**: 인접한 젬으로 드래그하여 위치 교환
3. **매칭**: 같은 색상의 젬 3개 이상을 가로/세로로 연결
4. **목표 달성**: 각 스테이지의 목표를 제한된 이동 횟수 내에 달성

### 키보드 조작

- **화살표 키**: 젬 선택 및 이동
- **Space/Enter**: 젬 선택 확인
- **Escape**: 일시정지
- **H**: 힌트 표시

### 특수 젬

- **4개 매칭**: 폭발 젬 (주변 8개 제거)
- **5개 직선 매칭**: 번개 젬 (한 줄 전체 제거)
- **T자/L자 매칭**: 무지개 젬 (같은 색상 모두 제거)

## 개발 가이드

### 환경 요구사항

- Node.js 16 이상
- npm 또는 yarn

### 개발 워크플로우

1. 저장소 클론
2. `npm install`로 의존성 설치
3. `npm run dev`로 개발 서버 실행
4. `npm test`로 테스트 실행
5. `npm run build`로 프로덕션 빌드

### 코드 스타일

- TypeScript strict 모드 사용
- ESLint 규칙 준수
- 함수형 컴포넌트 사용
- Custom Hooks로 로직 분리

### PWA 및 오프라인 지원

프로젝트는 완전한 PWA(Progressive Web App)로 구현되어 있습니다:

- **Service Worker**: 정적 리소스 및 동적 리소스 캐싱
- **오프라인 지원**: 네트워크 없이도 기본 기능 사용 가능
- **자동 업데이트**: 새 버전 감지 및 업데이트 알림
- **설치 가능**: 모바일 및 데스크톱에서 앱처럼 설치 가능

Service Worker는 프로덕션 빌드에서 자동으로 활성화됩니다.

## 라이선스

MIT
