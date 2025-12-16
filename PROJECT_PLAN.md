# 퍼즐 게임 프로젝트 계획서

## 1. 프로젝트 개요

### 목표

- 재미있고 도전적인 퍼즐 게임 개발
- GitHub Pages를 통한 무료 웹 호스팅
- React 기반의 현대적인 웹 애플리케이션 구축
- 데스크탑과 모바일 모두 지원하는 반응형 디자인
- 모바일에서 네이티브 앱과 유사한 UI/UX 제공
- 스테이지 형식의 게임 진행 시스템 (1~1000 스테이지)

### 기술 스택

- **프레임워크**: React (Vite 또는 Create React App)
- **언어**: TypeScript (타입 안정성)
- **스타일링**: CSS Modules + CSS Grid/Flexbox (반응형)
- **애니메이션**: CSS Animations, Framer Motion (선택사항)
- **렌더링**: Canvas API (게임 보드 렌더링 검토)
- **상태 관리**: React Hooks (useState, useContext, useReducer)
- **빌드 도구**: Vite (빠른 개발 및 빌드)
- **배포**: GitHub Pages
- **반응형**: Mobile-First 접근 방식, 미디어 쿼리 활용
- **PWA 기능**: Service Worker (선택사항, 앱처럼 사용 가능)
- **광고**: Google AdSense 또는 유사 서비스
- **SEO**: React Helmet, 메타 태그 최적화

## 2. 게임 설계

### 게임 타입 제안

1. **슬라이딩 퍼즐** (15-Puzzle)

   - 4x4 그리드에서 타일을 이동시켜 정렬
   - 클래식하고 직관적인 게임플레이

2. **매칭 퍼즐** (Match-3)

   - 같은 색상/모양의 타일을 3개 이상 매칭
   - 점수 시스템과 레벨 진행

3. **블록 퍼즐** (Tetris-like)

   - 떨어지는 블록을 조작하여 줄 제거
   - 실시간 액션 요소

4. **그리드 퍼즐** (Sudoku-like)
   - 논리적 추론이 필요한 퍼즐
   - 난이도 선택 가능

### 추천: 슬라이딩 퍼즐 (15-Puzzle)

- 구현 난이도: 중간
- 사용자 친화적
- 확장 가능 (이미지 퍼즐로 발전 가능)

### 게임 모드: 스테이지 시스템

- **스테이지 형식**: 1~1000 스테이지
- **진행 방식**: 순차적 해제 (1스테이지 완료 → 2스테이지 해제)
- **스테이지 선택**: 해제된 스테이지는 자유롭게 선택 가능
- **난이도 조절**: 스테이지 번호에 따라 난이도 자동 조절
  - 스테이지 1~100: 3x3 그리드 (초급)
  - 스테이지 101~500: 4x4 그리드 (중급)
  - 스테이지 501~1000: 5x5 그리드 (고급)
- **진행 상황 저장**: LocalStorage에 최고 진행 스테이지 저장

## 3. 기능 명세

### 핵심 기능

- [ ] 게임 보드 렌더링
- [ ] 타일 이동 로직
- [ ] 승리 조건 체크
- [ ] 이동 횟수 카운터
- [ ] 타이머
- [ ] 게임 리셋/새 게임
- [ ] 스테이지 시스템 (1~1000)
- [ ] 스테이지 진행 관리 (해제/잠금)
- [ ] 스테이지 선택 화면
- [ ] 스테이지별 난이도 자동 조절
- [ ] 벨런싱 시스템 (목표 이동 횟수/시간)
- [ ] 별점 시스템 (3스타)
- [ ] 셔플 깊이 자동 계산

### 추가 기능

- [ ] 스테이지 진행 상황 저장 (LocalStorage)
- [ ] 스테이지별 최고 기록 저장
- [ ] 고급 애니메이션 및 이펙트
- [ ] 사운드 효과 (선택사항)
- [ ] 힌트 기능
- [ ] 해결 가능성 검증
- [ ] 모바일 터치 제스처 지원 (스와이프)
- [ ] 모바일 앱 스타일 네비게이션
- [ ] 광고 통합 (수익화)
- [ ] SEO 최적화
- [ ] 이미지 퍼즐 모드 (확장)

## 4. 프로젝트 구조

