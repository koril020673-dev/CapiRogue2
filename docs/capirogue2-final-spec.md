# CapiRogue2 — Complete Rebuild Specification (Final)

Read this entire document before writing any code.
Do not reference or copy from the original CapiRogue codebase.
Generate one file at a time. Stop after each file and wait for confirmation.

---

## Tech Stack

React 18 + Zustand + Vite 6
Plain CSS — `cr2-` prefix on ALL class names
DeepSeek API via server proxy (`api/deepseek.js`)
All game state in Zustand — never `useState` for game values

---

## Design Tokens

```css
:root {
  --cr2-bg:        #0F0F14;
  --cr2-s1:        #17171F;
  --cr2-s2:        #1E1E28;
  --cr2-s3:        #262633;
  --cr2-border:    rgba(255,255,255,0.08);
  --cr2-accent:    #F0A500;
  --cr2-positive:  #4ADE80;
  --cr2-negative:  #FF6B6B;
  --cr2-warning:   #FACC15;
  --cr2-neutral:   #94A3B8;
  --cr2-text:      #F0EDE8;
  --cr2-dim:       #6B7280;
  --cr2-purple:    #A78BFA;
  font-family: 'Inter', system-ui, sans-serif;
}
```

---

## Screen Flow

```text
App.jsx
  │
  ├─ TitleScreen              (new game / continue / history / settings)
  │
  ├─ AdvisorSelectScreen      (pick advisor — pokerouge style)
  │
  ├─ [gameStatus: playing]
  │    └─ GameScreen
  │         ├─ TopBar          (floor map + status strip)
  │         ├─ MainPanel       (strategy + order + event card)
  │         ├─ SidePanel       (company status + rival status)
  │         └─ Modals
  │              ├─ ShopScreen        (after each floor)
  │              ├─ SettlementModal   (after settlement)
  │              ├─ EconomicWarBanner (war floors)
  │              └─ BlackSwanModal
  │
  └─ GameOverScreen           (clear / bankrupt / hostile)
```

---

## 1. Title Screen

```text
┌─────────────────────────────┐
│                             │
│       CapiRogue 2           │
│   경제 생존 로그라이크       │
│                             │
│   ▶  계속하기               │  ← active only if save exists
│      새 게임                │
│      플레이 이력            │
│      설정                   │
│                             │
└─────────────────────────────┘
```

No "불러오기" — only one save slot (most recent run auto-saved).
"계속하기" loads it directly.

### Play History Screen

```text
┌──────┬──────────┬──────┬────────┬─────────┬──────────────┐
│  #   │ 어드바이저│ 도달층│ 결과   │ 순자산  │ 유산 카드     │
├──────┼──────────┼──────┼────────┼─────────┼──────────────┤
│  12  │ Analyst  │  67층│ 파산   │ -1,200만│ 시작 자본 +3% │
│  11  │ Trader   │ 120층│ 클리어B│  1억2천 │ 품질 +3       │
└──────┴──────────┴──────┴────────┴─────────┴──────────────┘
```

### Settings Screen

```text
배경음악 볼륨    [────●──────]  60%
효과음 볼륨     [──────●────]  80%
글자 크기       [작음  중간  큼]
텍스트 속도     [느림  보통  빠름  즉시]
숫자 애니메이션  [ON  OFF]
조작 힌트        [ON  OFF]   ← UI hints only, NOT economic hints
```

Economic education hints are always ON and cannot be disabled.
Gameplay UI hints (button tooltips, tutorial text) can be toggled.

---

## 2. Advisor Select Screen (pokerouge style)

2-panel layout. Left: scrollable advisor list. Right: selected advisor detail.

```text
┌──────────────────┬──────────────────────────────────────┐
│  어드바이저 목록  │  Analyst                              │
│                  │  주니어 애널리스트                     │
│  ✅ Analyst      │                                       │
│  🔒 Trader       │  수수료: 순이익의 8%                   │
│  🔒 Strategist   │                                       │
│  🔒 Quant        │  정보력   ★★★★★                      │
│  🔒 Auditor      │  공격력   ★★☆☆☆                      │
│  🔒 Economist    │  생존력   ★★★☆☆                      │
│  🔒 Venture      │  난이도   쉬움                        │
│  🔒 Arbitrageur  │                                       │
│  🔒 Actuary      │  패시브: 없음                         │
│  🔒 Sovereign    │  특기: 없음                           │
│                  │                                       │
│                  │  해금 조건: 처음부터                   │
│                  │                                       │
│                  │  "모든 수치를 보여드리겠습니다.        │
│                  │   대신 제 수수료를 챙겨가죠."          │
│                  │                                       │
│                  │  [ 선택 확정 ]                        │
└──────────────────┴──────────────────────────────────────┘
```

