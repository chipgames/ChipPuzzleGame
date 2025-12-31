# GitHub Pages 배포 가이드

## 배포 방법

### 1. 자동 배포 (권장)
```bash
npm run deploy
```

이 명령은 자동으로:
1. 프로덕션 빌드 생성
2. `gh-pages` 브랜치에 배포
3. GitHub Pages에 자동 게시

### 2. GitHub Pages 설정 확인

배포 후 GitHub에서 다음 설정을 확인하세요:

1. **저장소로 이동**: https://github.com/chipgames/ChipPuzzleGame
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 설정:
   - **Branch**: `gh-pages` 선택
   - **Folder**: `/ (root)` 선택
   - **Save** 클릭

### 3. 접속 URL

배포 완료 후 접속 URL:
- **서브 디렉토리**: https://chipgames.github.io/ChipPuzzleGame/
- 배포 완료까지 **2-5분** 정도 소요될 수 있습니다.

### 4. 문제 해결

#### 404 에러가 발생하는 경우:

1. **GitHub Pages 설정 확인**
   - Settings > Pages에서 Source가 `gh-pages` 브랜치로 설정되어 있는지 확인
   - Folder가 `/ (root)`로 설정되어 있는지 확인

2. **배포 상태 확인**
   - Settings > Pages에서 배포 상태 확인
   - "Your site is live at..." 메시지가 표시되는지 확인

3. **캐시 문제**
   - 브라우저 캐시 삭제 (Ctrl + Shift + Delete)
   - 시크릿 모드에서 접속 시도

4. **빌드 재배포**
   ```bash
   npm run deploy
   ```

### 5. 루트 도메인으로 배포하려면

`https://chipgames.github.io/`로 접속하려면:

1. `vite.config.ts`에서 `base`를 `"/"`로 변경
2. `npm run deploy` 재실행
3. GitHub Pages 설정에서 Custom domain을 사용하거나, 저장소 이름을 변경

## 현재 설정

- **Base Path**: `/ChipPuzzleGame/`
- **배포 브랜치**: `gh-pages`
- **빌드 출력**: `dist/` 폴더