```
ChipPuzzleGame/
├── public/
│   ├── index.html
│   └── assets/          # 이미지, 사운드 등
├── src/
│   ├── components/
│   │   ├── game/
│   │   │   ├── GameBoard.tsx
│   │   │   ├── GameBoardCanvas.tsx    # Canvas 버전
│   │   │   ├── Tile.tsx
│   │   │   ├── TileCanvas.tsx          # Canvas 버전
│   │   │   ├── GameInfo.tsx
│   │   │   └── GameControls.tsx
│   │   ├── stage/
│   │   │   ├── StageSelector.tsx
│   │   │   ├── StageGrid.tsx
│   │   │   └── StageCard.tsx
│   │   ├── ui/
│   │   │   ├── Navigation.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── AdBanner.tsx           # 광고 컴포넌트
│   │   └── animations/
│   │       ├── TileAnimation.tsx
│   │       └── VictoryEffect.tsx
│   ├── hooks/
│   │   ├── useGameState.ts
│   │   ├── useTimer.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useStageProgress.ts
│   │   ├── useResponsive.ts
│   │   └── useCanvas.ts               # Canvas 훅
│   ├── services/
│   │   ├── StageService.ts
│   │   ├── GameService.ts
│   │   └── AdService.ts               # 광고 서비스
│   ├── utils/
│   │   ├── puzzleLogic.ts
│   │   ├── shuffle.ts
│   │   ├── validation.ts
│   │   ├── stageGenerator.ts
│   │   ├── stageDifficulty.ts
│   │   ├── balanceCalculator.ts      # 벨런싱 계산 유틸
│   │   └── animations.ts              # 애니메이션 유틸
│   ├── constants/
│   │   ├── gameConfig.ts
│   │   ├── stageConfig.ts
│   │   ├── uiConfig.ts
│   │   └── balanceConfig.ts          # 벨런싱 상수 및 설정
│   ├── types/
│   │   ├── stage.ts
│   │   ├── game.ts
│   │   └── ui.ts
│   ├── styles/
│   │   ├── App.css
│   │   ├── mobile.css
│   │   ├── desktop.css
│   │   ├── animations.css
│   │   └── components/
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── vite.config.ts       # 또는 webpack 설정
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

export default defineConfig({
  plugins: [react()],
  base: "/ChipPuzzleGame/", // GitHub 저장소 이름
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
});
```

#### 모바일 최적화 설정

**public/index.html:**

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta
  name="apple-mobile-web-app-status-bar-style"
  content="black-translucent"