Locked advisors when clicked:
- Name: visible
- Job title: visible
- Stats (★): hidden as ???
- Unlock condition: visible
- Description quote: hidden

No difficulty select screen — game always starts at fixed difficulty:

```js
const FIXED_DIFFICULTY = {
  capital:      30_000_000,
  debt:         0,
  interestRate: 0.072,
}
```

Advisor choice creates the perceived difficulty difference.

---

## 3. Game Screen Layout

```text
┌─────────────────────────────────────────────────────┐
│  FloorMap (top bar, 48px)                           │
│  StatusStrip (health / momentum / credits / cash)   │
├──────────────────────────┬──────────────────────────┤
│  MainPanel               │  SidePanel               │
│  - EconBanner            │  - CompanyStatus         │
│  - AdvisorBubble         │  - RivalStatus           │
│  - StrategySelect        │  - WarningAlerts         │
│  - OrderSelect (3 btns)  │                          │
│  - EventCard             │                          │
│  - AdvanceButton         │                          │
└──────────────────────────┴──────────────────────────┘
```

### StatusStrip (always visible, top of screen)

```text
Floor 42  |  ████████░░ 8  |  ↑↑↓  +1  |  🔷 450C  |  💰 28,500,000원
```

Compact single line. Tap/click to expand full detail panel.

### SidePanel — CompanyStatus

```text
내 회사
──────────────────
현금     28,500,000
부채     10,000,000
순자산   18,500,000
브랜드   42pt
품질     68pt
저항성   8%
점유율   34.2%
```

### SidePanel — RivalStatus

```text
경쟁사
──────────────────
🏭 메가플렉스
가격    22,000원
점유율  41.5%
상태    ██████░░  공세중
```

### Warning Alerts (SidePanel bottom)

```text
Trigger conditions:
- cash < fixedCost × 2      → "⚠️ 현금 부족 경고"
- consecutive loss × 3      → "⚠️ 3연속 적자"
- companyHealth <= 3         → "🔴 위기" (red border on entire screen)

Show once per floor entry only. Not repeated on each action.
```

---

## 4. One Floor Flow

```text
1. Floor entry
   → Check and show warnings if triggered
   → Display current status

2. [Choice 1] Strategy select (pick 1 of 4)
   → After picking, show OrderSelect (3 buttons)

3. [Choice 2] Order amount (pick 1 of 3)

4. [Choice 3] Event card (1 card from 45, pick 1 of 3~4 choices)

5. Settlement runs automatically after all 3 choices made

6. SettlementModal opens

7. After closing SettlementModal → ShopScreen opens

8. After ShopScreen → next floor
```

No separate "next floor" button on main screen.
Settlement triggers when all choices are complete.

---

## 5. Strategy + Order System

### Strategy select (Choice 1)

4 buttons. Pick 1.
After picking, OrderSelect appears below.

```js
const STRATEGIES = {
  volume: {
    label: '💰 물량 공세',
    desc: '가격을 낮춰 점유율을 뺏는다',
    priceMul: 1.3,
    qualityMode: 'budget',
    vendorMode: 'bulk',
    orderRange: [0.8, 1.5],
  },
  quality: {
    label: '⭐ 품질 차별화',
    desc: '프리미엄으로 마진을 극대화한다',
    priceMul: 2.0,
    qualityMode: 'premium',
    vendorMode: 'quality',
    orderRange: [0.4, 0.9],
  },
  marketing: {
    label: '📢 마케팅 집중',
    desc: '인지도를 올려 수요를 끌어온다',
    priceMul: 1.5,
    qualityMode: 'standard',
    vendorMode: 'standard',
    awarenessBonus: 0.10,
    orderRange: [0.6, 1.2],
  },
  safe: {
    label: '🛡️ 안전 경영',
    desc: '현금을 지키며 버틴다',
    priceMul: 1.4,
    qualityMode: 'standard',
    vendorMode: 'standard',
    orderRange: [0.3, 0.7],
  },
}
```

