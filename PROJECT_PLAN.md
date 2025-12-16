# 매칭 퍼즐 게임 프로젝트 계획서

## 1. 프로젝트 개요

### 목표

- 재미있고 도전적인 매칭 퍼즐 게임 개발
- GitHub Pages를 통한 무료 웹 호스팅
- React 기반의 현대적인 웹 애플리케이션 구축
- 데스크탑과 모바일 모두 지원하는 반응형 디자인
- 모바일에서 네이티브 앱과 유사한 UI/UX 제공
- 스테이지 형식의 게임 진행 시스템 (1~1000 스테이지)

### 기술 스택

- **프레임워크**: React (Vite 또는 Create React App)
- **언어**: TypeScript (타입 안정성)
- **스타일링**: CSS Modules (UI 요소만)
- **렌더링**: Canvas API (게임 보드, 애니메이션, 이펙트 전부)
- **상태 관리**: React Hooks (useState, useContext, useReducer)
- **빌드 도구**: Vite (빠른 개발 및 빌드)
- **배포**: GitHub Pages
- **반응형**: Mobile-First 접근 방식, 미디어 쿼리 활용
- **다국어 지원**: i18n (영어, 한국어, 중국어, 일본어)
- **Canvas 비율**: 16:9 고정 비율, 반응형 크기 조절
- **PWA 기능**: Service Worker (선택사항, 앱처럼 사용 가능)
- **광고**: Google AdSense 또는 유사 서비스
- **SEO**: React Helmet, 메타 태그 최적화

### 저작권 및 법적 고려사항

**중요 주의사항:**

- 이 프로젝트는 독창적인 매칭 퍼즐 게임입니다
- 기존 게임의 상표, 이름, 캐릭터, 디자인 요소를 사용하지 않습니다
- Match-3 게임 메커니즘 자체는 저작권이 없는 일반적인 게임 플레이 메커니즘입니다
- 모든 그래픽, 디자인, 이름은 독창적으로 제작됩니다
- "캔디", "젤리" 등 특정 용어 대신 일반적인 용어 사용 (예: "젬", "블록", "타일")
- 색상 팔레트와 디자인은 독창적으로 설계됩니다

**법적 준수:**

- 상표권 침해 방지: 기존 게임 이름/상표 사용 금지
- 저작권 준수: 독창적인 디자인 및 콘텐츠 사용
- 오픈소스 라이선스: MIT 또는 Apache 2.0 고려

## 2. 게임 설계

### 게임 타입: Match-3 퍼즐 게임

**핵심 메커니즘:**

- **매칭 시스템**: 같은 색상/모양의 젬을 3개 이상 가로/세로로 연결하여 제거
- **중력 시스템**: 젬 제거 후 위의 젬이 아래로 떨어짐
- **연쇄 반응**: 떨어지는 젬으로 인한 추가 매칭
- **스와이프 조작**: 두 젬을 스와이프하여 위치 교환 (유효한 매칭만 가능)

**게임 보드:**

- **기본 크기**: 9x9 그리드 (표준)
- **변형 가능**: 스테이지별로 다양한 크기 (6x6 ~ 10x10)
- **젬 종류**: 6가지 색상 (빨강, 노랑, 파랑, 초록, 보라, 주황)
- **Canvas 기반 렌더링**: 모든 게임 요소를 Canvas로 렌더링

### 게임 모드: 스테이지 시스템

- **스테이지 형식**: 1~1000 스테이지
- **진행 방식**: 순차적 해제 (1스테이지 완료 → 2스테이지 해제)
- **스테이지 선택**: 해제된 스테이지는 자유롭게 선택 가능
- **난이도 조절**: 스테이지 번호에 따라 난이도 자동 조절
- **진행 상황 저장**: LocalStorage에 최고 진행 스테이지 저장

**스테이지 생성 방식:**

- **절차적 생성**: 시드 기반 랜덤 생성으로 1000개 스테이지 자동 생성
- **시드 기반**: 스테이지 번호를 시드로 사용하여 일관된 보드 생성
- **검증 로직**: 생성된 보드가 플레이 가능한지 검증 (최소 1개 이상의 매칭 가능)
- **벨런싱**: 스테이지 번호에 따라 목표 점수, 이동 횟수, 장애물 수 자동 조절

```typescript
interface StageConfig {
  stageNumber: number;
  gridSize: { rows: number; cols: number }; // 6x6 ~ 10x10
  targetScore: number;
  maxMoves: number;
  goals: Goal[];
  obstacles?: Obstacle[];
  initialBoard?: Gem[][]; // 시드 기반 생성
}

function generateStage(stageNumber: number): StageConfig {
  // 시드 기반 랜덤 생성
  const seed = stageNumber;
  const rng = createSeededRNG(seed);

  // 난이도에 따른 설정
  const difficulty = calculateDifficulty(stageNumber);
  const gridSize = calculateGridSize(stageNumber);
  const targetScore = calculateTargetScore(stageNumber);
  const maxMoves = calculateMaxMoves(stageNumber);

  // 초기 보드 생성 (플레이 가능한 보드 보장)
  const initialBoard = generatePlayableBoard(gridSize.rows, gridSize.cols, rng);

  // 목표 생성
  const goals = generateGoals(stageNumber, difficulty);

  return {
    stageNumber,
    gridSize,
    targetScore,
    maxMoves,
    goals,
    initialBoard,
  };
}

// 플레이 가능한 보드 생성 (최소 1개 이상의 매칭 보장)
function generatePlayableBoard(
  rows: number,
  cols: number,
  rng: SeededRNG
): Gem[][] {
  let board: Gem[][];
  let attempts = 0;
  const maxAttempts = 100;

  do {
    board = generateRandomBoard(rows, cols, rng);
    attempts++;
  } while (!hasValidMatches(board) && attempts < maxAttempts);

  if (!hasValidMatches(board)) {
    // 최대 시도 후에도 실패 시 기본 플레이 가능 보드 생성
    board = generateGuaranteedPlayableBoard(rows, cols);
  }

  return board;
}
```

### 목표 시스템

각 스테이지마다 다양한 목표가 설정됨:

1. **점수 목표**: 일정 점수 이상 달성
2. **특정 젬 수집**: 특정 색상/모양의 젬 N개 제거
3. **블록 제거**: 블록이 있는 타일을 모두 제거
4. **시간 제한**: 제한 시간 내 목표 달성
5. **이동 횟수 제한**: 제한된 이동 횟수 내 목표 달성

### 특수 젬 시스템

**일반 매칭으로 생성되는 특수 젬:**

1. **스트라이프 젬** (4개 가로/세로 매칭)

   - 가로 또는 세로 한 줄 전체 제거
   - 방향에 따라 가로/세로 결정

2. **래핑 젬** (5개 L자/T자 매칭)

   - 3x3 범위 폭발 효과

3. **컬러봄** (5개 직선 매칭)
   - 보드의 같은 색상 젬 모두 제거

**특수 젬 조합:**

- 스트라이프 + 스트라이프: 십자 제거
- 스트라이프 + 래핑: 3줄 제거
- 래핑 + 래핑: 5x5 범위 폭발
- 컬러봄 + 일반: 해당 색상 모두 제거
- 컬러봄 + 스트라이프: 해당 색상 줄 전체 제거
- 컬러봄 + 래핑: 해당 색상 모두 + 폭발
- 컬러봄 + 컬러봄: 보드 전체 제거

### 장애물 시스템

1. **블록**: 1층 또는 2층 블록, 매칭으로 제거
2. **확장 장애물**: 매 턴마다 확장, 특수 젬으로 제거
3. **벽돌**: 여러 번 매칭해야 제거
4. **잠긴 젬**: 주변 매칭으로 잠금 해제

## 3. 기능 명세

### 핵심 기능

- [ ] Canvas 기반 게임 보드 렌더링 (9x9 그리드)
- [ ] Canvas 이벤트 처리 (마우스/터치)
- [ ] 젬 스와이프 및 교환 로직
- [ ] 매칭 감지 알고리즘 (가로/세로)
- [ ] 중력 시스템 (젬 떨어지기 애니메이션)
- [ ] 연쇄 반응 처리
- [ ] 특수 젬 생성 및 활성화
- [ ] 목표 시스템 (점수, 특정 젬, 블록 등)
- [ ] 이동 횟수 제한
- [ ] 점수 계산 시스템
- [ ] 스테이지 시스템 (1~1000)
- [ ] 스테이지 진행 관리 (해제/잠금)
- [ ] 스테이지 선택 화면
- [ ] 스테이지별 난이도 자동 조절
- [ ] 벨런싱 시스템 (목표 점수/이동 횟수)
- [ ] 별점 시스템 (3스타)

### 추가 기능