/>
```

**CSS 변수 설정 (반응형):**

```css
:root {
  --mobile-breakpoint: 768px;
  --tablet-breakpoint: 1024px;
  --tile-size-mobile: 60px;
  --tile-size-desktop: 80px;
  --spacing-mobile: 8px;
  --spacing-desktop: 16px;
}
```

### 5.3 게임 로직 설계

#### 상태 관리

**게임 상태:**

- `board`: 현재 보드 상태 (2D 배열)
- `emptyPosition`: 빈 타일 위치
- `moveCount`: 이동 횟수
- `isSolved`: 해결 여부
- `startTime`: 게임 시작 시간
- `currentStage`: 현재 플레이 중인 스테이지 번호
- `gridSize`: 현재 그리드 크기 (3x3, 4x4, 5x5)

**스테이지 진행 상태:**

- `unlockedStages`: 해제된 스테이지 목록 (Set 또는 배열)
- `stageRecords`: 스테이지별 최고 기록 (Map 또는 객체)
- `highestStage`: 최고 진행 스테이지 번호

#### 핵심 알고리즘

1. **셔플 알고리즘**

   - 해결 가능한 상태만 생성
   - Fisher-Yates 셔플 + 패리티 체크

2. **이동 검증**

   - 빈 타일과 인접한 타일만 이동 가능
   - 경계 체크

3. **승리 조건**

   - 모든 타일이 올바른 순서로 정렬되었는지 확인

4. **스테이지 시스템**
   - 스테이지별 고유 셔플 시드 생성 (재현 가능)
   - 스테이지 완료 시 다음 스테이지 자동 해제
   - 스테이지 난이도 자동 계산 (스테이지 번호 기반)
   - 진행 상황 영구 저장 (LocalStorage)

#### 스테이지 시스템 상세 설계

**스테이지 난이도 분류:**

- **스테이지 1~100**: 3x3 그리드 (초급)
  - 빠른 완료 가능
  - 학습 및 적응 단계
- **스테이지 101~500**: 4x4 그리드 (중급)
  - 표준 난이도
  - 전략적 사고 필요
- **스테이지 501~1000**: 5x5 그리드 (고급)
  - 고난이도
  - 장기간 플레이 필요

**스테이지 셔플 알고리즘:**

```typescript
// 각 스테이지는 고유한 시드를 가짐
function generateStagePuzzle(stageNumber: number, gridSize: number) {
  const seed = stageNumber * 1000 + gridSize;
  // 시드 기반 셔플로 항상 동일한 퍼즐 생성
  return shuffleWithSeed(initialBoard, seed);
}
```

**스테이지 진행 관리:**

- 초기 상태: 스테이지 1만 해제
- 스테이지 완료 시: `unlockedStages`에 다음 스테이지 추가
- LocalStorage 저장 형식:
  ```json
  {
    "highestStage": 50,
    "unlockedStages": [1, 2, 3, ..., 50, 51],
    "stageRecords": {
      "1": { "time": 120, "moves": 45, "stars": 3 },
      "2": { "time": 95, "moves": 38, "stars": 3 }
    }
  }
  ```

**스테이지 선택 UI:**

- 그리드 레이아웃: 10x10 또는 20x50 (스크롤 가능)
- 카드 표시:
  - 해제: 클릭 가능, 별점 표시, 최고 기록 표시
  - 잠금: 회색, 잠금 아이콘, 해제 조건 표시
  - 현재 진행: 하이라이트, "계속하기" 버튼
- 모바일: 페이지네이션 (한 화면에 9~12개)
- 데스크탑: 더 많은 카드 동시 표시

#### 스테이지 벨런싱 및 수치화 시스템

**벨런싱 철학:**

- **점진적 난이도 증가**: 플레이어가 좌절하지 않도록 부드러운 난이도 곡선
- **성취감 극대화**: 적절한 도전과 보상의 균형
- **재플레이 가치**: 3스타 달성을 위한 동기 부여
- **데이터 기반 조정**: 플레이어 데이터 수집 및 분석 기반 조정

**난이도 곡선 설계:**

**3x3 그리드 (스테이지 1~100):**

- **초반 (1~20)**: 튜토리얼 및 적응

  - 목표 이동 횟수: 10~25회
  - 목표 시간: 30~90초
  - 셔플 깊이: 5~15회 (최소 이동 횟수 기준)

- **중반 (21~60)**: 기본기 습득

  - 목표 이동 횟수: 20~40회
  - 목표 시간: 60~180초
  - 셔플 깊이: 15~30회

- **후반 (61~100)**: 숙련도 향상
  - 목표 이동 횟수: 30~50회
  - 목표 시간: 90~240초
  - 셔플 깊이: 25~40회

**4x4 그리드 (스테이지 101~500):**

- **초반 (101~200)**: 전환기

  - 목표 이동 횟수: 40~70회
  - 목표 시간: 120~300초
  - 셔플 깊이: 30~60회

- **중반 (201~350)**: 표준 난이도

  - 목표 이동 횟수: 50~100회
  - 목표 시간: 180~420초
  - 셔플 깊이: 50~100회

- **후반 (351~500)**: 고난이도 준비
  - 목표 이동 횟수: 70~130회
  - 목표 시간: 240~600초
  - 셔플 깊이: 80~150회

**5x5 그리드 (스테이지 501~1000):**

- **초반 (501~650)**: 고난이도 적응

  - 목표 이동 횟수: 100~200회
  - 목표 시간: 300~900초
  - 셔플 깊이: 120~250회

- **중반 (651~800)**: 마스터 레벨

  - 목표 이동 횟수: 150~300회
  - 목표 시간: 450~1200초
  - 셔플 깊이: 200~400회

- **후반 (801~1000)**: 엘리트 레벨
  - 목표 이동 횟수: 200~400회
  - 목표 시간: 600~1800초
  - 셔플 깊이: 300~600회

**별점 시스템 (3스타):**

각 스테이지별 목표 기준:

```typescript
interface StarCriteria {
  moves: {
    threeStar: number; // 3스타 목표 이동 횟수
    twoStar: number; // 2스타 목표 이동 횟수
    oneStar: number; // 1스타 목표 이동 횟수
  };
  time: {
    threeStar: number; // 3스타 목표 시간 (초)
    twoStar: number; // 2스타 목표 시간 (초)
    oneStar: number; // 1스타 목표 시간 (초)
  };
}

// 예시: 스테이지 50 (3x3 후반)
const stage50Criteria: StarCriteria = {
  moves: {
    threeStar: 35, // 최적 플레이
    twoStar: 45, // 좋은 플레이
    oneStar: 60, // 통과 기준
  },
  time: {
    threeStar: 120, // 2분
    twoStar: 180, // 3분
    oneStar: 300, // 5분
  },
};
```

**별점 계산 로직:**

```typescript
function calculateStars(
  moves: number,
  time: number,
  criteria: StarCriteria
): number {
  let stars = 0;

  // 이동 횟수 기준
  if (moves <= criteria.moves.threeStar) {
    stars = Math.max(stars, 3);
  } else if (moves <= criteria.moves.twoStar) {
    stars = Math.max(stars, 2);
  } else if (moves <= criteria.moves.oneStar) {
    stars = Math.max(stars, 1);
  }

  // 시간 기준 (더 관대한 기준)
  if (time <= criteria.time.threeStar) {
    stars = Math.max(stars, 3);
  } else if (time <= criteria.time.twoStar) {
    stars = Math.max(stars, 2);
  } else if (time <= criteria.time.oneStar) {
    stars = Math.max(stars, 1);
  }

  // 두 기준 중 더 높은 별점 사용
  return stars;
}
```

**셔플 깊이 계산:**

```typescript
/**
 * 스테이지 번호에 따른 셔플 깊이 계산
 * 셔플 깊이 = 최소 해결에 필요한 이동 횟수
 */