### Order select (Choice 2)

3 buttons. Range defined by chosen strategy.

```text
💰 물량 공세 선택 후:

[보수적  64개]   [기본  96개]   [공격적  120개]
선결제 1,920,000  2,880,000     3,600,000
```

Show prepayment amount under each button.
Actual numbers calculated from demand estimate × strategy range.

```js
// demand estimate shown to player = BASE_DEMAND × ecoWeight (rounded)
// order options:
// conservative = estimate × range[0]
// standard     = estimate × mid of range
// aggressive   = estimate × range[1]
```

---

## 6. Event Card System

45 cards. 1 drawn per floor by weighted random.
Weight adjusts based on game state.
3~4 choices per card.

Choice types and border colors:

```text
safe    → --cr2-neutral  border
normal  → --cr2-accent   border
gamble  → --cr2-warning  border
absurd  → --cr2-purple   border
```

Absurd choices can produce surprisingly good outcomes.

```js
const CHOICE_OUTCOME_PROBS = {
  safe:   { good: 1.00 },
  normal: { good: 0.70, bad: 0.30 },
  gamble: { good: 0.30, bad: 0.70 },
  absurd: { great: 0.20, mid: 0.40, bad: 0.40 },
}
```

After choice: floating toast top-center, 2s auto-dismiss.

---

## 7. Settlement Modal

Opens automatically after settlement.

```text
┌──────────────────────────────────────────┐
│  Floor 42  완료                     ✕    │
├──────────────────────────────────────────┤
│  매출       원가        고정비            │
│  4,500,000  3,200,000   800,000          │
│                                          │
│         이번 달 순이익                    │
│    ┌──────────────────────────┐          │
│    │     +500,000원           │  ← green │
│    └──────────────────────────┘          │
│                                          │
│  판매 45개 / 발주 80개 / 수요 120개      │
│  ⚠ 폐기 35개  (-1,050,000원)            │
│  점유율 38.2%                            │
│                                          │
│  경기  평시 → 위축                       │
│  체력  ████████░░  8→7  (-1)            │
│  모멘텀  ↑↑↓↓↓  -2                      │
│                                          │
│  💡 불황기 사치재는 수요가 급감합니다     │
│                                          │
│         [ 확인 ]                         │
└──────────────────────────────────────────┘
```

Rules:
- Waste line: only if `waste > 0`
- Hint line: only if education hint exists for this outcome
- Health change: show before → after with color delta
- Closing modal → ShopScreen opens automatically

---

## 8. Shop Screen (every floor, after settlement)

Vertical 2-section layout.

```text
┌──────────────────────────────────────────────────────┐
│  Floor 42  보상 & 상점                                │
├──────────────────────────────────────┬───────────────┤
│  이번 층 보상  (3개 중 1개 선택)      │  현재 상태    │
│                                      │               │
│  ┌──────────┐┌──────────┐┌────────┐ │  현금  28.5M  │
│  │ 🟦 희귀  ││ ⬜ 일반  ││🟪 고급 │ │  부채  10.0M  │
│  │ 품질 +5  ││Credit    ││체력 +3 │ │  체력  7/10   │
│  │          ││+200C     ││        │ │  모멘텀  -2   │
│  │ [선택]   ││[선택]    ││[선택]  │ │  점유율 34%   │
│  └──────────┘└──────────┘└────────┘ │  브랜드 42    │
│                                      │  품질   68    │
├──────────────────────────────────────┤               │
│  Credit 상점  🔷 450C 보유            │  다음 이벤트  │
│                                      │  Floor 60     │
│  체력 +2      100C  [구매]           │  경제전쟁     │
│  이벤트 리롤  100C  [구매]           │  (18층 후)    │
│  폐기 면제    100C  [구매]           │               │
│  라이벌 동결  200C  [구매]           │               │
│  전략 미리보기 200C [구매]           │               │
│                                      │               │
│  (여러 번 구매 가능. 층당 각 1회)    │               │
└──────────────────────────────────────┴───────────────┤
│                    [ 다음 층으로 → ]                  │
└──────────────────────────────────────────────────────┘
```

Reward grade display: show grade label (`⬜🟦🟪🟨`) on each reward card.
Credit shop: multiple purchases allowed. Each item max 1 per floor.

### Credit price inflation