- [ ] 생명 시스템 (하트, 실패 시 감소)
- [ ] 부스터 시스템 (힌트, 섞기, 특수 젬)
- [ ] 스테이지 진행 상황 저장 (LocalStorage)
- [ ] 스테이지별 최고 기록 저장
- [ ] 고급 Canvas 애니메이션 및 이펙트
- [ ] 파티클 시스템 (Canvas)
- [ ] 사운드 효과 (선택사항)
- [ ] 힌트 기능 (가능한 매칭 표시)
- [ ] 모바일 터치 제스처 지원 (스와이프)
- [ ] 모바일 앱 스타일 네비게이션
- [ ] 다국어 지원 (영어, 한국어, 중국어, 일본어)
- [ ] 브라우저 언어 자동 감지
- [ ] Canvas 16:9 비율 고정 및 반응형 처리
- [ ] 레이아웃 구조 (헤더, 게임 영역, 푸터)
- [ ] 광고 통합 (수익화)
- [ ] SEO 최적화

## 4. 프로젝트 구조

```
ChipPuzzleGame/
├── public/
│   ├── index.html
│   └── assets/          # 사운드 등
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx            # 헤더 컴포넌트
│   │   │   ├── Footer.tsx             # 푸터 컴포넌트
│   │   │   └── GameContainer.tsx      # 게임 영역 컨테이너
│   │   ├── game/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameCanvas.tsx        # Canvas 게임 보드 (16:9)
│   │   │   ├── GameInfo.tsx
│   │   │   ├── GameControls.tsx
│   │   │   ├── GoalPanel.tsx
│   │   │   └── BoosterPanel.tsx
│   │   ├── stage/
│   │   │   ├── StageSelector.tsx
│   │   │   ├── StageGrid.tsx
│   │   │   └── StageCard.tsx
│   │   ├── ui/
│   │   │   ├── Navigation.tsx
│   │   │   ├── LanguageSelector.tsx   # 언어 선택 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LifeCounter.tsx
│   │   │   └── AdBanner.tsx
│   │   └── canvas/
│   │       ├── CanvasRenderer.ts     # Canvas 렌더링 엔진
│   │       ├── GemRenderer.ts        # 젬 렌더링
│   │       ├── ParticleSystem.ts    # 파티클 시스템
│   │       └── AnimationManager.ts  # 애니메이션 관리
│   ├── hooks/
│   │   ├── useGameState.ts
│   │   ├── useCanvas.ts              # Canvas 훅
│   │   ├── useCanvasAspectRatio.ts   # Canvas 16:9 비율 훅
│   │   ├── useMatchDetection.ts
│   │   ├── useGravity.ts
│   │   ├── useSpecialGem.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useStageProgress.ts
│   │   ├── useResponsive.ts
│   │   ├── useSwipe.ts
│   │   └── useLanguage.ts            # 다국어 훅
│   ├── services/
│   │   ├── StageService.ts
│   │   ├── GameService.ts
│   │   ├── MatchService.ts
│   │   ├── SpecialGemService.ts
│   │   ├── CanvasService.ts          # Canvas 서비스
│   │   ├── LanguageService.ts        # 다국어 서비스
│   │   └── AdService.ts
│   ├── utils/
│   │   ├── matchDetection.ts
│   │   ├── gravity.ts
│   │   ├── cascade.ts
│   │   ├── scoreCalculation.ts
│   │   ├── stageGenerator.ts
│   │   ├── stageDifficulty.ts
│   │   ├── balanceCalculator.ts
│   │   └── canvasUtils.ts            # Canvas 유틸리티
│   ├── constants/
│   │   ├── gameConfig.ts
│   │   ├── stageConfig.ts
│   │   ├── uiConfig.ts
│   │   ├── gemConfig.ts              # 젬 설정
│   │   ├── canvasConfig.ts           # Canvas 설정 (16:9)
│   │   ├── balanceConfig.ts
│   │   └── languages.ts              # 다국어 상수
│   ├── locales/
│   │   ├── en.json                   # 영어
│   │   ├── ko.json                   # 한국어
│   │   ├── zh.json                   # 중국어
│   │   └── ja.json                   # 일본어
│   ├── types/
│   │   ├── stage.ts
│   │   ├── game.ts
│   │   ├── gem.ts                    # 젬 타입
│   │   └── ui.ts
│   ├── styles/
│   │   ├── App.css
│   │   ├── mobile.css
│   │   ├── desktop.css
│   │   └── components/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## 5. 기술 구현 계획

### 5.1 React + Vite 설정

```bash
npm create vite@latest . -- --template react-ts
```

**Vite 선택 이유:**

- 빠른 개발 서버
- 최적화된 프로덕션 빌드
- GitHub Pages 배포에 적합한 정적 파일 생성

**패키지 의존성 (package.json):**

```json
{
  "name": "chip-puzzle-game",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "test": "jest",
    "test:coverage": "jest --coverage"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-helmet-async": "^1.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "gh-pages": "^6.0.0",
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

**TypeScript 설정 (tsconfig.json):**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/constants/*": ["src/constants/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 5.2 GitHub Pages 배포 설정

#### 필요한 패키지

- `gh-pages`: GitHub Pages 배포 자동화

#### 배포 스크립트 (package.json)

```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

#### Vite 설정 (vite.config.ts)

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/ChipPuzzleGame/",
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
    sourcemap: false, // 프로덕션에서는 소스맵 비활성화
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // 콘솔 로그 제거
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
  },
});
```

**브라우저 호환성:**

- **지원 브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **필수 기능**: Canvas API, LocalStorage, ES2020
- **폴리필**: roundRect (일부 브라우저)
- **모바일**: iOS Safari 14+, Chrome Mobile 90+

### 5.3 Canvas 기반 게임 로직 설계

#### Canvas 렌더링 아키텍처

**Canvas 설정 (16:9 비율 고정):**

```typescript
interface CanvasConfig {
  aspectRatio: number; // 16:9 = 1.777...
  cellSize: number; // 비율 기반 계산
  gridRows: number;
  gridCols: number;
  pixelRatio: number; // 고해상도 디스플레이 지원
  logicalWidth: number; // 논리적 너비 (비율 기반)
  logicalHeight: number; // 논리적 높이 (비율 기반)
}

class GameCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: CanvasConfig;
  private animationFrameId: number | null = null;
  private aspectRatio = 16 / 9; // 16:9 고정 비율

  constructor(canvas: HTMLCanvasElement, config: CanvasConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.config = config;
    this.setupCanvas();
    this.setupResizeObserver();
  }

  private setupCanvas() {
    // 고해상도 디스플레이 지원
    const dpr = window.devicePixelRatio || 1;
    const container = this.canvas.parentElement!;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 16:9 비율에 맞춰 크기 계산
    let canvasWidth: number;
    let canvasHeight: number;

    if (containerWidth / containerHeight > this.aspectRatio) {
      // 컨테이너가 더 넓음 - 높이 기준
      canvasHeight = containerHeight;
      canvasWidth = canvasHeight * this.aspectRatio;
    } else {
      // 컨테이너가 더 높음 - 너비 기준
      canvasWidth = containerWidth;
      canvasHeight = canvasWidth / this.aspectRatio;
    }

    // 실제 Canvas 크기 (고해상도)
    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.ctx.scale(dpr, dpr);

    // CSS 크기 (논리적 크기)
    this.canvas.style.width = `${canvasWidth}px`;
    this.canvas.style.height = `${canvasHeight}px`;

    // 논리적 크기 저장 (렌더링에 사용)
    this.config.logicalWidth = canvasWidth;
    this.config.logicalHeight = canvasHeight;
    this.config.cellSize = canvasWidth / this.config.gridCols;
  }

  private setupResizeObserver() {
    // ResizeObserver로 컨테이너 크기 변경 감지
    const resizeObserver = new ResizeObserver(() => {
      this.setupCanvas();
    });

    if (this.canvas.parentElement) {
      resizeObserver.observe(this.canvas.parentElement);
    }
  }

  // 좌표 변환: 화면 좌표 → Canvas 논리 좌표
  public screenToCanvas(x: number, y: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.config.logicalWidth / rect.width;
    const scaleY = this.config.logicalHeight / rect.height;

    return {
      x: (x - rect.left) * scaleX,
      y: (y - rect.top) * scaleY,
    };
  }

  public render(gameState: GameState) {
    this.clear();
    this.drawBackground();
    this.drawGems(gameState.board);
    this.drawParticles(gameState.particles);
    this.drawEffects(gameState.effects);
  }

  public startRenderLoop(callback: () => void) {
    const render = () => {
      callback();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  public stopRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

#### 상태 관리

**게임 상태:**

```typescript
interface GameState {
  board: Gem[][]; // 9x9 게임 보드
  score: number; // 현재 점수
  moves: number; // 남은 이동 횟수
  goals: Goal[]; // 목표 목록
  isGameOver: boolean; // 게임 종료 여부
  isPaused: boolean; // 일시정지 여부
  currentStage: number; // 현재 스테이지 번호
  specialGems: SpecialGem[]; // 활성화된 특수 젬
  isAnimating: boolean; // 애니메이션 진행 중 여부
  particles: Particle[]; // 파티클 효과
  effects: Effect[]; // 이펙트 목록
  selectedGem: { row: number; col: number } | null; // 선택된 젬
}
```

**젬 타입:**

```typescript
type GemColor = "red" | "yellow" | "blue" | "green" | "purple" | "orange";

interface Gem {
  id: string;
  color: GemColor;
  type: "normal" | "striped" | "wrapped" | "colorBomb";
  stripedDirection?: "horizontal" | "vertical";
  position: { row: number; col: number };
  x: number; // Canvas 좌표
  y: number; // Canvas 좌표
  targetX: number; // 애니메이션 목표 X
  targetY: number; // 애니메이션 목표 Y
  scale: number; // 스케일 애니메이션
  rotation: number; // 회전 애니메이션
}
```

**목표 타입:**

```typescript
type GoalType = "score" | "collect" | "clearBlock" | "clearObstacle";

interface Goal {
  type: GoalType;
  target: number; // 목표 수치
  current: number; // 현재 진행도
  gemColor?: GemColor; // 수집 목표인 경우 색상
}
```

**스테이지 진행 상태:**

```typescript
interface StageRecord {
  stageNumber: number;
  stars: number; // 0~3
  score: number;
  bestScore: number;
  completedAt: string; // ISO date string
  attempts: number;
}

interface UserSettings {
  language: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
}

interface StorageData {
  version: string; // 데이터 버전 관리 (마이그레이션용)
  highestStage: number;
  unlockedStages: number[]; // 해제된 스테이지 목록
  stageRecords: Record<number, StageRecord>; // 스테이지별 기록
  settings: UserSettings;
  lives: number;
  lastPlayed: string; // ISO date string
  totalScore: number;
  totalPlayTime: number; // 초 단위
}

// LocalStorage 키
const STORAGE_KEY = "chipPuzzleGame_data";
const STORAGE_VERSION = "1.0.0";
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한
```

#### Canvas 렌더링 시스템

**젬 렌더링:**

```typescript
class GemRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number;

  constructor(ctx: CanvasRenderingContext2D, cellSize: number) {
    this.ctx = ctx;
    this.cellSize = cellSize;
  }

  public render(gem: Gem) {
    this.ctx.save();

    // 위치 및 변환 적용
    this.ctx.translate(gem.x + this.cellSize / 2, gem.y + this.cellSize / 2);
    this.ctx.scale(gem.scale, gem.scale);
    this.ctx.rotate(gem.rotation);

    // 젬 타입에 따른 렌더링
    switch (gem.type) {
      case "normal":
        this.renderNormalGem(gem);
        break;
      case "striped":
        this.renderStripedGem(gem);
        break;
      case "wrapped":
        this.renderWrappedGem(gem);
        break;
      case "colorBomb":
        this.renderColorBomb(gem);
        break;
    }

    this.ctx.restore();
  }

  private renderNormalGem(gem: Gem) {
    const gradient = this.ctx.createLinearGradient(
      -this.cellSize / 2,
      -this.cellSize / 2,
      this.cellSize / 2,
      this.cellSize / 2
    );
    gradient.addColorStop(0, this.getColorLight(gem.color));
    gradient.addColorStop(1, this.getColorDark(gem.color));

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    // roundRect 폴리필 사용
    this.roundRect(
      -this.cellSize / 2,
      -this.cellSize / 2,
      this.cellSize,
      this.cellSize,
      12
    );
    this.ctx.fill();

    // 하이라이트 효과
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    this.ctx.beginPath();
    this.ctx.arc(0, -this.cellSize / 4, this.cellSize / 6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private renderStripedGem(gem: Gem) {
    // 기본 젬 렌더링
    this.renderNormalGem(gem);

    // 스트라이프 패턴
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.lineWidth = 3;

    if (gem.stripedDirection === "horizontal") {
      for (let i = -2; i <= 2; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(-this.cellSize / 2, i * 8);
        this.ctx.lineTo(this.cellSize / 2, i * 8);
        this.ctx.stroke();
      }
    } else {
      for (let i = -2; i <= 2; i++) {
        this.ctx.beginPath();
        this.ctx.moveTo(i * 8, -this.cellSize / 2);
        this.ctx.lineTo(i * 8, this.cellSize / 2);
        this.ctx.stroke();
      }
    }
  }

  private renderWrappedGem(gem: Gem) {
    // 기본 젬 렌더링
    this.renderNormalGem(gem);

    // 래핑 효과 (원형 테두리)
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.cellSize / 2 - 4, 0, Math.PI * 2);
    this.ctx.stroke();

    // 내부 원
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.cellSize / 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  private renderColorBomb(gem: Gem) {
    // 무지개 그라데이션
    const gradient = this.ctx.createLinearGradient(
      -this.cellSize / 2,
      -this.cellSize / 2,
      this.cellSize / 2,
      this.cellSize / 2
    );
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(0.2, "#ffd93d");
    gradient.addColorStop(0.4, "#4ecdc4");
    gradient.addColorStop(0.6, "#95e1d3");
    gradient.addColorStop(0.8, "#f38181");
    gradient.addColorStop(1, "#ff6b6b");

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    // roundRect 폴리필 (일부 브라우저 지원 안 됨)
    this.roundRect(
      -this.cellSize / 2,
      -this.cellSize / 2,
      this.cellSize,
      this.cellSize,
      12
    );
    this.ctx.fill();

    // 별 모양 효과
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    this.ctx.beginPath();
    this.drawStar(0, 0, 5, this.cellSize / 3, this.cellSize / 6);
    this.ctx.fill();
  }

  // roundRect 폴리필 (브라우저 호환성)
  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    if (this.ctx.roundRect) {
      // 네이티브 roundRect 지원
      this.ctx.roundRect(x, y, width, height, radius);
    } else {
      // 폴리필 구현
      this.ctx.beginPath();
      this.ctx.moveTo(x + radius, y);
      this.ctx.lineTo(x + width - radius, y);
      this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      this.ctx.lineTo(x + width, y + height - radius);
      this.ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
      );
      this.ctx.lineTo(x + radius, y + height);
      this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      this.ctx.lineTo(x, y + radius);
      this.ctx.quadraticCurveTo(x, y, x + radius, y);
      this.ctx.closePath();
    }
  }

  // 별 그리기 메서드
  private drawStar(
    x: number,
    y: number,
    points: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    const angle = Math.PI / points;
    this.ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const currentAngle = i * angle - Math.PI / 2;
      const px = x + Math.cos(currentAngle) * radius;
      const py = y + Math.sin(currentAngle) * radius;
      if (i === 0) {
        this.ctx.moveTo(px, py);
      } else {
        this.ctx.lineTo(px, py);
      }
    }
    this.ctx.closePath();
  }

  private getColorLight(color: GemColor): string {
    const colors = {
      red: "#ff6b6b",
      yellow: "#ffd93d",
      blue: "#4ecdc4",
      green: "#95e1d3",
      purple: "#a29bfe",
      orange: "#fd79a8",
    };
    return colors[color];
  }

  private getColorDark(color: GemColor): string {
    const colors = {
      red: "#ee5a6f",
      yellow: "#ffc312",
      blue: "#44a08d",
      green: "#6c5ce7",
      purple: "#6c5ce7",
      orange: "#e84393",
    };
    return colors[color];
  }
}
```

**파티클 시스템:**

```typescript
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

class ParticleSystem {
  private particles: Particle[] = [];
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public emit(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        maxLife: 1,
        color,
        size: Math.random() * 4 + 2,
      });
    }
  }

  public update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];

      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // 중력
      particle.life -= deltaTime / 1000;

      if (particle.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render() {
    this.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
}
```

**애니메이션 관리:**

```typescript
class AnimationManager {
  private animations: Animation[] = [];

  public addAnimation(animation: Animation) {
    this.animations.push(animation);
  }

  public update(deltaTime: number) {
    for (let i = this.animations.length - 1; i >= 0; i--) {
      const animation = this.animations[i];
      animation.update(deltaTime);

      if (animation.isComplete()) {
        this.animations.splice(i, 1);
      }
    }
  }

  public isAnimating(): boolean {
    return this.animations.length > 0;
  }
}

interface Animation {
  update(deltaTime: number): void;
  isComplete(): boolean;
  apply(target: any): void;
}
```

#### Canvas 이벤트 처리

```typescript
class CanvasEventHandler {
  private canvas: HTMLCanvasElement;
  private gameCanvas: GameCanvas; // GameCanvas 인스턴스 참조 추가
  private config: CanvasConfig; // config 추가
  private onGemSelect: (row: number, col: number) => void;
  private onGemSwap: (
    from: { row: number; col: number },
    to: { row: number; col: number }
  ) => void;
  private selectedGem: { row: number; col: number } | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    gameCanvas: GameCanvas, // GameCanvas 인스턴스 주입
    config: CanvasConfig, // config 주입
    onGemSelect: (row: number, col: number) => void,
    onGemSwap: (
      from: { row: number; col: number },
      to: { row: number; col: number }
    ) => void
  ) {
    this.canvas = canvas;
    this.gameCanvas = gameCanvas;
    this.config = config;
    this.onGemSelect = onGemSelect;
    this.onGemSwap = onGemSwap;
    this.setupEvents();
  }

  private setupEvents() {
    // 마우스 이벤트
    this.canvas.addEventListener("mousedown", this.handleMouseDown.bind(this));
    this.canvas.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.canvas.addEventListener("mouseup", this.handleMouseUp.bind(this));
    this.canvas.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this)
    );

    // 터치 이벤트
    this.canvas.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false }
    );
    this.canvas.addEventListener("touchmove", this.handleTouchMove.bind(this), {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleTouchEnd.bind(this));
  }

  public cleanup() {
    // 이벤트 리스너 정리 (메모리 누수 방지)
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("mouseleave", this.handleMouseLeave);
    this.canvas.removeEventListener("touchstart", this.handleTouchStart);
    this.canvas.removeEventListener("touchmove", this.handleTouchMove);
    this.canvas.removeEventListener("touchend", this.handleTouchEnd);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private getGemPosition(
    x: number,
    y: number
  ): { row: number; col: number } | null {
    // Canvas의 논리적 좌표로 변환 (16:9 비율 고려)
    const canvasPos = this.gameCanvas.screenToCanvas(x, y);
    const cellSize = this.config.cellSize;
    const gridCols = this.config.gridCols;
    const gridRows = this.config.gridRows;

    // Canvas 중앙 기준으로 그리드 위치 계산
    const canvasCenterX = this.config.logicalWidth / 2;
    const canvasCenterY = this.config.logicalHeight / 2;
    const gridWidth = cellSize * gridCols;
    const gridHeight = cellSize * gridRows;
    const gridStartX = canvasCenterX - gridWidth / 2;
    const gridStartY = canvasCenterY - gridHeight / 2;

    const col = Math.floor((canvasPos.x - gridStartX) / cellSize);
    const row = Math.floor((canvasPos.y - gridStartY) / cellSize);

    if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
      return { row, col };
    }

    return null;
  }

  private handleMouseDown(e: MouseEvent) {
    e.preventDefault();
    const pos = this.getGemPosition(e.clientX, e.clientY);
    if (pos) {
      this.selectedGem = pos;
      this.onGemSelect(pos.row, pos.col);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    // 호버 효과 등
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.selectedGem) {
      const pos = this.getGemPosition(e.clientX, e.clientY);
      if (
        pos &&
        (pos.row !== this.selectedGem.row || pos.col !== this.selectedGem.col)
      ) {
        // 인접한 젬인지 확인
        const rowDiff = Math.abs(pos.row - this.selectedGem.row);
        const colDiff = Math.abs(pos.col - this.selectedGem.col);
        if (
          (rowDiff === 1 && colDiff === 0) ||
          (rowDiff === 0 && colDiff === 1)
        ) {
          this.onGemSwap(this.selectedGem, pos);
        }
      }
      this.selectedGem = null;
    }
  }

  private handleMouseLeave() {
    this.selectedGem = null;
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const pos = this.getGemPosition(touch.clientX, touch.clientY);
    if (pos) {
      this.selectedGem = pos;
      this.onGemSelect(pos.row, pos.col);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    if (this.selectedGem && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const pos = this.getGemPosition(touch.clientX, touch.clientY);
      if (
        pos &&
        (pos.row !== this.selectedGem.row || pos.col !== this.selectedGem.col)
      ) {
        const rowDiff = Math.abs(pos.row - this.selectedGem.row);
        const colDiff = Math.abs(pos.col - this.selectedGem.col);
        if (
          (rowDiff === 1 && colDiff === 0) ||
          (rowDiff === 0 && colDiff === 1)
        ) {
          this.onGemSwap(this.selectedGem, pos);
        }
      }
      this.selectedGem = null;
    }
  }
}
```

#### 핵심 알고리즘

1. **매칭 감지 알고리즘**

```typescript
interface Match {
  type: "horizontal" | "vertical";
  positions: { row: number; col: number }[];
}

function findMatches(board: Gem[][]): Match[] {
  const matches: Match[] = [];
  const processed = new Set<string>(); // 중복 매칭 방지

  // 가로 매칭 검사
  for (let row = 0; row < board.length; row++) {
    let count = 1;
    let currentColor = board[row][0]?.color;
    let startCol = 0;

    for (let col = 1; col <= board[row].length; col++) {
      const gem = board[row][col];
      if (gem && gem.color === currentColor) {
        count++;
      } else {
        // 매칭 발견 (3개 이상)
        if (count >= 3 && currentColor) {
          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < count; i++) {
            const pos = { row, col: startCol + i };
            const key = `${pos.row},${pos.col}`;
            if (!processed.has(key)) {
              positions.push(pos);
              processed.add(key);
            }
          }
          if (positions.length > 0) {
            matches.push({
              type: "horizontal",
              positions,
            });
          }
        }
        // 다음 매칭 검사 준비
        if (gem) {
          count = 1;
          currentColor = gem.color;
          startCol = col;
        }
      }
    }
  }

  // 세로 매칭 검사
  for (let col = 0; col < board[0].length; col++) {
    let count = 1;
    let currentColor = board[0][col]?.color;
    let startRow = 0;

    for (let row = 1; row <= board.length; row++) {
      const gem = board[row]?.[col];
      if (gem && gem.color === currentColor) {
        count++;
      } else {
        // 매칭 발견 (3개 이상)
        if (count >= 3 && currentColor) {
          const positions: { row: number; col: number }[] = [];
          for (let i = 0; i < count; i++) {
            const pos = { row: startRow + i, col };
            const key = `${pos.row},${pos.col}`;
            if (!processed.has(key)) {
              positions.push(pos);
              processed.add(key);
            }
          }
          if (positions.length > 0) {
            matches.push({
              type: "vertical",
              positions,
            });
          }
        }
        // 다음 매칭 검사 준비
        if (gem) {
          count = 1;
          currentColor = gem.color;
          startRow = row;
        }
      }
    }
  }

  return matches;
}
```

2. **중력 시스템 (Canvas 애니메이션 포함)**

```typescript
// TweenAnimation 클래스 정의
class TweenAnimation implements Animation {
  private target: any;
  private property: string;
  private startValue: number;
  private endValue: number;
  private duration: number;
  private elapsed: number = 0;
  private easing: (t: number) => number;

  constructor(
    target: any,
    property: string,
    startValue: number,
    endValue: number,
    duration: number,
    easing?: (t: number) => number
  ) {
    this.target = target;
    this.property = property;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.easing = easing || ((t) => t); // 기본 linear easing
  }

  update(deltaTime: number): void {
    this.elapsed += deltaTime;
    const progress = Math.min(this.elapsed / this.duration, 1);
    const easedProgress = this.easing(progress);
    const currentValue =
      this.startValue + (this.endValue - this.startValue) * easedProgress;
    this.target[this.property] = currentValue;
  }

  isComplete(): boolean {
    return this.elapsed >= this.duration;
  }

  apply(target: any): void {
    target[this.property] = this.endValue;
  }
}

// Easing 함수들
const Easing = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

// 새 젬 생성 함수
function generateNewGem(
  row: number,
  col: number,
  cellSize: number,
  gemColors: GemColor[]
): Gem {
  const randomColor = gemColors[Math.floor(Math.random() * gemColors.length)];
  return {
    id: `${row}-${col}-${Date.now()}`,
    color: randomColor,
    type: "normal",
    position: { row, col },
    x: col * cellSize,
    y: row * cellSize,
    targetX: col * cellSize,
    targetY: row * cellSize,
    scale: 1,
    rotation: 0,
  };
}

function applyGravityWithAnimation(
  board: Gem[][],
  animationManager: AnimationManager,
  cellSize: number,
  gemColors: GemColor[]
): Promise<void> {
  return new Promise((resolve) => {
    // 각 열마다 아래에서 위로 검사
    for (let col = 0; col < board[0].length; col++) {
      let writeIndex = board.length - 1;

      for (let row = board.length - 1; row >= 0; row--) {
        if (board[row][col] !== null) {
          if (writeIndex !== row) {
            // 애니메이션 추가
            const gem = board[row][col]!;
            const targetY = writeIndex * cellSize;

            animationManager.addAnimation(
              new TweenAnimation(gem, "y", gem.y, targetY, 300, Easing.easeOut)
            );

            board[writeIndex][col] = gem;
            gem.position.row = writeIndex;
            gem.targetY = targetY;
            board[row][col] = null;
          }
          writeIndex--;
        }
      }

      // 빈 공간에 새 젬 생성 (위에서 떨어지는 애니메이션)
      while (writeIndex >= 0) {
        const newGem = generateNewGem(writeIndex, col, cellSize, gemColors);
        newGem.y = -cellSize; // 위에서 시작
        newGem.targetY = writeIndex * cellSize;
        animationManager.addAnimation(
          new TweenAnimation(
            newGem,
            "y",
            -cellSize,
            writeIndex * cellSize,
            300,
            Easing.easeOut
          )
        );
        board[writeIndex][col] = newGem;
        writeIndex--;
      }
    }

    // 애니메이션 완료 대기
    const checkComplete = () => {
      if (!animationManager.isAnimating()) {
        resolve();
      } else {
        requestAnimationFrame(checkComplete);
      }
    };
    checkComplete();
  });
}
```

3. **연쇄 반응 처리**

```typescript
// 젬 색상 유틸리티 함수
function getGemColorLight(color: GemColor): string {
  const colors = {
    red: "#ff6b6b",
    yellow: "#ffd93d",
    blue: "#4ecdc4",
    green: "#95e1d3",
    purple: "#a29bfe",
    orange: "#fd79a8",
  };
  return colors[color];
}

// 매칭 제거 애니메이션 함수
async function removeMatchesWithAnimation(
  board: Gem[][],
  matches: Match[],
  animationManager: AnimationManager,
  particleSystem: ParticleSystem
): Promise<void> {
  return new Promise((resolve) => {
    // 매칭된 젬 제거 및 애니메이션
    matches.forEach((match) => {
      match.positions.forEach((pos) => {
        const gem = board[pos.row][pos.col];
        if (gem) {
          // 파티클 효과
          particleSystem.emit(gem.x, gem.y, getGemColorLight(gem.color));

          // 제거 애니메이션 (페이드 아웃 + 스케일 다운)
          animationManager.addAnimation(
            new TweenAnimation(gem, "scale", 1, 0, 200, Easing.easeIn)
          );
          animationManager.addAnimation(
            new TweenAnimation(gem, "rotation", 0, Math.PI * 2, 200)
          );

          // 보드에서 제거
          board[pos.row][pos.col] = null;
        }
      });
    });

    // 애니메이션 완료 대기
    const checkComplete = () => {
      if (!animationManager.isAnimating()) {
        resolve();
      } else {
        requestAnimationFrame(checkComplete);
      }
    };
    setTimeout(() => checkComplete(), 250); // 최소 애니메이션 시간
  });
}

async function processCascade(
  board: Gem[][],
  animationManager: AnimationManager,
  particleSystem: ParticleSystem,
  cellSize: number,
  gemColors: GemColor[],
  maxCascadeLevel: number = 50 // 무한 루프 방지
): Promise<number> {
  let hasMatches = true;
  let cascadeLevel = 0;

  while (hasMatches && cascadeLevel < maxCascadeLevel) {
    const matches = findMatches(board);

    if (matches.length === 0) {
      hasMatches = false;
      break;
    }

    // 매칭 제거 애니메이션
    await removeMatchesWithAnimation(
      board,
      matches,
      animationManager,
      particleSystem
    );

    // 중력 적용 (애니메이션 포함)
    await applyGravityWithAnimation(
      board,
      animationManager,
      cellSize,
      gemColors
    );

    cascadeLevel++;
  }

  return cascadeLevel;
}
```

#### 스테이지 벨런싱 및 수치화 시스템

**벨런싱 철학:**

- **점진적 난이도 증가**: 플레이어가 좌절하지 않도록 부드러운 난이도 곡선
- **성취감 극대화**: 적절한 도전과 보상의 균형
- **재플레이 가치**: 3스타 달성을 위한 동기 부여
- **데이터 기반 조정**: 플레이어 데이터 수집 및 분석 기반 조정

**벨런싱 데이터 수집:**

```typescript
interface GameAnalytics {
  stageNumber: number;
  attempts: number; // 시도 횟수
  completionTime: number; // 완료 시간 (초)
  score: number;
  movesUsed: number;
  stars: number;
  specialGemsUsed: number;
  completedAt: string; // ISO date string
}

// LocalStorage에 익명 데이터 저장 (개인정보 보호)
function collectGameData(analytics: GameAnalytics): void {
  try {
    const existing = localStorage.getItem("game_analytics");
    const data = existing ? JSON.parse(existing) : [];
    data.push(analytics);

    // 최대 1000개까지만 저장 (용량 제한)
    if (data.length > 1000) {
      data.shift();
    }

    localStorage.setItem("game_analytics", JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save analytics:", error);
  }
}

// 선택사항: Google Analytics 통합
function sendToAnalytics(event: string, params: Record<string, any>): void {
  // Google Analytics 4 (gtag) 또는 자체 서버로 전송
  if (typeof gtag !== "undefined") {
    gtag("event", event, params);
  }
}
```

**개인정보 보호:**

- 수집 데이터: 게임 플레이 통계만 (익명)
- 개인 식별 정보 수집 안 함
- LocalStorage에만 저장 (서버 전송 선택사항)
- 사용자 동의 후에만 분석 도구 사용

**난이도 곡선 설계:**

**초반 스테이지 (1~100):**

- 목표 점수: 5,000 ~ 20,000
- 최대 이동 횟수: 25 ~ 35회
- 목표 달성 난이도: 쉬움
- 특수 젬 생성 빈도: 낮음

**중반 스테이지 (101~500):**

- 목표 점수: 20,000 ~ 80,000
- 최대 이동 횟수: 20 ~ 30회
- 목표 달성 난이도: 보통
- 특수 젬 생성 빈도: 중간
- 장애물 도입

**후반 스테이지 (501~1000):**

- 목표 점수: 80,000 ~ 200,000+
- 최대 이동 횟수: 15 ~ 25회
- 목표 달성 난이도: 어려움
- 특수 젬 생성 빈도: 높음
- 복잡한 장애물 조합

**별점 시스템 (3스타):**

```typescript
interface StarCriteria {
  score: {
    threeStar: number; // 3스타 목표 점수
    twoStar: number; // 2스타 목표 점수
    oneStar: number; // 1스타 목표 점수
  };
  moves: {
    threeStar: number; // 3스타 남은 이동 횟수
    twoStar: number;
    oneStar: number;
  };
}

function calculateStars(
  score: number,
  remainingMoves: number,
  criteria: StarCriteria
): number {
  let stars = 0;

  // 점수 기준
  if (score >= criteria.score.threeStar) {
    stars = Math.max(stars, 3);
  } else if (score >= criteria.score.twoStar) {
    stars = Math.max(stars, 2);
  } else if (score >= criteria.score.oneStar) {
    stars = Math.max(stars, 1);
  }

  // 남은 이동 횟수 보너스
  if (remainingMoves >= criteria.moves.threeStar) {
    stars = Math.max(stars, 3);
  } else if (remainingMoves >= criteria.moves.twoStar) {
    stars = Math.max(stars, 2);
  }

  return stars;
}
```

**점수 계산 시스템:**

```typescript
function calculateScore(
  matches: Match[],
  cascadeLevel: number,
  specialGemBonus: number
): number {
  let baseScore = 0;

  // 기본 매칭 점수
  matches.forEach((match) => {
    baseScore += match.positions.length * 10;
  });

  // 연쇄 보너스 (연쇄 레벨 * 2배)
  baseScore *= 1 + cascadeLevel * 0.5;

  // 특수 젬 보너스
  baseScore += specialGemBonus;

  return Math.floor(baseScore);
}
```

**벨런싱 테이블 예시:**

| 스테이지 | 목표 점수 (3스타) | 최대 이동 | 난이도     |
| -------- | ----------------- | --------- | ---------- |
| 1        | 5,000             | 30        | ⭐         |
| 50       | 15,000            | 28        | ⭐⭐       |
| 100      | 25,000            | 25        | ⭐⭐⭐     |
| 200      | 40,000            | 22        | ⭐⭐       |
| 400      | 70,000            | 20        | ⭐⭐⭐     |
| 500      | 90,000            | 18        | ⭐⭐⭐⭐   |
| 600      | 120,000           | 20        | ⭐⭐⭐     |
| 800      | 160,000           | 18        | ⭐⭐⭐⭐   |
| 1000     | 200,000           | 15        | ⭐⭐⭐⭐⭐ |

## 6. UI/UX 설계

### 레이아웃 구조

**전체 레이아웃 (3단 구조):**

```
┌─────────────────────────────────────┐
│         헤더 (Header)                │
│  - 로고                              │
│  - 네비게이션 메뉴                   │
│  - 언어 선택                         │
├─────────────────────────────────────┤
│                                     │
│      게임 영역 (Game Container)      │
│      ┌───────────────────────┐      │
│      │                       │      │
│      │   Canvas (16:9)       │      │
│      │   게임 렌더링         │      │
│      │                       │      │
│      └───────────────────────┘      │
│                                     │
├─────────────────────────────────────┤
│         푸터 (Footer)                │
│  - 개인정보처리방침                  │
│  - 문의하기                          │
│  - 언어 선택                         │
│  - 저작권 정보                       │
└─────────────────────────────────────┘
```

**반응형 처리:**

- **데스크탑**: 헤더/푸터 고정 높이, 게임 영역이 나머지 공간 차지
- **모바일**: 헤더/푸터 최소화, 게임 영역 최대화
- **Canvas**: 항상 16:9 비율 유지, 컨테이너 크기에 맞춰 자동 조절

### 디자인 원칙

- 깔끔하고 직관적인 인터페이스
- **반응형 디자인**: 모바일 퍼스트 접근 방식
- **모바일 앱 스타일**: 네이티브 앱과 유사한 UI/UX
- **16:9 Canvas 비율**: 모든 화면 크기에서 일관된 비율 유지
- 부드러운 Canvas 애니메이션 및 전환 효과
- 접근성 고려 (키보드 네비게이션, 터치 제스처)

### 다국어 지원 (i18n)

**지원 언어:**

- 영어 (en) - 기본값
- 한국어 (ko)
- 중국어 (zh)
- 일본어 (ja)

**언어 감지 및 설정:**

```typescript
class LanguageService {
  private supportedLanguages = ["en", "ko", "zh", "ja"];
  private defaultLanguage = "en";

  // 브라우저 언어 자동 감지
  public detectBrowserLanguage(): string {
    const browserLang = navigator.language.split("-")[0]; // "ko-KR" -> "ko"

    if (this.supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    return this.defaultLanguage;
  }

  // LocalStorage에서 저장된 언어 불러오기
  public getStoredLanguage(): string | null {
    return localStorage.getItem("language");
  }

  // 언어 설정
  public setLanguage(lang: string): void {
    if (this.supportedLanguages.includes(lang)) {
      localStorage.setItem("language", lang);
      // 언어 변경 이벤트 발생
      window.dispatchEvent(
        new CustomEvent("languageChanged", { detail: lang })
      );
    }
  }

  // 현재 언어 가져오기
  public getCurrentLanguage(): string {
    const stored = this.getStoredLanguage();
    if (stored) return stored;

    return this.detectBrowserLanguage();
  }
}
```

**언어 파일 구조:**

```json
// locales/en.json
{
  "header": {
    "logo": "CHIP GAMES",
    "playGame": "Play Game",
    "guide": "Guide",
    "gameDescription": "Game Description",
    "howToUse": "How to Use",
    "help": "Help"
  },
  "game": {
    "score": "Score",
    "moves": "Moves",
    "goal": "Goal",
    "stage": "Stage",
    "startGame": "Start Game"
  },
  "footer": {
    "privacyPolicy": "Privacy Policy",
    "contactUs": "Contact Us",
    "copyright": "© 2025 ChipGames. All rights reserved."
  }
}

// locales/ko.json
{
  "header": {
    "logo": "CHIP GAMES",
    "playGame": "게임하기",
    "guide": "가이드",
    "gameDescription": "게임 설명",
    "howToUse": "이용 방법",
    "help": "도움말"
  },
  "game": {
    "score": "점수",
    "moves": "이동 횟수",
    "goal": "목표",
    "stage": "스테이지",
    "startGame": "게임 시작"
  },
  "footer": {
    "privacyPolicy": "개인정보처리방침",
    "contactUs": "문의하기",
    "copyright": "© 2025 ChipGames. All rights reserved."
  }
}
```

**언어 선택 컴포넌트:**

```typescript
const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "en", name: "English" },
    { code: "ko", name: "한국어" },
    { code: "zh", name: "中文" },
    { code: "ja", name: "日本語" },
  ];

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      className="language-selector"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name}
        </option>
      ))}
    </select>
  );
};
```

**언어 훅:**

```typescript
// 언어 파일 동적 import (Vite 호환)
const translationsCache: Record<string, any> = {};

const useLanguage = () => {
  const [language, setLanguageState] = useState<string>(() => {
    const service = new LanguageService();
    return service.getCurrentLanguage();
  });
  const [translations, setTranslations] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 언어 파일 동적 로드
  useEffect(() => {
    const loadTranslations = async () => {
      setIsLoading(true);
      try {
        // 캐시 확인
        if (translationsCache[language]) {
          setTranslations(translationsCache[language]);
          setIsLoading(false);
          return;
        }

        // 동적 import (Vite에서 지원)
        const module = await import(`../locales/${language}.json`);
        translationsCache[language] = module.default;
        setTranslations(module.default);
      } catch (error) {
        console.error(`Failed to load translations for ${language}:`, error);
        // 폴백: 영어 로드
        const fallback = await import(`../locales/en.json`);
        setTranslations(fallback.default);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: string) => {
    const service = new LanguageService();
    service.setLanguage(lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    if (isLoading || !translations) {
      return key; // 로딩 중이면 키 반환
    }

    const keys = key.split(".");
    let value = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }

    return value || key;
  };

  return { language, setLanguage, t, isLoading };
};
```

### 반응형 디자인 전략

**레이아웃 구조 (반응형):**

```css
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.header {
  flex-shrink: 0;
  height: 60px; /* 데스크탑 */
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.game-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a2a2a;
  padding: 20px;
  overflow: hidden;
  min-height: 0; /* Flexbox 오버플로우 방지 */
}

