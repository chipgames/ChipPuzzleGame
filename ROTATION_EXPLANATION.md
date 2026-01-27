# 90도 회전 좌표 변환 상세 설명

## 1. 문제 상황

### CSS 회전
```css
.game-board-container.landscape-mode {
  transform: rotate(90deg);  /* 컨테이너를 90도 시계방향으로 회전 */
  transform-origin: center center;  /* 회전 중심은 중앙 */
}
```

### 문제점
- **CSS로 컨테이너가 90도 회전됨**: 시각적으로는 회전되어 보임
- **Canvas는 회전되지 않음**: 내부적으로는 원래 좌표계로 렌더링됨
- **클릭 좌표는 회전된 화면 기준**: 사용자가 클릭한 위치는 회전된 화면 기준 좌표
- **게임 로직은 원래 좌표계 필요**: 스테이지 선택, 젬 클릭 등은 원래 좌표계로 계산해야 함

## 2. 좌표 변환 과정

### 단계별 설명

#### 단계 1: 기본 좌표 계산
```typescript
const rect = canvas.getBoundingClientRect();
let x = event.clientX - rect.left;  // 화면 좌표 → 회전된 canvas 기준 상대 좌표
let y = event.clientY - rect.top;    // 화면 좌표 → 회전된 canvas 기준 상대 좌표
```

**의미:**
- `rect`: 회전된 컨테이너 내부의 canvas 경계 상자
- `x, y`: 회전된 화면에서 클릭한 위치를 canvas 기준 상대 좌표로 변환
- 이 좌표는 **회전된 좌표계**에 있음

#### 단계 2: 원래 캔버스 크기 확인
```typescript
const originalWidth = canvasWidth;   // 원래 캔버스 너비 (예: 1200px)
const originalHeight = canvasHeight;  // 원래 캔버스 높이 (예: 675px)
```

**의미:**
- Canvas 자체는 회전되지 않았으므로, 원래 크기는 변하지 않음
- `canvas.width / dpr`와 `canvas.height / dpr`는 항상 원래 크기

#### 단계 3: 회전된 요소의 경계 상자 크기
```typescript
const rotatedWidth = rect.width;   // 회전 후 경계 상자 너비
const rotatedHeight = rect.height; // 회전 후 경계 상자 높이
```

**의미:**
- `getBoundingClientRect()`는 회전된 요소의 **경계 상자(bounding box)**를 반환
- 90도 회전하면 width와 height가 교환됨
- 예: 원래 1200×675 → 회전 후 경계 상자는 675×1200

#### 단계 4: 회전 중심 계산
```typescript
const rotatedCenterX = rotatedWidth / 2;   // 회전된 요소의 중심 X
const rotatedCenterY = rotatedHeight / 2;  // 회전된 요소의 중심 Y
const originalCenterX = originalWidth / 2;  // 원래 캔버스의 중심 X
const originalCenterY = originalHeight / 2; // 원래 캔버스의 중심 Y
```

**의미:**
- `transform-origin: center center`이므로 회전 중심은 중앙
- 회전 전후 모두 중심점을 기준으로 변환해야 함

#### 단계 5: 중심 기준 상대 좌표로 변환
```typescript
const relativeX = x - rotatedCenterX;  // 회전된 좌표를 중심 기준 상대 좌표로
const relativeY = y - rotatedCenterY;  // 회전된 좌표를 중심 기준 상대 좌표로
```

**의미:**
- 절대 좌표를 중심점 기준 상대 좌표로 변환
- 예: 중심이 (600, 337.5)이고 클릭이 (700, 400)이면 → (100, 62.5)

#### 단계 6: -90도 회전 (역변환)
```typescript
// 90도 시계방향 회전: (x, y) -> (y, width - x)
// 역변환: (x, y) -> (height - y, x)
const originalRelativeX = originalHeight - relativeY;
const originalRelativeY = relativeX;
```

**수학적 설명:**

**90도 시계방향 회전 공식:**
```
원래 좌표 (ox, oy)를 90도 시계방향으로 회전하면:
  rotatedX = oy
  rotatedY = originalWidth - ox
```

**역변환 공식 (회전된 좌표를 원래 좌표로):**
```
회전된 좌표 (rx, ry)를 원래 좌표로 변환:
  originalX = originalHeight - ry
  originalY = rx
```

**예시:**
- 원래 좌표 (100, 50)을 90도 회전 → (50, 1200-100) = (50, 1100)
- 역변환: (50, 1100) → (675-1100, 50) = (-425, 50) ❌ (잘못됨)

**올바른 예시:**
- 원래 좌표 (100, 50)을 90도 회전 → (50, 1200-100) = (50, 1100)
- 역변환: (50, 1100) → (675-1100, 50) = (-425, 50) ❌

**다시 생각해보면:**
90도 시계방향 회전:
- (x, y) → (y, width - x)

역변환 (회전된 좌표를 원래로):
- (x', y') → (height - y', x')

**예시 검증:**
- 원래 (100, 50), width=1200, height=675
- 90도 회전: (50, 1200-100) = (50, 1100)
- 역변환: (675-1100, 50) = (-425, 50) ❌