function calculateShuffleDepth(stageNumber: number, gridSize: number): number {
  const baseDepth = gridSize * gridSize * 2; // 기본 깊이

  // 스테이지 번호에 따른 증가
  let stageMultiplier = 1;

  if (gridSize === 3) {
    // 3x3: 스테이지 1~100
    stageMultiplier = 0.3 + (stageNumber / 100) * 0.7;
  } else if (gridSize === 4) {
    // 4x4: 스테이지 101~500
    const relativeStage = stageNumber - 100;
    stageMultiplier = 0.5 + (relativeStage / 400) * 1.5;
  } else if (gridSize === 5) {
    // 5x5: 스테이지 501~1000
    const relativeStage = stageNumber - 500;
    stageMultiplier = 1.0 + (relativeStage / 500) * 2.0;
  }

  return Math.floor(baseDepth * stageMultiplier);
}
```

**벨런싱 수치 공식:**

**목표 이동 횟수 계산:**

```typescript
function getTargetMoves(
  stageNumber: number,
  gridSize: number
): StarCriteria["moves"] {
  const baseMoves = gridSize * gridSize * 2;
  const difficultyFactor = getDifficultyFactor(stageNumber, gridSize);

  const threeStar = Math.floor(baseMoves * difficultyFactor * 0.7);
  const twoStar = Math.floor(baseMoves * difficultyFactor * 0.9);
  const oneStar = Math.floor(baseMoves * difficultyFactor * 1.2);

  return { threeStar, twoStar, oneStar };
}

function getDifficultyFactor(stageNumber: number, gridSize: number): number {
  if (gridSize === 3) {
    return 0.5 + (stageNumber / 100) * 0.5; // 0.5 ~ 1.0
  } else if (gridSize === 4) {
    const relativeStage = stageNumber - 100;
    return 1.0 + (relativeStage / 400) * 1.5; // 1.0 ~ 2.5
  } else {
    const relativeStage = stageNumber - 500;
    return 2.5 + (relativeStage / 500) * 2.5; // 2.5 ~ 5.0
  }
}
```

**목표 시간 계산:**

```typescript
function getTargetTime(
  stageNumber: number,
  gridSize: number
): StarCriteria["time"] {
  const baseTime = gridSize * gridSize * 5; // 기본 시간 (초)
  const difficultyFactor = getDifficultyFactor(stageNumber, gridSize);

  const threeStar = Math.floor(baseTime * difficultyFactor * 0.8);
  const twoStar = Math.floor(baseTime * difficultyFactor * 1.2);
  const oneStar = Math.floor(baseTime * difficultyFactor * 2.0);

  return { threeStar, twoStar, oneStar };
}
```

**플레이어 경험 곡선 (XP Curve):**

- **초반 (1~50)**: 빠른 성장, 자주 성취감 느끼기
- **중반 (51~300)**: 안정적 성장, 점진적 도전
- **후반 (301~1000)**: 느린 성장, 큰 성취감

**벨런싱 데이터 수집:**

```typescript
interface BalanceData {
  stageNumber: number;
  averageMoves: number;
  averageTime: number;
  completionRate: number; // 완료율
  threeStarRate: number; // 3스타 달성율
  averageAttempts: number; // 평균 시도 횟수
  playerCount: number; // 플레이한 플레이어 수
}