```js
function getCreditPrice(basePrice, floor) {
  if (floor <= 20)  return basePrice * 1.0
  if (floor <= 40)  return basePrice * 1.5
  if (floor <= 60)  return basePrice * 2.0
  if (floor <= 80)  return basePrice * 2.5
  if (floor <= 100) return basePrice * 3.0
  return basePrice * 3.5
}
```

### Reward grade probabilities

Fixed — same every floor. Momentum adds bonus.

```js
const BASE_PROBS = { normal:0.55, rare:0.30, epic:0.12, legend:0.03 }
// momentum +5 adds +0.10 to legend chance
// momentum positive: only upgrades, never downgrades
```

---

## 9. Economic War System

Replaces boss battle concept entirely.
Uses real economic event names.

```js
const ECONOMIC_WARS = {
  20:  { name:'원가 덤핑 공세',       rival:'megaflex',  duration:5 },
  40:  { name:'프리미엄 브랜드 독점', rival:'aura',       duration:5 },
  60:  { name:'바이럴 마케팅 폭격',   rival:'memecatch',  duration:5 },
  80:  { name:'원유가 폭등',          rival:'all',        duration:8 },
  100: { name:'기술 특허 장벽',       rival:'nexuscore',  duration:5 },
  120: { name:'최후의 시장 쟁탈전',   rival:'all',        duration:'clear' },
}
```

### War banner (fixed top of screen during war)

```text
⚔️ 경제 전쟁 — 원유가 폭등              남은 기간: 4층
메가플렉스  ████████░░    아우라  ██████░░░░
```

War event cards have red border. Appear alongside normal event card.

### Multi-rival health logic

```js
// Each rival calculated independently each floor
rivals.forEach(rival => {
  if (myShare > rival.share) {
    rival.health -= 1
  } else {
    myHealth -= 1
  }
})

// Economic war specific:
// my+/rival-  → rival.health -2
// my+/rival+  → no change
// my-/rival-  → rival.health -1, myHealth -1
// my-/rival+  → myHealth -2
```

Rival retreats at health `<= 20%`.
Returns with new name from rotation array next war.

### Black Swan + War collision

Black Swan takes priority. War pauses. War floor counter continues.
War resumes after Black Swan ends.

---

## 10. Advisor System

