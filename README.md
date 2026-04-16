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

## 현재 구현된 내용

### 완료된 작업
- ✅ 조언자 정의 상수 (4가지 타입)
- ✅ 라이벌 정의 상수 (4가지 경쟁사)
- ✅ 층 마일스톤 상수 (30개 이벤트)
- ✅ Zustand 기반 기본 게임 상태 관리
- ✅ 조언자 선택 화면 (`AdvisorSelectScreen.jsx`)
- ✅ 층 진행 맵 (`FloorMap.jsx`)
- ✅ Vercel 배포 설정 (`vercel.json`)
- ✅ 게임 개선 계획 문서 (`PLAN.md`)

## 실행 방법

```bash
npm install
npm run dev
```

배포용 빌드는 아래 명령으로 확인할 수 있습니다.

```bash
npm run build
```

### Vercel 배포

`vercel.json`에 Vite 기반 빌드 설정을 포함하고 있으므로, Vercel에서 연결하면 자동으로 배포됩니다.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
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

PLAN.md          # 게임 개선 계획 (우선순위별)
vercel.json      # Vercel 배포 설정
```

## 다음 작업 예정 (PLAN.md 참고)

### Phase 1: 기본 게임 루프 (1-2주)
- `GameScreen.jsx` - 메인 게임 플레이 화면
- `RivalHealthBar.jsx` - 경쟁사 체력 시각화
- `RivalEncounterBanner.jsx` - 이벤트 배너
- `floorPhaseEngine.js` - 층 단계 관리 로직

### Phase 2: 이벤트/선택 시스템 (2-3주)
- `DecisionScreen.jsx` - 선택지 제시 화면
- `decisionEngine.js` - 선택 결과 계산
- `RivalBossModal.jsx` - 보스전 상세 모달
- `advisorInfoEngine.js` - 조언자 정보 생성
- `rivalEncounterEngine.js` - 전투 로직

### Phase 3: 폴리시 및 마무리 (1-2주)
- `DifficultyScreen.jsx` - 난이도 선택
- `ResultScreen.jsx` - 결과 화면
- 디버깅 및 밸런싱

## 주요 시스템

### 조언자 (4가지)
- **정보 담당관**: 정밀 분석형 (BEP/가격 정보 노출)
- **영업왕**: 공세 운영형 (판매 저항력 보너스)
- **노이즈 오라클**: 변칙 예측형 (자본 보너스 + 오정보)
- **공장장**: 효율 최적화형 (공장 비용 절감)

### 라이벌 (4가지)
- **메가플렉스**: 가격 전쟁 (20층 보스, 100층 보스)
- **아우라**: 프리미엄 경쟁 (40층 보스, 80층 보스)
- **밈캐치**: 버즈 지배 (60층 보스, 110층 mid-boss)
- **넥서스코어**: 기술 장벽 (80층 보스, 120층 최종 보스)

### 층 구조 (총 120층)
- **10층 단위**: mid-boss 경고 이벤트
- **20층 단위**: 라이벌 보스전
- **80층 이후**: 블랙 스완 위협 추가

## 참고

현재 저장소는 Vite 기반 프런트엔드 프로젝트이며, 상태 관리는 Zustand를 사용합니다.  
이후에도 구조를 늘릴 때는 화면에서 직접 보이는 이름과 설명을 먼저 한글로 정리한 뒤 컴포넌트를 확장하는 방향을 기본 원칙으로 삼습니다.

## 배포 상태
- **원본 저장소**: [GitHub - koril020673-dev/CapiRogue2](https://github.com/koril020673-dev/CapiRogue2)
- **Vercel**: 연결 대기 중