// 목표 완료율: 85% 이상
// 목표 3스타 달성율: 10~30% (스테이지별)
```

**벨런싱 조정 기준:**

- **완료율 < 70%**: 난이도 낮추기 (셔플 깊이 감소)
- **완료율 > 95%**: 난이도 높이기 (셔플 깊이 증가)
- **3스타 달성율 < 5%**: 목표 기준 완화
- **3스타 달성율 > 50%**: 목표 기준 강화
- **평균 시도 횟수 > 10회**: 난이도 낮추기

**스테이지별 난이도 레이블:**

- ⭐ **쉬움** (1~30, 101~150, 501~550)
- ⭐⭐ **보통** (31~70, 151~300, 551~700)
- ⭐⭐⭐ **어려움** (71~100, 301~450, 701~850)
- ⭐⭐⭐⭐ **매우 어려움** (451~500, 851~950)
- ⭐⭐⭐⭐⭐ **극한** (951~1000)

**벨런싱 테이블 예시:**

| 스테이지 | 그리드 | 셔플 깊이 | 목표 이동 (3스타) | 목표 시간 (3스타) | 난이도     |
| -------- | ------ | --------- | ----------------- | ----------------- | ---------- |
| 1        | 3x3    | 5         | 10                | 30초              | ⭐         |
| 50       | 3x3    | 35        | 35                | 120초             | ⭐⭐       |
| 100      | 3x3    | 50        | 50                | 180초             | ⭐⭐⭐     |
| 200      | 4x4    | 80        | 70                | 240초             | ⭐⭐       |
| 400      | 4x4    | 140       | 120               | 480초             | ⭐⭐⭐     |
| 500      | 4x4    | 180       | 150               | 600초             | ⭐⭐⭐⭐   |
| 600      | 5x5    | 250       | 200               | 600초             | ⭐⭐⭐     |
| 800      | 5x5    | 400       | 300               | 900초             | ⭐⭐⭐⭐   |
| 1000     | 5x5    | 600       | 400               | 1200초            | ⭐⭐⭐⭐⭐ |

**동적 벨런싱 (선택사항):**

- 플레이어 실력에 따른 적응형 난이도
- 실시간 데이터 기반 자동 조정
- A/B 테스트를 통한 최적화

## 6. UI/UX 설계

### 디자인 원칙

- 깔끔하고 직관적인 인터페이스
- **반응형 디자인**: 모바일 퍼스트 접근 방식
- **모바일 앱 스타일**: 네이티브 앱과 유사한 UI/UX
- 부드러운 애니메이션 및 전환 효과
- 접근성 고려 (키보드 네비게이션, 터치 제스처)

### 반응형 디자인 전략

**데스크탑 최적화 UI/UX (1024px 이상):**

- **레이아웃**: 넓은 화면 활용, 멀티 컬럼 레이아웃
- **네비게이션**: 사이드바 또는 상단 네비게이션 바
- **스테이지 선택**: 그리드 레이아웃 (10x10 또는 더 많은 카드 동시 표시)
- **게임 보드**: 큰 크기, 마우스 호버 효과, 키보드 단축키
- **인터랙션**: 마우스 드래그, 호버 피드백, 컨텍스트 메뉴
- **정보 표시**: 상세한 통계, 진행 상황 차트
- **광고 배치**: 사이드바 또는 상단/하단 배너

**모바일 최적화 UI/UX (768px 이하):**

- **레이아웃**: 풀스크린 레이아웃, 단일 컬럼
- **네비게이션**: 하단 네비게이션 바 (앱 스타일), 스와이프 제스처
- **스테이지 선택**: 카드 기반, 페이지네이션 또는 무한 스크롤
- **게임 보드**: 터치 최적화 크기, 스와이프 제스처
- **인터랙션**: 터치 피드백, 햅틱 피드백 (가능한 경우)
- **정보 표시**: 간결한 정보, 모달로 상세 정보 제공
- **광고 배치**: 게임 완료 후 또는 스테이지 선택 화면 하단
- **성능**: 가상 스크롤, 이미지 지연 로딩, 최적화된 렌더링

### 화면 구성

1. **스테이지 선택 화면**

   - 게임 제목/로고
   - 스테이지 그리드 (1~1000)
   - 스테이지 카드 표시:
     - 해제된 스테이지: 클릭 가능, 별점 표시
     - 잠긴 스테이지: 회색 처리, 잠금 아이콘
     - 현재 진행 중: 하이라이트
   - 스테이지 검색/필터 기능 (선택사항)
   - 모바일: 페이지네이션 또는 무한 스크롤

2. **게임 화면**

   - 상단 바:
     - 스테이지 번호 표시
     - 뒤로가기 버튼 (스테이지 선택으로)
   - 게임 보드 (중앙, 반응형 크기)
   - 게임 정보 패널:
     - 이동 횟수
     - 타이머
     - 현재 스테이지 최고 기록 (있는 경우)
   - 하단 컨트롤:
     - 리셋 버튼
     - 힌트 버튼 (선택사항)
   - 모바일: 하단 고정 네비게이션 바

3. **승리 화면 (모달 또는 전용 화면)**

   - 축하 메시지 및 애니메이션
   - 완료 시간 및 이동 횟수
   - 별점 표시 (기록 기반)
   - 다음 스테이지 버튼 (해제된 경우)
   - 스테이지 선택으로 돌아가기 버튼
   - 다시 플레이 버튼

4. **모바일 앱 스타일 네비게이션**

   - 하단 네비게이션 바 (게임 중일 때 숨김)
   - 홈 (스테이지 선택)
   - 진행 상황
   - 설정 (선택사항)

### 모바일 앱 스타일 UI 가이드

**디자인 요소:**

- **카드 기반 레이아웃**: Material Design 또는 iOS 스타일 카드
- **부드러운 애니메이션**: 페이지 전환, 모달 표시
- **터치 피드백**: 버튼 클릭 시 햅틱 피드백 (가능한 경우)
- **풀스크린 경험**: 브라우저 UI 최소화

**네비게이션 패턴:**

- **하단 탭 바**: 주요 화면 간 이동
- **상단 헤더**: 현재 화면 제목, 뒤로가기 버튼
- **스와이프 제스처**: 뒤로가기, 페이지 전환

**터치 최적화:**

- 최소 터치 영역: 44x44px (iOS 가이드라인)
- 충분한 간격: 버튼 간 최소 8px
- 스와이프 영역: 게임 보드 주변 여백

**성능 최적화:**

- 가상 스크롤: 많은 스테이지 카드 렌더링 시
- 이미지 지연 로딩: 스테이지 카드 이미지
- CSS 애니메이션 활용: JavaScript 애니메이션 최소화

### 고급 UI/UX 디자인 원칙

**디자인 시스템:**

- **컬러 팔레트**: 일관된 컬러 시스템 (Primary, Secondary, Accent)
- **타이포그래피**: 계층적 폰트 시스템, 가독성 최우선
- **간격 시스템**: 4px 또는 8px 그리드 기반 간격
- **그림자 및 깊이**: Material Design 또는 Neumorphism 스타일
- **아이콘**: 일관된 아이콘 세트 (SVG 기반)

**애니메이션 가이드라인:**

- **전환 시간**: 200-300ms (빠른), 300-500ms (보통), 500ms+ (느린)
- **이징 함수**: ease-in-out, cubic-bezier 커스텀
- **애니메이션 타입**:
  - 타일 이동: 슬라이드 애니메이션 (200ms)
  - 승리 효과: 파티클 효과, 축하 애니메이션
  - 페이지 전환: 페이드 + 슬라이드 (300ms)
  - 버튼 클릭: 스케일 + 리플 효과
  - 모달 표시: 페이드 + 스케일 (250ms)

**CSS 기반 디자인 (이미지 최소화):**

- **그라데이션**: CSS linear-gradient, radial-gradient
- **패턴**: CSS background-pattern, repeating-linear-gradient
- **아이콘**: CSS로 그린 아이콘 또는 SVG
- **타일 디자인**: CSS box-shadow, border-radius, 그라데이션
- **배경**: CSS 그라데이션, 패턴, 애니메이션 효과
- **이펙트**: CSS filter, backdrop-filter, transform

**Canvas 활용 검토:**

**Canvas 사용 시나리오:**

1. **게임 보드 렌더링** (선택사항)

   - 장점: 복잡한 애니메이션, 파티클 효과, 고성능
   - 단점: 접근성, SEO, 반응형 구현 복잡도
   - 결정: CSS로 구현 가능하므로 CSS 우선, 특수 효과만 Canvas

2. **파티클 효과** (승리 화면)

   - Canvas 활용 권장
   - 별, 폭죽, 컨페티 효과

3. **복잡한 애니메이션**
   - 타일 이동의 부드러운 곡선 경로
   - 물리 기반 애니메이션

**최종 결정:**

- 기본 게임 보드: CSS + React 컴포넌트
- 특수 이펙트: Canvas 활용 (승리 효과, 파티클)
- 하이브리드 접근: CSS 기본 + Canvas 보강

## 7. 코드 아키텍처 및 설계 원칙

### 엔터프라이즈급 코드 구조

**디렉토리 구조 원칙:**

- **관심사 분리**: 기능별, 도메인별 폴더 구조
- **계층화**: Components → Services → Utils → Types
- **재사용성**: 공통 컴포넌트, 유틸리티 분리
- **확장성**: 새로운 기능 추가 시 기존 코드 영향 최소화

**네이밍 컨벤션:**

- **컴포넌트**: PascalCase (GameBoard.tsx)
- **훅**: camelCase with 'use' prefix (useGameState.ts)
- **유틸리티**: camelCase (puzzleLogic.ts)
- **타입/인터페이스**: PascalCase (GameState, StageData)
- **상수**: UPPER_SNAKE_CASE (MAX_STAGES, DEFAULT_GRID_SIZE)

**코드 품질 원칙:**

- **타입 안정성**: TypeScript strict mode, 모든 함수 타입 정의
- **단일 책임 원칙**: 각 함수/클래스는 하나의 책임만
- **DRY (Don't Repeat Yourself)**: 중복 코드 제거
- **SOLID 원칙**: 객체지향 설계 원칙 준수
- **테스트 가능성**: 순수 함수, 의존성 주입

**아키텍처 패턴:**

- **컴포넌트 패턴**: 재사용 가능한 컴포넌트 설계
- **컨테이너/프레젠테이션 분리**: 로직과 UI 분리
- **서비스 레이어**: 비즈니스 로직을 서비스로 분리
- **상태 관리**: Context API 또는 Redux (필요시)

**예시 코드 구조:**

```typescript
// Service Layer
class GameService {
  private board: Board;
  private validator: PuzzleValidator;

