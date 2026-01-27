# 세로 모드 vs 가로 모드 차이점 분석

## 1. 목적
- **가로 모드 사용 이유**: 모바일 세로 모드에서 화면이 작아서 게임하기 불편하므로, 가로 모드로 전환하여 게임 보드를 크게 표시하기 위함

## 2. CSS 차이점

### 세로 모드 (일반 모드)
```css
.game-board-container {
  width: 100%;
  height: 100%;
  position: relative;
  /* transform 없음 */
}
```

### 가로 모드 (회전 모드)
```css
.game-board-container.landscape-mode {
  transform: rotate(90deg);  /* 90도 시계방향 회전 */
  width: 100vh;              /* 세로 모드의 height */
  height: 100vw;             /* 세로 모드의 width */
  position: fixed;           /* 고정 위치 */
  top: 50%;
  left: 50%;
  margin-top: -50vw;
  margin-left: -50vh;
  transform-origin: center center;  /* 회전 중심 */
}
```

**핵심 차이점:**
- `transform: rotate(90deg)`: 요소가 90도 시계방향으로 회전됨
- `width`와 `height`가 교환됨 (100vh ↔ 100vw)
- `position: fixed`로 화면 중앙에 고정 배치

## 3. Canvas 크기 차이점

### 세로 모드
- `canvas.width`: 정상적인 논리적 너비 (예: 1200px 기준)
- `canvas.height`: 정상적인 논리적 높이 (예: 675px, 16:9 비율)
- `rect.width`: canvas의 실제 CSS 너비
- `rect.height`: canvas의 실제 CSS 높이

### 가로 모드
- `canvas.width`: 여전히 원래 논리적 너비 (변하지 않음)
- `canvas.height`: 여전히 원래 논리적 높이 (변하지 않음)
- `rect.width`: 회전된 요소의 경계 상자 너비 (원래 height와 같음)
- `rect.height`: 회전된 요소의 경계 상자 높이 (원래 width와 같음)

**핵심 차이점:**
- Canvas 자체의 크기는 변하지 않음
- 하지만 `getBoundingClientRect()`는 회전된 요소의 경계 상자를 반환하므로, `rect.width`와 `rect.height`가 교환됨

## 4. 클릭 좌표 계산 차이점

### 세로 모드 (정상 작동)
```typescript
// 1단계: 화면 좌표를 캔버스 기준 상대 좌표로 변환
const rect = canvas.getBoundingClientRect();
let x = event.clientX - rect.left;  // 화면 좌표 → 캔버스 상대 좌표
let y = event.clientY - rect.top;   // 화면 좌표 → 캔버스 상대 좌표

// 2단계: DPR(Device Pixel Ratio) 고려
const dpr = window.devicePixelRatio || 1;
let canvasWidth = canvas.width / dpr;   // 논리적 캔버스 너비
let canvasHeight = canvas.height / dpr; // 논리적 캔버스 높이

// 3단계: 가로 모드 체크 (세로 모드에서는 이 블록이 실행되지 않음)
if (isLandscapeMode && window.innerWidth <= 768) {
  // 좌표 변환 없음 (세로 모드에서는 이 블록 실행 안 됨)
}

// 4단계: 그리드 위치 계산 (변환된 x, y 좌표 사용)
const startX = (canvasWidth - (stagesPerRow * stageSize + (stagesPerRow - 1) * gap)) / 2;
const startY = 100 * scale;
col = Math.floor((x - startX) / (stageSize + gap));
row = Math.floor((y - startY) / (stageSize + gap));
```

**세로 모드 좌표 처리:**
- ✅ 화면 좌표를 캔버스 기준 상대 좌표로 변환 (기본 처리)
- ✅ DPR 고려하여 논리적 캔버스 크기 계산
- ❌ 회전 변환 없음 (CSS transform이 없으므로)
- ✅ 변환된 x, y 좌표를 그대로 사용하여 그리드 위치 계산

### 가로 모드 (현재 문제)
```typescript
// 1단계: 화면 좌표를 캔버스 기준 상대 좌표로 변환 (세로 모드와 동일)
const rect = canvas.getBoundingClientRect();
let x = event.clientX - rect.left;  // 회전된 요소 기준 x 좌표
let y = event.clientY - rect.top;   // 회전된 요소 기준 y 좌표

// 2단계: DPR 고려 (세로 모드와 동일)
const dpr = window.devicePixelRatio || 1;
let canvasWidth = canvas.width / dpr;
let canvasHeight = canvas.height / dpr;

// 3단계: 가로 모드 좌표 변환 (90도 회전의 역변환) - 세로 모드와 다른 부분!
if (isLandscapeMode && window.innerWidth <= 768) {
  // 회전된 요소의 클릭 좌표를 원래 캔버스 좌표로 변환
  // 원래 (x, y) -> 회전 후 (y, width - x)
  // 역변환: 회전 후 (x', y') -> 원래 (height - y', x')
  // ... 복잡한 회전 변환 로직 ...
}

// 4단계: 그리드 위치 계산 (변환된 x, y 좌표 사용)
// 세로 모드와 동일한 로직 사용
```

**가로 모드 좌표 처리:**
- ✅ 화면 좌표를 캔버스 기준 상대 좌표로 변환 (기본 처리)
- ✅ DPR 고려하여 논리적 캔버스 크기 계산
- ✅ **회전 변환 필요** (CSS transform: rotate(90deg) 적용됨)
- ✅ 변환된 x, y 좌표를 사용하여 그리드 위치 계산

## 5. 좌표 변환 문제점

### 현재 문제
1. **회전된 요소의 경계 상자**: `getBoundingClientRect()`는 회전된 요소의 경계 상자를 반환
2. **좌표계 불일치**: 클릭 좌표는 회전된 요소 기준이지만, Canvas는 원래 좌표계로 렌더링됨
3. **크기 교환**: `rect.width`와 `rect.height`가 원래 캔버스의 `height`와 `width`와 교환됨

### 올바른 변환 공식
90도 시계방향 회전:
- 원래 좌표 (x, y) → 회전 후 (y, width - x)

역변환 (회전 후 → 원래):
- 회전 후 (x', y') → 원래 (height - y', x')

하지만 회전 후 크기가 바뀌었으므로:
- `originalWidth = rect.height` (회전 후 height는 원래 width)
- `originalHeight = rect.width` (회전 후 width는 원래 height)

## 6. 해결 방안

### 옵션 1: 좌표 변환 제거 (권장)
- 가로 모드에서도 세로 모드와 동일한 로직 사용
- CSS transform만 적용하고, 클릭 좌표는 변환하지 않음
- 대신 그리드 계산 시 col/row를 회전에 맞게 조정

### 옵션 2: 정확한 좌표 변환
- 회전 중심을 기준으로 정확한 역변환 적용
- 회전된 요소의 클릭 좌표를 원래 캔버스 좌표로 정확히 변환

### 옵션 3: 회전 방식 변경
- CSS transform 대신 다른 방식으로 구현
- 예: 캔버스 자체를 회전시키거나, 렌더링 시 회전 적용

## 7. 권장 해결책

세로 모드와 동일한 로직을 사용하되, 가로 모드일 때만 클릭 좌표를 올바르게 변환하는 것이 가장 간단합니다.

핵심은:
1. `getBoundingClientRect()`는 회전된 요소의 경계 상자를 반환
2. 클릭 좌표는 회전된 요소 기준
3. Canvas는 원래 좌표계로 렌더링
4. 따라서 회전된 좌표를 원래 좌표로 변환해야 함