**문제 발견!** 역변환 공식이 잘못되었을 수 있습니다.

**올바른 역변환:**
90도 시계방향 회전: (x, y) → (y, width - x)
역변환: (x', y') → (width - y', x')

**검증:**
- 원래 (100, 50), width=1200, height=675
- 90도 회전: (50, 1200-100) = (50, 1100)
- 역변환: (1200-1100, 50) = (100, 50) ✅

하지만 코드에서는 `originalHeight - relativeY`를 사용하고 있습니다.

**다시 분석:**
회전 후 경계 상자 크기가 바뀌었으므로:
- rotatedWidth = originalHeight (회전 후 width는 원래 height)
- rotatedHeight = originalWidth (회전 후 height는 원래 width)

따라서:
- 회전된 좌표 (rx, ry)는 rotatedWidth × rotatedHeight 좌표계에 있음
- 원래 좌표 (ox, oy)는 originalWidth × originalHeight 좌표계에 있음

**중심 기준 변환:**
회전된 좌표계에서 중심 기준 상대 좌표: (rx - rotatedCenterX, ry - rotatedCenterY)
원래 좌표계로 변환: (ox - originalCenterX, oy - originalCenterY)

**90도 시계방향 회전 (중심 기준):**
원래 상대 좌표 (dx, dy)를 90도 회전:
- rotatedRelativeX = dy
- rotatedRelativeY = -dx (또는 originalWidth - dx, 좌표계에 따라)

**역변환:**
회전된 상대 좌표 (rdx, rdy)를 원래로:
- originalRelativeX = -rdy (또는 originalHeight - rdy)
- originalRelativeY = rdx

코드에서는:
```typescript
const originalRelativeX = originalHeight - relativeY;
const originalRelativeY = relativeX;
```

이는 다음을 의미:
- originalRelativeX = originalHeight - relativeY
- originalRelativeY = relativeX

**검증:**
원래 상대 좌표 (dx, dy) = (100, 50)
90도 회전: (50, -100) 또는 (50, originalWidth - 100) = (50, 1100)
역변환: (originalHeight - 1100, 50) = (675 - 1100, 50) = (-425, 50) ❌

**문제:** 좌표계가 일치하지 않습니다.

**올바른 접근:**
회전된 좌표계에서:
- rotatedWidth = originalHeight
- rotatedHeight = originalWidth

90도 시계방향 회전 (원점 기준):
- (x, y) → (y, -x)

하지만 화면 좌표계에서는:
- (x, y) → (y, width - x)

역변환:
- (x', y') → (height - y', x')

**코드 검증:**
```typescript
const originalRelativeX = originalHeight - relativeY;  // height - y'
const originalRelativeY = relativeX;                     // x'
```

이것은 다음을 의미:
- originalX = originalCenterX + (originalHeight - relativeY)
- originalY = originalCenterY + relativeX

**예시:**
- 원래 상대 좌표: (100, 50)
- 90도 회전 후 상대 좌표: (50, 1200-100) = (50, 1100) (절대 좌표 기준)
- 중심 기준 상대 좌표로 변환: (50 - 600, 1100 - 337.5) = (-550, 762.5)
- 역변환: (675 - 762.5, -550) = (-87.5, -550) ❌

**문제 발견:** 좌표 변환 로직이 복잡하고 오류가 있을 수 있습니다.

#### 단계 7: 원래 캔버스 좌표로 변환
```typescript
x = originalCenterX + originalRelativeX;
y = originalCenterY + originalRelativeY;
```

**의미:**
- 상대 좌표를 다시 절대 좌표로 변환
- 원래 캔버스의 중심을 기준으로 최종 좌표 계산

## 3. 전체 흐름 요약

```
화면 클릭 좌표 (event.clientX, event.clientY)
  ↓
회전된 canvas 기준 상대 좌표 (x, y)
  ↓
회전된 요소 중심 기준 상대 좌표 (relativeX, relativeY)
  ↓
-90도 회전 (역변환)
  ↓
원래 캔버스 중심 기준 상대 좌표 (originalRelativeX, originalRelativeY)
  ↓
원래 캔버스 절대 좌표 (x, y)
  ↓
게임 로직에서 사용 (스테이지 선택, 젬 클릭 등)
```

## 4. 잠재적 문제점

1. **좌표계 불일치**: 회전된 경계 상자와 원래 캔버스의 좌표계가 다를 수 있음
2. **크기 차이**: `rect.width/height`와 `canvasWidth/Height`가 다를 수 있음
3. **중심점 계산**: 회전 중심과 캔버스 중심이 정확히 일치하는지 확인 필요

## 5. 디버깅 방법

좌표 변환 과정을 로그로 출력하여 각 단계의 값을 확인:
```typescript
console.log('원래 좌표:', { x, y });
console.log('회전된 경계 상자:', { rotatedWidth, rotatedHeight });
console.log('상대 좌표:', { relativeX, relativeY });
console.log('역변환 후:', { originalRelativeX, originalRelativeY });
console.log('최종 좌표:', { x: originalCenterX + originalRelativeX, y: originalCenterY + originalRelativeY });
```