  constructor(board: Board, validator: PuzzleValidator) {
    this.board = board;
    this.validator = validator;
  }

  moveTile(position: Position): MoveResult {
    // 비즈니스 로직
  }
}

// Component Layer
const GameBoard: React.FC<GameBoardProps> = ({ stage, onComplete }) => {
  const gameService = useGameService(stage);
  // UI 로직만
};
```

## 8. 광고 수익 모델

### 광고 전략

**광고 배치 위치:**

1. **스테이지 선택 화면**

   - 하단 배너 광고 (모바일)
   - 사이드바 광고 (데스크탑)

2. **게임 완료 후**

   - 보상형 동영상 광고 (선택사항)
   - 전면 광고 (간헐적, 사용자 경험 고려)

3. **게임 중**
   - 최소화 (사용자 경험 우선)
   - 필요시 작은 배너만

**광고 플랫폼:**

- **Google AdSense**: 기본 광고 플랫폼
- **대체 옵션**: Media.net, PropellerAds
- **네이티브 광고**: 콘텐츠와 자연스럽게 통합

**광고 구현:**

- **컴포넌트화**: AdBanner, AdSidebar 등 재사용 가능한 컴포넌트
- **로딩 최적화**: 지연 로딩, 광고 블로킹 감지
- **사용자 경험**: 광고가 게임플레이를 방해하지 않도록 설계

**수익 최적화:**

- 광고 빈도 조절 (너무 많지 않게)
- 관련성 높은 광고 타겟팅
- 사용자 피드백 수집 및 조정

## 9. SEO 최적화

### SEO 전략

**기본 SEO 설정:**

1. **메타 태그 최적화**

   ```html
   <title>퍼즐 게임 - 1000개의 도전적인 스테이지</title>
   <meta
     name="description"
     content="무료 온라인 퍼즐 게임. 1000개의 스테이지를 클리어하세요!"
   />
   <meta name="keywords" content="퍼즐게임, 퍼즐, 게임, 무료게임, 온라인게임" />
   ```

2. **Open Graph 태그** (소셜 미디어 공유)

   ```html
   <meta property="og:title" content="퍼즐 게임" />
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
  <title>퍼즐 게임 - 스테이지 {stageNumber}</title>
  <meta name="description" content={`스테이지 ${stageNumber}를 플레이하세요`} />