.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-canvas {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9; /* 16:9 비율 고정 */
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.footer {
  flex-shrink: 0;
  height: 50px; /* 데스크탑 */
  background: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

/* 모바일 */
@media (max-width: 768px) {
  .header {
    height: 50px;
    padding: 0 10px;
  }

  .footer {
    height: 40px;
    padding: 0 10px;
  }

  .game-container {
    padding: 10px;
  }
}
```

**데스크탑 최적화 UI/UX (1024px 이상):**

- **레이아웃**: 헤더(60px) + 게임 영역(나머지) + 푸터(50px)
- **네비게이션**: 상단 헤더에 메뉴 배치
- **Canvas**: 16:9 비율 유지, 최대 크기로 렌더링
- **인터랙션**: 마우스 드래그, 호버 피드백
- **정보 표시**: 헤더 또는 게임 영역 내 정보 패널
- **광고 배치**: 푸터 영역 또는 게임 완료 후

**모바일 최적화 UI/UX (768px 이하):**

- **레이아웃**: 헤더(50px) + 게임 영역(나머지) + 푸터(40px)
- **네비게이션**: 헤더에 간소화된 메뉴
- **Canvas**: 16:9 비율 유지, 화면에 맞춰 자동 조절
- **인터랙션**: 터치 피드백, 햅틱 피드백
- **정보 표시**: 최소화, 필요시 모달
- **광고 배치**: 푸터 또는 게임 완료 후
- **성능**: Canvas 최적화, 효율적인 렌더링

### 화면 구성

1. **헤더 (Header)**

   - **로고**: 왼쪽 상단에 "CHIP GAMES" 로고
   - **네비게이션 메뉴**: 중앙 또는 오른쪽
     - 게임하기 (Play Game)
     - 가이드 (Guide)
     - 게임 설명 (Game Description)
     - 이용 방법 (How to Use)
     - 도움말 (Help)
   - **언어 선택**: 오른쪽 상단 드롭다운
     - 영어 / 한국어 / 중국어 / 일본어

2. **게임 영역 (Game Container)**

   - **Canvas 게임 보드**: 16:9 비율로 중앙 배치
     - 모든 게임 렌더링이 Canvas 내에서 처리
     - 화면 크기 변경 시 자동으로 비율 유지
     - 반응형 크기 조절 (컨테이너에 맞춰 자동 조절)
   - **게임 정보**: Canvas 위 오버레이 또는 헤더에 표시
     - 스테이지 번호
     - 점수
     - 이동 횟수
     - 목표 정보
   - **컨트롤**: Canvas 위 오버레이 또는 헤더
     - 일시정지 버튼
     - 부스터 버튼

3. **푸터 (Footer)**

   - **링크**: 왼쪽
     - 개인정보처리방침 (Privacy Policy)
     - 문의하기 (Contact Us)
   - **언어 선택**: 중앙 또는 오른쪽 (헤더와 동일)
   - **저작권 정보**: 오른쪽
     - "© 2025 ChipGames. All rights reserved."

4. **스테이지 선택 화면** (게임 영역 내)

   - 스테이지 그리드 (1~1000)
   - 스테이지 카드 표시:
     - 해제된 스테이지: 클릭 가능, 별점 표시
     - 잠긴 스테이지: 회색 처리, 잠금 아이콘
     - 현재 진행 중: 하이라이트
   - 모바일: 페이지네이션 또는 무한 스크롤

5. **승리/실패 화면 (모달)**

   - Canvas 위 오버레이 모달
   - 승리: 축하 메시지, 점수, 별점, 다음 스테이지 버튼
   - 실패: 실패 메시지, 생명 소모 안내, 다시 시도 버튼

## 7. 에러 처리 및 예외 상황

### 에러 처리 전략

**Error Boundary 컴포넌트:**

```typescript
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // 에러 로깅 서비스에 전송 (선택사항)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>오류가 발생했습니다</h2>
            <p>게임을 새로고침해주세요.</p>
            <button onClick={() => window.location.reload()}>새로고침</button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

**에러 처리 시나리오:**

1. **Canvas 초기화 실패**

   - Fallback: HTML 기반 게임 보드로 전환
   - 사용자 메시지: "Canvas를 지원하지 않는 브라우저입니다"

2. **LocalStorage 사용 불가**

   - Fallback: 메모리 기반 저장 (세션 동안만 유지)
   - 사용자 메시지: "데이터 저장 기능을 사용할 수 없습니다"

3. **네트워크 오류 (광고 로드 실패)**

   - Fallback: 광고 없이 게임 진행
   - 조용히 실패 처리 (사용자 경험 방해 최소화)

4. **게임 상태 복구**
   - LocalStorage에서 마지막 상태 복원
   - 복구 실패 시 새 게임 시작

## 8. 테스트 전략

### 테스트 도구

- **단위 테스트**: Jest + React Testing Library
- **통합 테스트**: Jest
- **E2E 테스트**: Playwright 또는 Cypress (선택사항)
- **코드 커버리지**: Jest Coverage

### 테스트 범위

**단위 테스트 (핵심 알고리즘):**

```typescript
// matchDetection.test.ts
describe("findMatches", () => {
  it("should find horizontal matches", () => {
    const board = createTestBoard([
      ["red", "red", "red", "blue", "green"],
      // ...
    ]);
    const matches = findMatches(board);
    expect(matches).toHaveLength(1);
    expect(matches[0].type).toBe("horizontal");
  });

  it("should find vertical matches", () => {
    // ...
  });

  it("should prevent duplicate matches", () => {
    // ...
  });
});

// gravity.test.ts
describe("applyGravity", () => {
  it("should move gems down", () => {
    // ...
  });

  it("should generate new gems at top", () => {
    // ...
  });
});
```

**컴포넌트 테스트:**

```typescript
// GameBoard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { GameBoard } from "./GameBoard";

describe("GameBoard", () => {
  it("should render game board", () => {
    render(<GameBoard />);
    expect(screen.getByTestId("game-board")).toBeInTheDocument();
  });

  it("should handle gem selection", () => {
    // ...
  });
});
```

**테스트 커버리지 목표:**

- 핵심 알고리즘: 90% 이상
- 유틸리티 함수: 80% 이상
- 컴포넌트: 70% 이상
- 전체 평균: 75% 이상

## 9. 성능 최적화 전략

### Canvas 렌더링 최적화

**더티 체킹:**

```typescript
class GameCanvas {
  private dirtyRegions: Set<string> = new Set();
  private lastRenderTime: number = 0;

  public markDirty(row: number, col: number) {
    this.dirtyRegions.add(`${row},${col}`);
  }

  public render(gameState: GameState) {
    const now = performance.now();
    const deltaTime = now - this.lastRenderTime;

    // 더티 영역만 렌더링
    if (this.dirtyRegions.size > 0) {
      this.clearDirtyRegions();
      this.dirtyRegions.forEach((region) => {
        const [row, col] = region.split(",").map(Number);
        this.drawGem(gameState.board[row][col]);
      });
      this.dirtyRegions.clear();
    } else {
      // 전체 렌더링 (초기 로드 시)
      this.clear();
      this.drawBackground();
      this.drawGems(gameState.board);
    }

    // 파티클 및 이펙트는 항상 렌더링
    this.drawParticles(gameState.particles);
    this.drawEffects(gameState.effects);

    this.lastRenderTime = now;
  }
}
```

**객체 풀링:**

```typescript
class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];

  public acquire(): Particle {
    let particle = this.pool.pop();
    if (!particle) {
      particle = this.createParticle();
    }
    this.active.push(particle);
    return particle;
  }

  public release(particle: Particle) {
    const index = this.active.indexOf(particle);
    if (index > -1) {
      this.active.splice(index, 1);
      this.resetParticle(particle);
      this.pool.push(particle);
    }
  }
}
```

**프레임 드롭 처리:**

```typescript
class PerformanceMonitor {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = performance.now();

  public update() {
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;

      // FPS가 낮으면 품질 조정
      if (this.fps < 30) {
        this.adjustQuality("low");
      } else if (this.fps < 45) {
        this.adjustQuality("medium");
      } else {
        this.adjustQuality("high");
      }
    }
  }

  private adjustQuality(level: "low" | "medium" | "high") {
    // 파티클 수, 애니메이션 품질 등 조정
  }
}
```

## 10. 보안 고려사항

### 보안 전략

1. **XSS 방지**

   - 사용자 입력 검증 및 sanitization
   - React의 기본 XSS 방지 기능 활용
   - LocalStorage 데이터 검증

2. **Content Security Policy (CSP)**

   ```html
   <meta
     http-equiv="Content-Security-Policy"
     content="default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline';"
   />
   ```

3. **데이터 검증**
   ```typescript
   function validateStorageData(data: any): data is StorageData {
     return (
       typeof data === "object" &&
       typeof data.version === "string" &&
       typeof data.highestStage === "number" &&
       Array.isArray(data.unlockedStages)
     );
   }
   ```

## 11. 접근성 (A11y) 구현

### 접근성 전략

**ARIA 속성:**

```typescript
<canvas
  role="application"
  aria-label="매칭 퍼즐 게임 보드"
  aria-live="polite"
  aria-atomic="true"
>
  {/* 게임 보드 */}
</canvas>

<button
  aria-label="일시정지"
  aria-pressed={isPaused}
  onClick={handlePause}
>
  {isPaused ? "재개" : "일시정지"}
</button>
```

**키보드 네비게이션:**

- **화살표 키**: 젬 선택 및 이동
- **Space/Enter**: 젬 선택 확인
- **Escape**: 일시정지 메뉴
- **Tab**: UI 요소 간 이동

**스크린 리더 지원:**

- 모든 버튼과 컨트롤에 적절한 aria-label
- 게임 상태 변경 시 aria-live로 알림
- 색상 대비 비율: WCAG AA 준수 (4.5:1 이상)

## 12. 코드 아키텍처 및 설계 원칙

### 엔터프라이즈급 코드 구조

**디렉토리 구조 원칙:**

- **관심사 분리**: 기능별, 도메인별 폴더 구조
- **계층화**: Components → Services → Utils → Types
- **재사용성**: 공통 컴포넌트, 유틸리티 분리
- **확장성**: 새로운 기능 추가 시 기존 코드 영향 최소화

**네이밍 컨벤션:**

- **컴포넌트**: PascalCase (GameBoard.tsx)
- **훅**: camelCase with 'use' prefix (useGameState.ts)
- **유틸리티**: camelCase (matchDetection.ts)
- **타입/인터페이스**: PascalCase (GameState, Gem)
- **상수**: UPPER_SNAKE_CASE (MAX_STAGES, GEM_COLORS)

**코드 품질 원칙:**

- **타입 안정성**: TypeScript strict mode
- **단일 책임 원칙**: 각 함수/클래스는 하나의 책임만
- **DRY**: 중복 코드 제거
- **SOLID 원칙**: 객체지향 설계 원칙 준수
- **테스트 가능성**: 순수 함수, 의존성 주입

## 13. PWA 구현 세부사항

### Service Worker 전략

**캐싱 전략:**

```typescript
// service-worker.ts
const CACHE_NAME = "chip-puzzle-game-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/assets/index.js",
  "/assets/index.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

**manifest.json:**

```json
{
  "name": "Chip Puzzle Game",
  "short_name": "Chip Puzzle",
  "description": "1000개의 도전적인 스테이지가 있는 매칭 퍼즐 게임",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1a1a",
  "theme_color": "#2a2a2a",
  "orientation": "any",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**오프라인 폴백:**

- 오프라인 시 기본 게임 화면 표시
- LocalStorage 데이터는 오프라인에서도 작동
- 온라인 복구 시 자동 동기화

## 14. 광고 수익 모델

### 광고 전략

**광고 배치 위치:**

1. **스테이지 선택 화면**

   - 하단 배너 광고 (모바일)
   - 사이드바 광고 (데스크탑)

2. **게임 완료 후**

   - 보상형 동영상 광고 (선택사항)
   - 전면 광고 (간헐적)

3. **게임 중**
   - 최소화 (사용자 경험 우선)

**광고 플랫폼:**

- **Google AdSense**: 기본 광고 플랫폼
- **대체 옵션**: Media.net, PropellerAds

## 15. SEO 최적화

### SEO 전략

**기본 SEO 설정:**

1. **메타 태그 최적화**

```html
<title>매칭 퍼즐 게임 - 1000개의 도전적인 스테이지</title>
<meta
  name="description"
  content="무료 온라인 매칭 퍼즐 게임. 1000개의 스테이지를 클리어하세요!"
/>
<meta
  name="keywords"
  content="매칭게임, 퍼즐게임, 게임, 무료게임, 온라인게임"
/>
```

2. **Open Graph 태그**

```html
<meta property="og:title" content="매칭 퍼즐 게임" />
<meta property="og:description" content="1000개의 도전적인 스테이지" />
<meta property="og:image" content="/og-image.png" />
<meta property="og:type" content="website" />
```

3. **구조화된 데이터** (JSON-LD)
   - 게임 정보, 리뷰, FAQ 스키마

**React Helmet 활용:**

```typescript
import { Helmet } from "react-helmet-async";

<Helmet>
  <title>매칭 퍼즐 게임 - 스테이지 {stageNumber}</title>
  <meta name="description" content={`스테이지 ${stageNumber}를 플레이하세요`} />
</Helmet>;
```

## 16. 개발 단계

### Phase 1: 프로젝트 설정

- [ ] React + TypeScript + Vite 프로젝트 생성
- [ ] GitHub 저장소 생성 및 초기 커밋
- [ ] 기본 폴더 구조 생성
- [ ] GitHub Pages 배포 설정
- [ ] TypeScript 설정 (strict mode, 경로 별칭)
- [ ] ESLint 및 Prettier 설정
- [ ] 패키지 의존성 설치
- [ ] 레이아웃 구조 설정 (헤더, 게임 영역, 푸터)
- [ ] Canvas 16:9 비율 설정 및 테스트
- [ ] 다국어 지원 시스템 구축
- [ ] 언어 파일 생성 (en, ko, zh, ja)
- [ ] 브라우저 언어 자동 감지 구현
- [ ] 반응형 디자인 기본 설정
- [ ] 모바일 뷰포트 메타 태그 설정
- [ ] Error Boundary 컴포넌트 구현
- [ ] LocalStorage 데이터 구조 정의

### Phase 2: 핵심 게임 로직

- [ ] Canvas 렌더링 엔진 구현
- [ ] 젬 렌더링 시스템 구현 (drawStar, roundRect 폴리필 포함)
- [ ] Canvas 이벤트 처리 (마우스/터치, 메모리 누수 방지)
- [ ] 젬 스와이프 및 교환 로직
- [ ] 매칭 감지 알고리즘 (가로/세로, 중복 방지)
- [ ] 중력 시스템 구현 (Canvas 애니메이션, TweenAnimation)
- [ ] 연쇄 반응 처리 (무한 루프 방지)
- [ ] 특수 젬 생성 및 활성화
- [ ] 파티클 시스템 구현 (객체 풀링)
- [ ] 점수 계산 시스템
- [ ] 목표 시스템 구현
- [ ] 스테이지 시스템 구현
- [ ] 스테이지 절차적 생성 로직 (시드 기반)
- [ ] 스테이지 검증 로직 (플레이 가능 여부)

### Phase 3: UI 구현

- [ ] 헤더 컴포넌트 구현
- [ ] 푸터 컴포넌트 구현
- [ ] 게임 컨테이너 컴포넌트 구현
- [ ] Canvas 16:9 비율 반응형 처리 완성
- [ ] 언어 선택 컴포넌트 구현
- [ ] 다국어 적용 (모든 텍스트)
- [ ] 기본 레이아웃 및 스타일링
- [ ] 데스크탑 최적화 UI 구현
- [ ] 모바일 최적화 UI 구현
- [ ] 스테이지 선택 화면 구현
- [ ] 게임 화면 레이아웃
- [ ] 목표 패널 구현
- [ ] 승리/실패 모달 구현
- [ ] 생명 시스템 UI
- [ ] 부스터 패널 구현
- [ ] Canvas 애니메이션 최적화

### Phase 4: 기능 확장

- [ ] 고급 Canvas 애니메이션 추가
- [ ] 특수 젬 조합 효과
- [ ] 장애물 시스템 구현
- [ ] 부스터 기능 구현
- [ ] 힌트 시스템
- [ ] LocalStorage를 통한 진행 상황 저장
- [ ] 별점 시스템 UI 구현
- [ ] 벨런싱 데이터 수집 시스템
- [ ] 반응형 디자인 완성
- [ ] 모바일 앱 스타일 네비게이션
- [ ] 터치 제스처 최적화
- [ ] Canvas 성능 최적화
- [ ] 광고 통합
- [ ] SEO 최적화

### Phase 5: 최적화 및 배포

- [ ] 성능 최적화 (Lighthouse 점수 90+)
- [ ] Canvas 렌더링 최적화 (더티 체킹, 객체 풀링)
- [ ] 코드 리팩토링
- [ ] 단위 테스트 작성 (핵심 알고리즘)
- [ ] 컴포넌트 테스트 작성
- [ ] 테스트 커버리지 75% 이상 달성
- [ ] 벨런싱 조정 및 테스트
- [ ] 플레이 테스트 및 난이도 검증
- [ ] 접근성 개선 (ARIA, 키보드 네비게이션)
- [ ] 보안 검증 (CSP, XSS 방지)
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트
- [ ] PWA 기능 테스트 (오프라인, Service Worker)
- [ ] SEO 최종 점검
- [ ] 광고 성능 모니터링
- [ ] GitHub Pages 배포
- [ ] README 작성

## 17. 참고 자료

### React 학습

- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

### GitHub Pages 배포

- [GitHub Pages 공식 문서](https://pages.github.com/)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#github-pages)

### 게임 알고리즘

- Match-3 게임 알고리즘
- 중력 시스템 구현
- 연쇄 반응 처리

### Canvas API

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Canvas 튜토리얼](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [고성능 Canvas 렌더링](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [Canvas 비율 유지](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas#scaling_for_high_resolution_displays)

### 다국어 지원 (i18n)

- [React i18next](https://react.i18next.com/)
- [i18n Best Practices](https://www.i18next.com/principles/fallback)
- [브라우저 언어 감지](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/language)

### UI/UX 디자인

- [Material Design 가이드라인](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### SEO

- [Google Search Central](https://developers.google.com/search)
- [React Helmet](https://github.com/nfl/react-helmet)
- [Schema.org](https://schema.org/)

### 광고

- [Google AdSense](https://www.google.com/adsense/)
- [AdSense 정책](https://support.google.com/adsense/answer/48182)

### 게임 벨런싱

- [Game Balancing Theory](https://www.gamedeveloper.com/design/game-balancing-theory)
- [Difficulty Curves in Game Design](https://www.gamasutra.com/view/feature/130341/game_design_theory_and_practice.php)
- [Game Analytics and Balancing](https://www.gameanalytics.com/blog/game-balancing-analytics.html)

### 저작권 및 법적 고려사항

- [게임 메커니즘과 저작권](https://www.gamedeveloper.com/business/game-mechanics-and-copyright)
- [상표권 vs 저작권](https://www.uspto.gov/trademarks/basics/trademark-patent-copyright)

## 18. 예상 일정

- **Week 1**: 프로젝트 설정 및 Canvas 렌더링 엔진, 기본 게임 로직
- **Week 2**: 특수 젬, 연쇄 반응, 스테이지 시스템, 파티클 시스템
- **Week 3**: UI 구현 및 반응형 디자인 완성, Canvas 애니메이션
- **Week 4**: 기능 확장, 최적화, 테스트 및 배포

## 19. 향후 확장 계획

- [ ] 일일 챌린지 모드
- [ ] 멀티플레이어 모드
- [ ] 리더보드 (온라인)
- [ ] 다양한 게임 모드 추가
- [ ] 테마 커스터마이징
- [ ] PWA 기능 추가
- [ ] 오프라인 플레이 지원

---

## 다음 단계

1. 이 계획서 검토 및 수정
2. 프로젝트 초기화 (`npm create vite@latest`)
3. GitHub 저장소 생성 및 연결
4. 기본 컴포넌트 구조 생성
5. Canvas 렌더링 엔진 기본 구현