```js
const ADVISORS = {
  analyst: {
    name: 'Analyst',
    job: '주니어 애널리스트',
    quote: '"모든 수치를 보여드리겠습니다. 대신 수수료를 챙겨가죠."',
    unlockCondition: 'always',
    fee: { type:'percent', value:0.08, lossFixed:200_000 },
    infoLevel: 'full',
    stats: { info:5, attack:2, survival:3 },
    difficulty: '쉬움',
    passive: null,
    special: null,
    themeColor: '#60A5FA',
  },
  trader: {
    name: 'Trader',
    job: '트레이더',
    quote: '"빠르게. 핵심만."',
    unlockCondition: 'clear × 1',
    fee: { type:'fixed', value:100_000 },
    infoLevel: 'market',
    stats: { info:2, attack:5, survival:2 },
    difficulty: '보통',
    passive: '물량 공세 효과 +10%',
    special: '경제전쟁 내 흑자 라운드: 라이벌 체력 추가 -1',
    themeColor: '#F97316',
  },
  strategist: {
    name: 'Strategist',
    job: '전략 컨설턴트',
    quote: '"한 발 앞을 보세요."',
    unlockCondition: 'clear × 2',
    fee: { type:'percent', value:0.05, lossFixed:0 },
    infoLevel: 'macro',
    stats: { info:3, attack:2, survival:5 },
    difficulty: '보통',
    passive: '안전 경영 효과 +20%',
    special: '경제전쟁 진입 시 체력 +2 자동 회복',
    themeColor: '#34D399',
  },
  quant: {
    name: 'Quant',
    job: '퀀트 애널리스트',
    quote: '"감정은 필요 없습니다."',
    unlockCondition: 'Analyst × 5 plays',
    fee: { type:'creditDeduct', value:100 },
    infoLevel: 'full+',
    stats: { info:5, attack:3, survival:3 },
    difficulty: '어려움',
    passive: '모멘텀 효과 ×1.5',
    special: '매 10층: 라이벌 정밀 분석 리포트',
    themeColor: '#A78BFA',
  },
  auditor: {
    name: 'Auditor',
    job: '회계감사관',
    quote: '"숫자는 거짓말을 하지 않습니다."',
    unlockCondition: 'clear × 3',
    fee: null,
    infoLevel: 'finance',
    stats: { info:4, attack:1, survival:4 },
    difficulty: '보통',
    passive: '부채 이자 -10%',
    special: '적자 발생 시 원인 한 줄 자동 분석',
    themeColor: '#FACC15',
  },
  economist: {
    name: 'Economist',
    job: '이코노미스트',
    quote: '"거시를 보면 미시가 보입니다."',
    unlockCondition: 'reach floor 50 × 3',
    fee: { type:'percent', value:0.03 },
    infoLevel: 'macro+',
    stats: { info:4, attack:2, survival:4 },
    difficulty: '보통',
    passive: '위축·불황 수요 감소 -10% 완화',
    special: '블랙스완 1층 전 경고',
    themeColor: '#2DD4BF',
  },
  venture: {
    name: 'Venture',
    job: '벤처 캐피탈리스트',
    quote: '"리스크가 없으면 리턴도 없습니다."',
    unlockCondition: 'economic war win × 10',
    fee: null,
    infoLevel: 'rival',
    stats: { info:2, attack:5, survival:1 },
    difficulty: '어려움',
    passive: '경제전쟁 승리 시 Credit +200C 추가',
    special: '라이벌 후퇴 후 재등장 2층 지연',
    themeColor: '#F43F5E',
  },
  arbitrageur: {
    name: 'Arbitrageur',
    job: '차익거래사',
    quote: '"타이밍이 전부입니다."',
    unlockCondition: 'legacy cards × 5',
    fee: null,
    infoLevel: 'phase',
    stats: { info:3, attack:3, survival:3 },
    difficulty: '보통',
    passive: '품목 카테고리 전환 비용 없음',
    special: '경기 국면 전환 시 수요 +15% 1층',
    themeColor: '#8B5CF6',
  },
  actuary: {
    name: 'Actuary',
    job: '보험계리사',
    quote: '"최악을 대비하면 최악은 없습니다."',
    unlockCondition: 'reach floor 80 × 3',
    fee: { type:'creditAdd', value:100 },
    infoLevel: 'health',
    stats: { info:2, attack:1, survival:5 },
    difficulty: '어려움',
    passive: '치명적 손실(-3) 확률 30% 감소',
    special: '게임당 1회: 체력 0 대신 1로 버팀',
    themeColor: '#06B6D4',
  },
  sovereign: {
    name: 'Sovereign',
    job: '국부펀드 운용역',
    quote: '"시장은 결국 내 편입니다."',
    unlockCondition: 'use 5+ different advisors',
    fee: null,
    infoLevel: 'full',
    stats: { info:5, attack:3, survival:4 },
    difficulty: '어려움',
    passive: null,
    special: '각 경제전쟁: 라이벌 초기 체력 -1',
    themeColor: '#F0A500',
  },
}
```

### Advisor fee application

```js
function applyAdvisorFee(netProfit, advisor) {
  switch (advisor.fee?.type) {
    case 'percent':
      if (netProfit > 0) return Math.round(netProfit * advisor.fee.value)
      return advisor.fee.lossFixed ?? 0
    case 'fixed':
      return advisor.fee.value
    case 'creditDeduct':
      // deduct from credits, not capital
      return 0
    case 'creditAdd':
      // add to credit shop prices
      return 0
    default:
      return 0
  }
}
```

---

## 11. Core Formulas

### Demand

```js
function calcDemand({ category, econPhase, industryTier,
                      momentum, blackSwanMul = 1, eventMul = 1 }) {
  const ecoWeight  = ECO_WEIGHTS[category][econPhase]
  const tierMul    = TIER_RECESSION_MUL[industryTier]
  const momentumMul = 1 + (MOMENTUM_EFFECT[momentum]?.demandMul ?? 0)
  const rand       = 0.9 + Math.random() * 0.2
  return Math.round(1000 * ecoWeight * tierMul * momentumMul
                        * blackSwanMul * eventMul * rand)
}
```

### Attraction & Market Share

