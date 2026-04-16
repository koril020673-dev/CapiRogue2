# CapiRogue 개선 계획 (plan.md)

## 📊 현재 상태
- **게임 유형**: 120층 경영 시뮬레이션 로그라이크
- **주요 시스템**: 조언자(4종), 라이벌(4종), 층 마일스톤(30개 이벤트)
- **현재 완성도**: 기초 프로토타입 (상태 관리 + UI 스켈레톤)

---

## 🎮 개선/추가할 기능

### 우선순위 1: 핵심 게임플레이 구현
#### 1.1 게임 화면 UI
- [ ] **GameScreen.jsx**: 메인 게임 플레이 화면
  - 현재 층/경쟁사/조건 표시
  - 실시간 상태 모니터링
  - 다음 행동 선택 인터페이스

- [ ] **RivalHealthBar.jsx**: 경쟁사 체력바
  - 라이벌별 자본/체력 시각화
  - 보스전 진행도 표시
  - 대미지 애니메이션

- [ ] **RivalEncounterBanner.jsx**: 이벤트/보스전 배너
  - 층 진행 알림
  - 보스전 조건 표시
  - 특수 규칙 안내

- [ ] **RivalBossModal.jsx**: 보스전 상세 모달
  - 보스전 목표 및 현황
  - 클리어 조건 체크리스트
  - 실패 시 결과 화면

#### 1.2 게임 엔진 로직
- [ ] **floorPhaseEngine.js**: 층 단계 관리
  - 층 진입/진출 시 상태 변화
  - 보스전 승/패 판정
  - 보스 추적 메트릭 계산

- [ ] **rivalEncounterEngine.js**: 라이벌 전투 로직
  - 대미지 계산: `capitalDelta` 적용
  - 특수 규칙 적용 (여론 흔들림, 브랜드 잠식 등)
  - 클리어 조건 확인

- [ ] **advisorInfoEngine.js**: 조언자 정보 생성
  - 현재 층 상황에 따른 추천 조언
  - BEP/가격 정보 필터링 (조언자별)
  - 오정보 생성 (오라클만)

### 우선순위 2: 깊이 있는 시스템
#### 2.1 게임 메트릭 추가
- [ ] **playerStats** 추가
  ```js
  {
    marketShare,       // 시장 점유율(%)
    brandValue,        // 브랜드 가치
    qualityScore,      // 품질 점수
    marketingSpend,    // 마케팅 지출
    rdTier,            // R&D 계층
    capitalRemaining,  // 남은 자본
  }
  ```

- [ ] **difficultyModifier** 추가
  - 선택한 조언자에 따른 난이도 배수
  - 층별 누적 난이도 스케일링

#### 2.2 의사결정 시스템
- [ ] **DecisionScreen.jsx**: 선택지 제시 화면
  - 보스전 중 3가지 선택지 제시
  - mid-boss 이벤트 대응 선택
  - 각 선택의 영향도 표시 (아이콘 기반)

- [ ] **decisionEngine.js**: 선택 결과 계산
  - 선택지별 `playerStats` 변화 계산
  - 라이벌별 반응 (`capitalDelta`)
  - 다음 층 전개 영향도

### 우선순위 3: 게임 루프 완성
#### 3.1 화면 전환 흐름
```
AdvisorSelect → DifficultySelect → GamePlay → BossEncounter → ResultScreen → GameOver
                                                     ↑
                                    (보스 패배 시 여기서 종료)
```

- [ ] **DifficultyScreen.jsx**: 난이도 선택
  - 4가지 조언자 난이도 별 수정자 표시
  - 각 조언자의 장단점 재확인
  - 최종 선택 확인

- [ ] **ResultScreen.jsx**: 게임 결과 화면
  - 최종 달성 층 표시
  - 최종 메트릭 통계
  - 클리어/패배 이유 분석
  - 재도전 버튼

#### 3.2 상태 관리 확장
- [ ] **useGameStore.js** 확대
  ```js
  // 추가할 상태들
  playerStats: {},           // 플레이어 메트릭
  decisionHistory: [],       // 선택 기록
  bossAttemptCount: 0,       // 보스전 시도 횟수
  gameStartTime: null,       // 게임 시작 시간
  isGameRunning: true,       // 게임 진행 중 여부
  ```

- [ ] 새로운 액션들
  ```js
  makeDecision(decisionId)   // 선택지 선택
  advancePhase()             // 단계 진행
  endGame(reason)            // 게임 종료
  recordStatChange()         // 메트릭 변화 기록
  ```

### 우선순위 4: UX/UI 개선
- [ ] **시각적 피드백**
  - 선택 결과 애니메이션
  - 메트릭 변화 플로팅 텍스트
  - 라이벌 반응 이모티콘

- [ ] **접근성**
  - 키보드 단축키 (1,2,3 선택지 선택)
  - 높은 대비 모드 옵션
  - 스크린 리더 지원

- [ ] **정보 계층화**
  - 초보자 모드: 선택의 영향 명시
  - 숙련자 모드: 간결한 정보만 표시

---

## 📋 작업 체크리스트

### Phase 1: 기본 게임 루프 (1-2주)
- [ ] GameScreen.jsx 만들기
- [ ] 상태 변화 로직 구현
- [ ] 층 진행/보스전 화면 통합

### Phase 2: 이벤트/선택 시스템 (2-3주)
- [ ] DecisionScreen.jsx 구현
- [ ] decisionEngine.js 로직
- [ ] 보스전 판정 로직

### Phase 3: 폴리시 및 마무리 (1-2주)
- [ ] ResultScreen 구현
- [ ] 통계/분석 화면
- [ ] 디버깅 및 밸런싱

---

## 🔧 기술적 고려사항

### 상태 관리
- Zustand 계속 사용 (충분히 가벼움)
- 게임 메트릭은 `playerStats` 객체로 중앙화
- 라이벌 상태도 정규화 필요

### 성능
- 선택지 계산은 미리 수행 (선택 시 지연 최소화)
- 애니메이션은 CSS3 기반 (프레임률 안정성)
- 메트릭 변화 로그는 메모리 한도 체크

### 데이터 구조
```js
// playerStats 예시
{
  marketShare: 15,        // 0-100
  brandValue: 120,        // 누적 값
  qualityScore: 140,      // 누적 값
  marketingSpend: 25,     // 이번 턴
  rdTier: 1,             // 1-3
  capitalRemaining: 200,  // 남은 자본
}

// decision 예시
{
  id: 'aggressive-price-cut',
  label: '과감한 가격 인하',
  effects: {
    marketShare: +8,
    capitalRemaining: -30,
    brandValue: -10,
  },
  rivalEffect: {
    'megaflex': -5,  // 자본 손상
  }
}
```

---

## 🎯 최종 목표 상태
- 조언자 선택 → 120층 사업 던전 완주 또는 패배까지 완성된 게임 루프
- 각 선택이 게임 결과에 영향을 미치는 의미 있는 의사결정
- 4가지 조언자별로 다른 플레이 경험

---

## 📝 참고
- README.md의 예정 작업 항목과 대부분 일치
- 한글 중심 UX 유지
- 기존 상수(advisors, rivals, floorMilestones) 적극 활용
