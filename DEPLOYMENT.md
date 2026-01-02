# GitHub Pages 배포 가이드

## 개요

이 프로젝트는 GitHub Pages를 사용하여 배포됩니다. Vite를 사용하여 빌드하고, `gh-pages` 패키지를 통해 자동으로 배포합니다.

## 사전 준비

### 1. 필수 패키지 설치

```bash
npm install
```

### 2. GitHub 저장소 확인

- 저장소 URL: `https://github.com/chipgames/ChipPuzzleGame`
- 배포 브랜치: `gh-pages` (자동 생성됨)

## 배포 방법

### 방법 1: 자동 배포 (권장)

가장 간단한 방법입니다. 한 번의 명령으로 빌드와 배포가 완료됩니다.

```bash
npm run deploy
```

이 명령은 다음을 자동으로 수행합니다:

1. TypeScript 타입 체크 (`tsc`)
2. 프로덕션 빌드 생성 (`npm run build:gh`)
3. `gh-pages` 브랜치에 배포 (`gh-pages -d dist`)

### 방법 2: 수동 배포

단계별로 진행하려면:

```bash
# 1. TypeScript 타입 체크 및 빌드
npm run build:gh

# 2. 빌드 결과 확인
# dist/ 폴더에 빌드된 파일들이 생성되었는지 확인

# 3. GitHub Pages에 배포
npx gh-pages -d dist

**중요**:
- Windows 환경에서는 `gh-pages` 명령어를 직접 실행할 수 없으므로 반드시 `npx`를 사용해야 합니다.
- `gh-pages -d dist` (X) → `npx gh-pages -d dist` (O)
- 또는 `npm run deploy` 명령어를 사용하세요 (권장)
```

## 배포 후 설정

### GitHub Pages 설정 확인

배포 후 GitHub에서 다음 설정을 확인하세요:

1. **저장소로 이동**: https://github.com/chipgames/ChipPuzzleGame
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 설정 확인:
   - **Branch**: `gh-pages` 선택
   - **Folder**: `/ (root)` 선택
   - **Save** 클릭 (변경사항이 있는 경우)

### 접속 URL

배포 완료 후 접속 가능한 URL:

- **프로덕션 URL**: https://chipgames.github.io/ChipPuzzleGame/
- 배포 완료까지 **2-5분** 정도 소요될 수 있습니다.

## 현재 프로젝트 설정

### 빌드 설정

- **Base Path**: `/ChipPuzzleGame/` (프로덕션 빌드 시)
- **빌드 출력**: `dist/` 폴더
- **배포 브랜치**: `gh-pages` (자동 생성)
- **빌드 모드**: `production`

### Vite 설정

`vite.config.ts`에서:

- 개발 서버: `base: "/"`
- 프로덕션 빌드: `base: "/ChipPuzzleGame/"`

## 문제 해결

### 404 에러가 발생하는 경우

1. **GitHub Pages 설정 확인**

   - Settings > Pages에서 Source가 `gh-pages` 브랜치로 설정되어 있는지 확인
   - Folder가 `/ (root)`로 설정되어 있는지 확인

2. **배포 상태 확인**

   - Settings > Pages에서 배포 상태 확인
   - "Your site is live at..." 메시지가 표시되는지 확인
   - 배포가 진행 중이면 "Your site is ready to be published" 메시지가 표시됨

3. **빌드 확인**

   ```bash
   # 빌드가 제대로 생성되었는지 확인
   npm run build:gh
   ls dist/
   ```

4. **캐시 문제**

   - 브라우저 캐시 삭제 (Ctrl + Shift + Delete 또는 Cmd + Shift + Delete)
   - 시크릿 모드에서 접속 시도
   - 하드 리프레시 (Ctrl + F5 또는 Cmd + Shift + R)

5. **빌드 재배포**
   ```bash
   npm run deploy
   ```

### 빌드 오류가 발생하는 경우

1. **TypeScript 오류 확인**

   ```bash
   npm run build
   ```

   - 타입 오류가 있으면 먼저 수정

2. **의존성 확인**

   ```bash
   npm install
   ```

3. **Node.js 버전 확인**
   - Node.js 16 이상 필요
   - `node --version`으로 확인

### 배포가 되지 않는 경우

1. **Git 인증 확인**

   - GitHub 인증이 되어 있는지 확인
   - SSH 키 또는 Personal Access Token 설정 확인

2. **저장소 권한 확인**

   - 저장소에 대한 쓰기 권한이 있는지 확인

3. **gh-pages 패키지 확인**
   ```bash
   npm list gh-pages
   ```
   - 설치되어 있지 않으면: `npm install --save-dev gh-pages`

## 배포 전 체크리스트

- [ ] 모든 변경사항이 커밋되었는지 확인
- [ ] TypeScript 오류가 없는지 확인 (`npm run build`)
- [ ] 로컬에서 빌드가 정상적으로 작동하는지 확인 (`npm run preview`)
- [ ] 환경 변수나 설정이 올바른지 확인
- [ ] 버전 정보가 업데이트되었는지 확인 (`package.json`)

## 루트 도메인으로 배포하기

`https://chipgames.github.io/`로 접속하려면:

1. **vite.config.ts 수정**

   ```typescript
   const base = "/"; // "/ChipPuzzleGame/" 대신 "/" 사용
   ```

2. **저장소 이름 변경**

   - GitHub에서 저장소 이름을 `ChipPuzzleGame`에서 다른 이름으로 변경
   - 또는 Organization/User 페이지를 사용

3. **재배포**
   ```bash
   npm run deploy
   ```

## 추가 정보

### 빌드 스크립트 설명

- `npm run dev`: 개발 서버 실행 (로컬 개발용)
- `npm run build`: TypeScript 체크 + 빌드 (일반 빌드)
- `npm run build:gh`: 프로덕션 모드 빌드 (GitHub Pages용)
- `npm run preview`: 빌드 결과 미리보기
- `npm run deploy`: 빌드 + 배포 (전체 프로세스)

### 배포 프로세스

1. `npm run build:gh` 실행

   - TypeScript 타입 체크
   - Vite 프로덕션 빌드 (`--mode production`)
   - `dist/` 폴더에 빌드 결과 생성

2. `gh-pages -d dist` 실행
   - `dist/` 폴더의 내용을 `gh-pages` 브랜치에 푸시
   - GitHub Pages가 자동으로 배포

### 주의사항

- `gh-pages` 브랜치는 자동으로 생성되며, 수동으로 수정하지 마세요
- `dist/` 폴더는 `.gitignore`에 포함되어 있어 커밋되지 않습니다
- 배포 후 변경사항이 반영되기까지 몇 분이 걸릴 수 있습니다