```js
function calcAttraction({ quality, brand, sellPrice,
                          resistance, category, econPhase, awareness = 0 }) {
  if (!sellPrice || sellPrice <= 0) return 0
  const E = ECO_WEIGHTS[category][econPhase] * (1 + awareness)
  const denom = sellPrice * (1 - Math.min(resistance, 0.99))
  if (denom <= 0) return 0
  return ((quality + brand) * E) / denom
}

function calcMarketShares(players) {
  const sq    = players.map(p => Math.max(0, p.attraction) ** 2)
  const total = sq.reduce((a, v) => a + v, 0)
  if (total <= 0) return players.map(() => 0)
  return sq.map(s => s / total)
}
```

### Economy Phases (5 stages)

```js
const ECO_WEIGHTS = {
  essential: { boom:0.85, growth:0.95, stable:1.00, contraction:1.10, recession:1.30 },
  normal:    { boom:1.40, growth:1.20, stable:1.00, contraction:0.80, recession:0.60 },
  luxury:    { boom:1.90, growth:1.50, stable:1.00, contraction:0.55, recession:0.25 },
}

const ECO_TRANSITIONS = {
  boom:        { boom:0.40, growth:0.50, stable:0.10, contraction:0.00, recession:0.00 },
  growth:      { boom:0.25, growth:0.45, stable:0.25, contraction:0.05, recession:0.00 },
  stable:      { boom:0.05, growth:0.20, stable:0.45, contraction:0.25, recession:0.05 },
  contraction: { boom:0.00, growth:0.10, stable:0.30, contraction:0.40, recession:0.20 },
  recession:   { boom:0.00, growth:0.00, stable:0.30, contraction:0.45, recession:0.25 },
}
```

### OEM Settlement

```js
function calcSettlement({
  sellPrice, orderQty, demand, myShare,
  vendorBase, qualityMode, factoryActive,
  monthlyInterest, monthlyRent, safetyCost, fixedCost,
  advisorFee, opCostMul = 1.0, shutdownLeft = 0,
}) {
  const QUALITY_MUL = { budget:0.80, standard:1.00, premium:1.50 }
  const VENDOR_MUL  = { standard:1.00, bulk:0.85, quality:1.30 }

  const unitCost   = Math.round(vendorBase
    * QUALITY_MUL[qualityMode]
    * (factoryActive ? 0.60 : 1.0))
  const prepayment = unitCost * orderQty

  const demandSold = shutdownLeft > 0 ? 0
    : Math.round(demand * myShare)
  const actualSold = Math.min(demandSold, orderQty)
  const waste      = orderQty - actualSold
  const wasteCost  = unitCost * waste
  const revenue    = actualSold * sellPrice

  const fixedTotal = Math.round(
    (monthlyInterest + monthlyRent + safetyCost + fixedCost)
    * opCostMul
  )

  const netProfit = revenue - prepayment - fixedTotal - advisorFee

  return { unitCost, prepayment, actualSold, waste, wasteCost,
           revenue, fixedTotal, advisorFee, netProfit }
}
```

---

## 12. Company Health System

```js
// Health changes per floor
function calcHealthChange({ netProfit, waste, orderQty, eventResult, isWarFloor }) {
  let delta = 0
  if (netProfit < -50_000_000)      delta -= 3
  else if (netProfit < -20_000_000) delta -= 2
  else if (netProfit < 0)           delta -= 1
  if (waste / orderQty > 0.5)       delta -= 1
  if (eventResult?.healthDelta)     delta += eventResult.healthDelta
  if (isWarFloor && myLostRound)    delta -= 1
  return delta
}

// Auto recovery
// 5 consecutive profitable floors → +1
```

---

## 13. Momentum System

```js
// Range: -5 to +5
const MOMENTUM_EFFECT = {
   5: { demandMul:+0.12, rewardUpChance:+0.10 },
   4: { demandMul:+0.09, rewardUpChance:+0.07 },
   3: { demandMul:+0.06, rewardUpChance:+0.05 },
   2: { demandMul:+0.04, rewardUpChance:+0.03 },
   1: { demandMul:+0.02, rewardUpChance:+0.01 },
   0: { demandMul: 0,    rewardUpChance: 0    },
  '-1': { demandMul:-0.02, rewardUpChance:0   },
  '-2': { demandMul:-0.04, rewardUpChance:0   },
  '-3': { demandMul:-0.06, rewardUpChance:0   },
  '-4': { demandMul:-0.09, rewardUpChance:0   },
  '-5': { demandMul:-0.12, rewardUpChance:0   },
}
// Negative momentum never lowers reward grade
```

