# CapiRogue

CapiRogue는 로그라이크 구조를 가진 사업 시뮬레이션 게임입니다.  
이 저장소는 기존 구조를 단순히 유지보수하는 대신, 층 진행 방식과 라이벌 이벤트 중심 구조로 다시 만드는 리빌드 작업 공간입니다.

## 현재 목표

- 120턴 직선 구조를 `120층 사업 던전` 구조로 전환
- 조언자 선택 화면 추가
- 10층 단위 경고 이벤트, 20층 단위 라이벌 보스전 도입
- 라이벌 상태를 숫자뿐 아니라 체력 바로 시각화
- 이후 화면과 문서 대부분을 한글 기준으로 정리

## 언어 원칙

- 게임 내 사용자 노출 텍스트는 한글로 작성합니다.
- 개발자가 읽는 설명성 문서도 가능한 한 한글로 작성합니다.
- 로고 및 게임명 `CapiRogue`만 영어로 유지합니다.

## 현재 구현된 첫 번째 슬라이스

- 조언자 정의 상수
- 라이벌 정의 상수
- 층 마일스톤 상수
- Zustand 기반 기본 게임 상태
- 조언자 선택 화면
- 층 진행 맵

## 실행 방법

```bash
npm install
npm run dev
```

배포용 빌드는 아래 명령으로 확인할 수 있습니다.

```bash
npm run build
```

## 현재 폴더 구조

```text
src/
  components/
    FloorMap.jsx
  constants/
    advisors.js
    floorMilestones.js
    rivals.js
  screens/
    AdvisorSelectScreen.jsx
  store/
    useGameStore.js
  App.jsx
  App.css
  index.css
```

## 다음 작업 예정

- `DifficultyScreen.jsx`
- `GameScreen.jsx`
- `RivalEncounterBanner.jsx`
- `RivalBossModal.jsx`
- `RivalHealthBar.jsx`
- `advisorInfoEngine.js`
- `floorPhaseEngine.js`
- `rivalEncounterEngine.js`

## 참고

현재 저장소는 Vite 기반 프런트엔드 프로젝트이며, 상태 관리는 Zustand를 사용합니다.  
이후에도 구조를 늘릴 때는 화면에서 직접 보이는 이름과 설명을 먼저 한글로 정리한 뒤 컴포넌트를 확장하는 방향을 기본 원칙으로 삼습니다.
