# 최적화 가이드

이 문서는 프로젝트의 성능 최적화 및 개선 사항에 대한 가이드를 제공합니다.

## 📦 번들 분석

### 번들 분석 실행

```bash
npm run build:analyze
```

이 명령어를 실행하면:
1. 프로덕션 빌드가 생성됩니다
2. `dist/stats.html` 파일이 생성됩니다
3. 브라우저에서 `dist/stats.html`을 열어 번들 크기를 시각적으로 확인할 수 있습니다

### 번들 분석 결과 해석

- **Treemap**: 각 모듈의 크기를 직사각형으로 표시
- **Gzip Size**: Gzip 압축 후 크기
- **Brotli Size**: Brotli 압축 후 크기

### 번들 최적화 팁

1. **큰 의존성 확인**: 번들 분석에서 큰 모듈을 찾아 필요 여부 확인
2. **코드 스플리팅**: 큰 컴포넌트는 lazy loading 사용
3. **Tree Shaking**: 사용하지 않는 코드 제거
4. **의존성 최적화**: 불필요한 의존성 제거

## 🖼️ 이미지 최적화

### 현재 이미지 파일

프로젝트에는 다음 이미지 파일들이 있습니다:

- `ChipGames_Logo.png` - 로고 이미지
- `ChipGames_favicon-*.png` - 파비콘 이미지들

### 이미지 최적화 권장 사항

#### 1. WebP 형식 변환

WebP는 PNG/JPEG보다 25-35% 작은 파일 크기를 제공합니다.

**변환 방법:**

```bash
# ImageMagick 사용
magick convert ChipGames_Logo.png ChipGames_Logo.webp

# 또는 cwebp 도구 사용
cwebp -q 80 ChipGames_Logo.png -o ChipGames_Logo.webp
```

**코드에서 사용:**

```typescript
// WebP 지원 여부 확인 후 사용
const getImagePath = (filename: string) => {
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp')
    .indexOf('data:image/webp') === 0;
  
  if (supportsWebP) {
    return getAssetPath(filename.replace(/\.(png|jpg)$/, '.webp'));
  }
  return getAssetPath(filename);
};
```

#### 2. 이미지 압축

기존 PNG/JPEG 파일도 압축할 수 있습니다:

- **온라인 도구**: TinyPNG, Squoosh
- **CLI 도구**: imagemin, sharp

#### 3. 반응형 이미지

다양한 화면 크기에 맞는 이미지 제공:

```html
<picture>
  <source srcset="logo-2x.webp" media="(min-width: 800px)" type="image/webp">
  <source srcset="logo-2x.png" media="(min-width: 800px)">
  <source srcset="logo.webp" type="image/webp">
  <img src="logo.png" alt="Logo">
</picture>
```

#### 4. Lazy Loading

이미지 lazy loading은 이미 구현되어 있습니다 (`loading="lazy"`).

## 🚀 성능 최적화

### 현재 적용된 최적화

1. **코드 스플리팅**
   - React.lazy를 사용한 컴포넌트 lazy loading
   - Vendor 청크 분리 (react, react-dom)

2. **번들 최적화**
   - Tree shaking
   - Minification (프로덕션)
   - Gzip/Brotli 압축

3. **이미지 최적화**
   - Lazy loading
   - 적절한 크기 사용

4. **캐싱 전략**
   - 파일명에 버전 및 해시 포함
   - 브라우저 캐싱 활용

### 추가 최적화 권장 사항

#### 1. Service Worker 추가

오프라인 지원 및 캐싱을 위해 Service Worker를 추가할 수 있습니다:

```typescript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('chip-puzzle-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/assets/main.js',
        '/assets/main.css',
      ]);
    })
  );
});
```

#### 2. 폰트 최적화 ✅

프로젝트는 시스템 폰트를 사용하여 최적화되었습니다:

- **시스템 폰트 사용**: 추가 다운로드 없이 즉시 렌더링
- **플랫폼별 최적 폰트**: macOS/iOS, Windows, Android, Linux 자동 선택
- **font-display: swap**: 즉시 텍스트 표시
- **폰트 렌더링 최적화**: antialiased, optimizeLegibility
- **폴백 체인 개선**: 플랫폼별 최적 폰트 우선순위

웹 폰트를 사용하는 경우의 권장 사항:

- **font-display: swap** 사용
- **preload**로 중요한 폰트 미리 로드
- **subset**으로 필요한 문자만 포함
- **local() 우선**: 시스템 폰트 우선 사용

#### 3. 애니메이션 최적화

Canvas 애니메이션 최적화:

- GPU 가속 활용 (`will-change` CSS 속성)
- `requestAnimationFrame` 사용 (이미 적용됨)
- 불필요한 리렌더링 방지

## 📊 성능 모니터링

### Web Vitals

프로젝트는 자동으로 Core Web Vitals를 측정합니다:

- **LCP**: < 2.5초 (좋음)
- **FID**: < 100ms (좋음)
- **CLS**: < 0.1 (좋음)

### 성능 리포트 확인

개발 환경에서는 콘솔에서 Web Vitals 로그를 확인할 수 있습니다.

## 🔍 번들 크기 목표

- **초기 번들**: < 200KB (gzipped)
- **총 번들**: < 500KB (gzipped)
- **이미지**: < 100KB (각 이미지)

## 📝 최적화 체크리스트

- [x] 코드 스플리팅
- [x] Tree shaking
- [x] Minification
- [x] 번들 분석 도구
- [ ] WebP 이미지 변환 (가이드 제공)
- [x] Service Worker
- [x] 폰트 최적화
- [x] Lazy loading
- [x] 성능 모니터링
- [x] GPU 가속 (Canvas 애니메이션)

## 🛠️ 도구

### 번들 분석
- `rollup-plugin-visualizer`: 번들 시각화

### 이미지 최적화
- `imagemin`: 이미지 압축
- `sharp`: 고성능 이미지 처리
- `cwebp`: WebP 변환

### 성능 측정
- Lighthouse: 전체 성능 점수
- Web Vitals: Core Web Vitals 측정
- Chrome DevTools: 성능 프로파일링