---

## 14. Legacy Card System

Generated on game end. No duplicates. All auto-applied next run.

```js
const LEGACY_CONDITIONS = [
  { when: 'bankrupt < floor 40',    bonus: { startCredit: 100 }          },
  { when: 'bankrupt floor 40-79',   bonus: { startCapitalMul: 1.03 }     },
  { when: 'bankrupt floor 80+',     bonus: { startBrand: 5 }             },
  { when: 'clear',                  bonus: { startQuality: 3 }           },
  { when: 'clear + nw 100M+',       bonus: { startCapitalMul: 1.05 }     },
  { when: 'clear + nw 500M+',       bonus: { startResistance: 0.02 }     },
  { when: 'war wins 3+',            bonus: { rivalStartHealth: -1 }      },
  { when: 'total fee paid 0',       bonus: { feeDiscount: 0.01 }         },
]
```

---

## 15. Game Over Screen

```text
┌──────────────────────────────────────┐
│         💀  파산                     │
│         42층에서 무너졌습니다         │
├──────────────────────────────────────┤
│  최종 순자산    -12,500,000원        │
│  도달 층수      42층                 │
│  경제전쟁 승리  1회                  │
│  누적 순이익    +8,200,000원         │
├──────────────────────────────────────┤
│  이번 판의 전환점  (AI 분석)         │
│  [28층] 불황기 사치재 → 수요 -60%   │
│  [35층] 덤핑 맞대응 → 자본 소진     │
│  [41층] 고위험 투자 → 체력 0        │
├──────────────────────────────────────┤
│  유산 카드 획득                       │
│  Analyst 42층 파산 → 시작 자본 +3%  │
├──────────────────────────────────────┤
│  클리어 등급                         │
│  C: 생존   B: 전쟁 3승              │
│  A: 순자산 1억   S: 전쟁 전승+3억   │
├──────────────────────────────────────┤
│  [ 다시 시작 ]  [ 어드바이저 변경 ] │
└──────────────────────────────────────┘
```

---

## 16. Education Hint System

```js
// Economic hints — always shown, cannot be disabled
function getEducationHint(settlement) {
  const { strategyId, econPhase, itemCategory,
          waste, orderQty, netProfit } = settlement

  if (waste / orderQty > 0.4)
    return '발주량이 수요를 초과하면 재고가 폐기됩니다. (공급 과잉)'
  if (itemCategory === 'luxury'
      && ['recession','contraction'].includes(econPhase))
    return '불황기에 사치재는 수요가 급감합니다. (소득 탄력성)'
  if (strategyId === 'volume' && econPhase === 'recession')
    return '불황기 물량 공세는 폐기 리스크가 큽니다.'
  if (strategyId === 'quality' && netProfit > 0)
    return '품질 차별화로 가격 경쟁을 피했습니다. (비가격 경쟁)'
  if (netProfit < -20_000_000)
    return '연속 적자는 신용등급을 낮추고 금리를 높입니다.'
  return null
}

// UI hints — toggleable in settings
// These are button tooltips and tutorial labels only
```

---

## 17. Full Zustand Store Fields

```js
{
  // Navigation
  screen: 'title',   // title|advisor|game|gameover
  gameStatus: 'idle', // idle|playing|clear|bankrupt|hostile

  // Setup
  advisor: null,

  // Fixed difficulty (no selection)
  capital:      30_000_000,
  debt:         0,
  interestRate: 0.072,

  // Progress
  floor:        1,
  maxFloors:    120,
  floorPhase:   'normal', // normal|economic-war|black-swan

  // Player status
  companyHealth:    10,
  maxHealth:        10,
  momentum:         0,
  momentumHistory:  [],

  // Credits
  credits: 0,

  // Economy
  econPhase:     'stable',
  industryTier:  1,
  itemCategory:  'normal',

  // Finance
  brandValue:       0,
  qualityScore:     60,
  priceResistance:  0,
  marketing:        { awarenessBonus: 0 },

  // Vendor (single, fixed)
  vendor: { baseUnitCost: 30_000, baseQuality: 60 },

  // Factory
  factory: {
    built:         false,
    buildTurnsLeft: 0,
    safetyOn:      true,
    accidentRisk:  0,
    upgradeLevel:  0,
  },

  // Current floor choices
  selectedStrategy:  null,
  selectedOrderTier: null,  // 'conservative'|'standard'|'aggressive'
  selectedEventChoice: null,

  // Rivals
  rivals:               [],
  activeEconomicWar:    null,
  activeBlackSwan:      null,
  activeEffects:        [],

  // Settlement
  lastSettlement:   null,
  profitHistory:    [],
  cumulativeProfit: 0,

  // Legacy & meta
  legacyCards: [],
  meta: {
    totalPlays:       0,
    clears:           0,
    advisorUsed:      [],
    warWins:          0,
    floor50Count:     0,
    floor80Count:     0,
    analystPlays:     0,
    legacyCardCount:  0,
  },

  // Settings
  settings: {
    bgmVolume:    0.6,
    sfxVolume:    0.8,
    fontSize:     'medium',
    textSpeed:    'normal',
    numAnimation: true,
    uiHints:      true,
    // educationHints always true — not stored
  },

  // Save
  saveExists: false,
}
```