</Helmet>;
```

**성능 최적화 (SEO 영향):**

- 빠른 로딩 시간 (Lighthouse 점수 90+)
- Core Web Vitals 최적화
- 이미지 최적화 (WebP, lazy loading)
- 코드 스플리팅

**콘텐츠 SEO:**

- 의미 있는 URL 구조 (`/stage/1`, `/stage/2`)
- 내부 링크 구조
- 사이트맵 생성
- robots.txt 설정

**모바일 SEO:**

- 모바일 친화적 디자인
- 빠른 모바일 로딩 속도
- 터치 최적화

## 10. 개발 단계

### Phase 1: 프로젝트 설정

- [ ] React + TypeScript + Vite 프로젝트 생성
- [ ] GitHub 저장소 생성 및 초기 커밋
- [ ] 기본 폴더 구조 생성
- [ ] GitHub Pages 배포 설정
- [ ] 반응형 디자인 기본 설정 (CSS 변수, 미디어 쿼리)
- [ ] 모바일 뷰포트 메타 태그 설정

### Phase 2: 핵심 게임 로직

- [ ] 게임 보드 컴포넌트 구현
- [ ] 타일 이동 로직 구현
- [ ] 셔플 알고리즘 구현
- [ ] 승리 조건 체크 구현
- [ ] 스테이지 시스템 구현
- [ ] 스테이지별 셔플 시드 생성
- [ ] 스테이지 난이도 계산 로직
- [ ] 스테이지 진행 관리 (해제/잠금)
- [ ] 벨런싱 시스템 구현
- [ ] 별점 계산 로직
- [ ] 목표 이동 횟수/시간 계산
- [ ] 셔플 깊이 계산 알고리즘

### Phase 3: UI 구현

- [ ] 기본 레이아웃 및 스타일링
- [ ] 데스크탑 최적화 UI 구현
- [ ] 모바일 최적화 UI 구현
- [ ] 스테이지 선택 화면 구현
- [ ] 스테이지 그리드 컴포넌트
- [ ] 스테이지 카드 컴포넌트 (해제/잠금 상태)
- [ ] 게임 화면 레이아웃
- [ ] 게임 정보 표시 (이동 횟수, 타이머, 스테이지 번호)
- [ ] 컨트롤 버튼 구현
- [ ] 승리 화면 모달 구현
- [ ] CSS 기반 타일 디자인 (그라데이션, 그림자)
- [ ] 디자인 시스템 구축 (컬러, 타이포그래피, 간격)

### Phase 4: 기능 확장

- [ ] 고급 애니메이션 추가 (타일 이동, 승리 화면)
- [ ] Canvas 기반 파티클 효과 (승리 화면)
- [ ] CSS 애니메이션 최적화
- [ ] LocalStorage를 통한 스테이지 진행 상황 저장
- [ ] 스테이지별 최고 기록 저장 및 표시
- [ ] 별점 시스템 UI 구현
- [ ] 벨런싱 데이터 수집 시스템 (선택사항)
- [ ] 반응형 디자인 완성 (모바일/데스크탑 각각 최적화)
- [ ] 모바일 앱 스타일 네비게이션 구현
- [ ] 터치 제스처 지원 (스와이프)
- [ ] 키보드 컨트롤 지원 (데스크탑)
- [ ] 모바일 브라우저 최적화 (주소창 처리)
- [ ] 광고 통합 (AdSense)
- [ ] SEO 최적화 (메타 태그, 구조화된 데이터)

### Phase 5: 최적화 및 배포

- [ ] 성능 최적화 (Lighthouse 점수 90+)
- [ ] 코드 리팩토링 (SOLID 원칙, 아키텍처 개선)
- [ ] 벨런싱 조정 및 테스트
- [ ] 플레이 테스트 및 난이도 검증
- [ ] 접근성 개선 (ARIA 레이블, 키보드 네비게이션)
- [ ] 크로스 브라우저 테스트
- [ ] 모바일 디바이스 테스트
- [ ] SEO 최종 점검
- [ ] 광고 성능 모니터링
- [ ] GitHub Pages 배포
- [ ] README 작성 (상세한 문서화)

## 11. 참고 자료

### React 학습

- [React 공식 문서](https://react.dev/)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)

### GitHub Pages 배포

- [GitHub Pages 공식 문서](https://pages.github.com/)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#github-pages)

### 게임 알고리즘

- 15-Puzzle 해결 가능성 검증
- Fisher-Yates 셔플 알고리즘

### UI/UX 디자인

- [Material Design 가이드라인](https://material.io/design)
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [CSS-Tricks](https://css-tricks.com/) - CSS 기법
- [Animista](https://animista.net/) - CSS 애니메이션

### Canvas 및 애니메이션

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Framer Motion](https://www.framer.com/motion/) - React 애니메이션
- [GSAP](https://greensock.com/gsap/) - 고급 애니메이션 라이브러리

### SEO

- [Google Search Central](https://developers.google.com/search)
- [React Helmet](https://github.com/nfl/react-helmet)
- [Schema.org](https://schema.org/) - 구조화된 데이터

### 광고

- [Google AdSense](https://www.google.com/adsense/)
- [AdSense 정책](https://support.google.com/adsense/answer/48182)

### 게임 벨런싱

- [Game Balancing Theory](https://www.gamedeveloper.com/design/game-balancing-theory)
- [Difficulty Curves in Game Design](https://www.gamasutra.com/view/feature/130341/game_design_theory_and_practice.php)
- [15-Puzzle Optimal Solution](https://en.wikipedia.org/wiki/15_puzzle#Solvability)
- [Game Analytics and Balancing](https://www.gameanalytics.com/blog/game-balancing-analytics.html)

## 12. 예상 일정

- **Week 1**: 프로젝트 설정 및 기본 게임 로직, 스테이지 시스템 기본 구조
- **Week 2**: 스테이지 선택 UI 및 게임 화면 구현
- **Week 3**: 반응형 디자인 및 모바일 앱 스타일 UI 완성
- **Week 4**: 기능 확장, 최적화, 테스트 및 배포

## 13. 향후 확장 계획

- [ ] 이미지 퍼즐 모드 (사용자 이미지 업로드)
- [ ] 스테이지 에디터 (사용자 커스텀 스테이지 생성)
- [ ] 일일 챌린지 모드
- [ ] 멀티플레이어 모드
- [ ] 리더보드 (온라인)
- [ ] 다양한 퍼즐 타입 추가
- [ ] 테마 커스터마이징
- [ ] PWA (Progressive Web App) 기능 추가
- [ ] 오프라인 플레이 지원

---

## 다음 단계

1. 이 계획서 검토 및 수정
2. 프로젝트 초기화 (`npm create vite@latest`)
3. GitHub 저장소 생성 및 연결
4. 기본 컴포넌트 구조 생성
