# CapiRogue UI/UX 개편 계획 (GameScreen 기준)

## 1. 개요 및 분석 대상
- **분석 파일**: `src/screens/GameScreen.jsx` 및 `src/screens/GameScreen.css`
- **목표**: 이전 세션의 목표였던 **저사양 학교 컴퓨터를 위한 최적화**, **데이터 가독성 향상**, **깔끔한 코퍼레이트 플랫(Corporate Flat) 디자인** 달성.

## 2. 현재 상태 분석 및 문제점 (UI/UX 및 성능)

### 2.1. 과도한 CSS 렌더링 비용 (성능 저하 요인)
- **복잡한 배경 및 그라데이션**: `radial-gradient`, `linear-gradient` 등이 중첩되어 사용되며 `mix-blend-mode: soft-light`나 `backdrop-filter: blur(8px)` 같은 무거운 연산이 다수 포함되어 있습니다.
- **연속적인 CSS 애니메이션**: `cr2-rush-line`, `cr2-quality-pulse`, `cr2-wave-broadcast` 기믹이 `infinite`로 반복 실행되어 저사양 기기에서 CPU/GPU 리소스를 크게 소모하고 발열을 유발할 수 있습니다.
- **그림자 및 블러 효과**: `box-shadow`, `filter: blur()` 등을 겹쳐서 사용하여 렌더링 비용이 높습니다.

### 2.2. 디자인 스타일 불일치
- 현재 디자인은 화려한 '사이버펑크/게이밍' 느낌에 가깝습니다. (스캔라인 효과, 발광하는 테두리 등)
- 목표인 **'전문적인 기업용/교육용 타이쿤' (Corporate Flat)** 감성에 맞지 않으며 데이터보다 배경 연출이 더 눈에 띕니다.

## 3. UI/UX 개선 계획 (Action Plan)

### Phase 1: 렌더링 최적화 및 불필요한 이펙트 제거
- [ ] **무거운 필터 제거**: `mix-blend-mode`, `backdrop-filter: blur()`, `filter: blur()` 효과 전면 제거.
- [ ] **애니메이션 최소화**: 무한 반복(`infinite`)되는 애니메이션을 제거하고, 상태 변경 시 짧고 민첩한(Snappy) 1회성 트랜지션(0.2s 내외)으로 대체.
- [ ] **스캔라인 및 블렌딩 배경 제거**: `.cr2-game-screen__arena-scanlines`, `.cr2-game-screen__arena-backdrop` 엘리먼트 및 관련 CSS 제거.

### Phase 2: 코퍼레이트 플랫(Corporate Flat) 디자인 적용
- [ ] **단색/플랫 배경 베이스**: 그라데이션 대신 심플하고 현대적인 단색 계열(Solid Color) 배경 사용. (예: 다크 네이비, 차콜 그레이, 화이트 텍스트).
- [ ] **깔끔한 카드 레이아웃**: 테두리를 얇은 1px 솔리드 선이나 아주 연한 투명도로 처리하고, 과도한 `border-radius`(곡률 30px 등)를 보다 단정한 수치(예: 8px~12px)로 감소.
- [ ] **그림자 축소**: 겹겹이 쌓인 `box-shadow`를 제거하거나 가장 단순한 형태의 Soft Shadow 1개로 줄여 데이터가 돋보이도록 변경.
- [ ] **명확한 색상 대비**: 상태 정보(현금, 점유율, 가격)가 뚜렷하게 보이도록 고대비 색상 적용(예: 긍정적 수치에는 선명한 Green, 경고는 Red 등).

### Phase 3: 게임 화면(Layout) 정보 가독성 재구성
- [ ] **HUD 영역 정돈**: `Arena HUD` (경쟁사/플레이어 상태창)의 폰트 사이즈 및 여백 조정을 통해 한눈에 핵심 지표가 파악되도록 재배치.
- [ ] **지휘 패널(Command Zone)**: `prompt-box`와 `command-stack` 영역을 기업용 대시보드의 위젯(Widget)처럼 직관적이고 깔끔한 모듈 형태로 디자인 변경.
- [ ] **반응성 개선**: 학생들의 행동(클릭 등)에 즉각 반응하는 호버(Hover) 및 Active 속성을 Snappy하게 조정.

## 4. 진행 여부 확인
위 계획을 바탕으로 `GameScreen.css`와 `GameScreen.jsx` 파일의 렌더링 최적화 및 스타일 평탄화(Flat Design) 작업을 시작해도 될까요? 수정이 필요한 부분이나 다른 파일을 염두에 두셨다면 말씀해 주세요.