---

## 18. File List — Generate in Order

```text
Constants:
01. src/constants/economy.js
02. src/constants/advisors.js
03. src/constants/rivals.js
04. src/constants/strategies.js
05. src/constants/rewards.js
06. src/constants/blackSwans.js
07. src/constants/economicWars.js
08. src/constants/educationHints.js
09. src/constants/legacy.js
10. src/constants/docEvents.js

Logic:
11. src/logic/demandEngine.js
12. src/logic/marketEngine.js
13. src/logic/settlementEngine.js
14. src/logic/econEngine.js
15. src/logic/healthEngine.js
16. src/logic/momentumEngine.js
17. src/logic/creditEngine.js
18. src/logic/rewardEngine.js
19. src/logic/rivalEngine.js
20. src/logic/metaEngine.js
21. src/logic/saveEngine.js

Store:
22. src/store/useGameStore.js

Screens:
23. src/screens/TitleScreen.jsx + .css
24. src/screens/AdvisorSelectScreen.jsx + .css
25. src/screens/GameScreen.jsx + .css
26. src/screens/ShopScreen.jsx + .css
27. src/screens/GameOverScreen.jsx + .css
28. src/screens/HistoryScreen.jsx + .css
29. src/screens/SettingsScreen.jsx + .css

Components:
30. src/components/FloorMap.jsx + .css
31. src/components/StatusStrip.jsx + .css
32. src/components/SidePanel.jsx + .css
33. src/components/EconBanner.jsx + .css
34. src/components/AdvisorBubble.jsx + .css
35. src/components/StrategySelect.jsx + .css
36. src/components/OrderSelect.jsx + .css
37. src/components/EventCard.jsx + .css
38. src/components/SettlementModal.jsx + .css
39. src/components/EconomicWarBanner.jsx + .css
40. src/components/BlackSwanModal.jsx + .css
41. src/components/WarningAlerts.jsx + .css

Entry:
42. src/App.jsx
43. src/main.jsx
44. src/styles/global.css
```

---

## Absolute Rules

- `cr2-` prefix on EVERY CSS class name
- CSS variables for EVERY color — no hardcoded hex in CSS files
- Zustand for EVERY game value — no `useState` for game state
- No code from original CapiRogue codebase
- One file at a time — stop after each, wait for confirmation
- Write complete working code — no TODOs, no placeholder functions
- 2-line max explanation after each file

Start with file 01: `src/constants/economy.js`

---

## Previous Prompt Delta

| 변경 항목 | 내용 |
|:---|:---|
| 난이도 선택 | 제거. 고정 자본 3천만 단일 시작 |
| 발주량 | 슬라이더 제거. 보수적/기본/공격적 3버튼 |
| 상태 패널 | StatusStrip 상단 고정 + SidePanel 항상 표시 |
| 경고 시스템 | 3가지 조건 명확화. 층 시작 시 1회만 |
| 상점 화면 | 세로 2분할. 보상 위 / Credit 상점 아래 |
| 어드바이저 선택 | 2분할 상세 화면. 잠긴 어드바이저 능력 숨김 |
| 타이틀 화면 | 계속하기·새게임·이력·설정. 불러오기 삭제 |
| 힌트 | 조작힌트(ON/OFF) + 교육힌트(항상 ON) 분리 |
| 플레이 이력 | 유산 카드 항목 추가 |
