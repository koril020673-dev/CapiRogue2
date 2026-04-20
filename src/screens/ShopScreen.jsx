import { useEffect, useMemo, useState } from 'react'
import './ShopScreen.css'
import { getAdvisorPhaseComment } from '../constants/advisors.js'
import { CREDIT_SHOP } from '../constants/rewards.js'
import { getCreditShopPrice } from '../logic/creditEngine.js'
import { useGameStore } from '../store/useGameStore.js'

function getGradeChip(grade) {
  switch (grade) {
    case 'legend':
      return '🟨 전설'
    case 'epic':
      return '🟪 고급'
    case 'rare':
      return '🟦 희귀'
    default:
      return '⬜ 일반'
  }
}

function formatMoney(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

function buildStaticBriefing({ advisor, econPhase, consumerGroupRatios }) {
  const advisorLine = getAdvisorPhaseComment(advisor, econPhase)
  const valueRatio = Math.round((consumerGroupRatios?.value ?? 0) * 100)

  let recommendation = '브랜드와 품질의 균형을 유지하세요.'
  if (valueRatio >= 35) {
    recommendation = '가성비 수요가 높아 박리다매 또는 안전 경영이 유리합니다.'
  } else if ((consumerGroupRatios?.quality ?? 0) >= 0.25) {
    recommendation = '품질 수요가 두꺼워 품질 확보 전략이 통할 수 있습니다.'
  } else if ((consumerGroupRatios?.brand ?? 0) >= 0.25) {
    recommendation = '브랜드 소비자가 많은 구간이라 브랜딩 투자 효율이 좋습니다.'
  }

  return `${advisorLine} 가성비 수요 ${valueRatio}% 구간으로 ${recommendation}`
}

export function ShopScreen() {
  const floorStage = useGameStore((state) => state.floorStage)
  const floor = useGameStore((state) => state.floor)
  const credits = useGameStore((state) => state.credits)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const momentum = useGameStore((state) => state.momentum)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const econPhase = useGameStore((state) => state.econPhase)
  const advisor = useGameStore((state) => state.advisor)
  const consumerGroupRatios = useGameStore((state) => state.consumerGroupRatios)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const rewardPending = useGameStore((state) => state.rewardPending)
  const rewardSelection = useGameStore((state) => state.rewardSelection)
  const rewardClaimed = useGameStore((state) => state.rewardClaimed)
  const shopPurchasesThisFloor = useGameStore((state) => state.shopPurchasesThisFloor)
  const selectReward = useGameStore((state) => state.selectReward)
  const claimReward = useGameStore((state) => state.claimReward)
  const buyShopItem = useGameStore((state) => state.buyShopItem)
  const continueFromShop = useGameStore((state) => state.continueFromShop)

  const [aiBriefing, setAiBriefing] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (floorStage === 'shop') {
      setAiBriefing('')
      setAiLoading(false)
    }
  }, [floorStage, floor])

  const staticBriefing = useMemo(
    () =>
      buildStaticBriefing({
        advisor,
        econPhase,
        consumerGroupRatios,
      }),
    [advisor, consumerGroupRatios, econPhase],
  )

  if (floorStage !== 'shop' || !rewardPending) {
    return null
  }

  const requestAiBriefing = async () => {
    if (aiLoading) {
      return
    }

    setAiLoading(true)
    try {
      const response = await fetch('/api/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: [
            'CapiRogue2 advisor briefing.',
            `Advisor: ${advisor}`,
            `Floor: ${floor}`,
            `Economy: ${econPhase}`,
            `Capital: ${capital}`,
            `Debt: ${debt}`,
            `Momentum: ${momentum}`,
            `Brand: ${brandValue}`,
            `Quality: ${qualityScore}`,
            `Market share: ${((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%`,
            `Consumer ratios: ${JSON.stringify(consumerGroupRatios)}`,
            'Return 2 concise Korean sentences with a tactical recommendation.',
          ].join('\n'),
        }),
      })

      if (!response.ok) {
        throw new Error('briefing_failed')
      }

      const data = await response.json()
      const content =
        data.reply ??
        data.content ??
        data.message ??
        data.output_text ??
        'AI 브리핑을 불러오지 못했습니다.'
      setAiBriefing(String(content))
    } catch {
      setAiBriefing('AI 브리핑을 불러오지 못했습니다. 현재는 정적 브리핑을 참고해주세요.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <section className="cr2-shop-screen cr2-game__panel">
      <div className="cr2-shop-screen__head">
        <div>
          <p className="cr2-shop-screen__eyebrow">Floor {floor - 1}</p>
          <h2>보상 & 상점</h2>
        </div>
        <span className="cr2-shop-screen__credits">🔷 {credits}C 보유</span>
      </div>

      <section className="cr2-shop-screen__section">
        <div className="cr2-shop-screen__section-head">
          <h3>Credit 아이템</h3>
          <span>각 아이템은 이번 층 1회 구매 가능</span>
        </div>

        <div className="cr2-shop-screen__shop-grid">
          {CREDIT_SHOP.map((item) => {
            const price = getCreditShopPrice(item.baseCost, floor)
            const purchased = shopPurchasesThisFloor.includes(item.id)
            const disabled = credits < price || purchased

            return (
              <article key={item.id} className="cr2-shop-screen__shop-card" data-disabled={disabled}>
                <strong>{item.label}</strong>
                <span>{price}C</span>
                <button type="button" disabled={disabled} onClick={() => buyShopItem(item.id)}>
                  {purchased ? '구매 완료' : '구매'}
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="cr2-shop-screen__section">
        <div className="cr2-shop-screen__section-head">
          <h3>이번 층 랜덤 보상</h3>
          <span>
            {getGradeChip(rewardPending.grade)} + 기본 Credit {rewardPending.credits}C
          </span>
        </div>

        <div className="cr2-shop-screen__reward-grid">
          {rewardPending.options.map((option) => (
            <article
              key={option.id}
              className="cr2-shop-screen__reward-card"
              data-selected={rewardSelection === option.id}
              data-claimed={rewardClaimed}
            >
              <div className="cr2-shop-screen__reward-chip">{getGradeChip(rewardPending.grade)}</div>
              <strong>{option.label}</strong>
              <button type="button" disabled={rewardClaimed} onClick={() => selectReward(option.id)}>
                선택
              </button>
            </article>
          ))}
        </div>

        <div className="cr2-shop-screen__reward-actions">
          <button
            type="button"
            className="cr2-shop-screen__claim"
            disabled={!rewardSelection || rewardClaimed}
            onClick={claimReward}
          >
            보상 확정
          </button>
        </div>
      </section>

      <section className="cr2-shop-screen__section">
        <div className="cr2-shop-screen__section-head">
          <h3>어드바이저 브리핑</h3>
          <button type="button" className="cr2-shop-screen__briefing-btn" onClick={requestAiBriefing}>
            {aiLoading ? '브리핑 생성 중...' : '브리핑 더 보기 (AI)'}
          </button>
        </div>
        <div className="cr2-shop-screen__briefing">
          <p>{staticBriefing}</p>
          {aiBriefing ? <p className="cr2-shop-screen__briefing-ai">{aiBriefing}</p> : null}
        </div>
      </section>

      <section className="cr2-shop-screen__section">
        <div className="cr2-shop-screen__section-head">
          <h3>현재 상태 요약</h3>
        </div>
        <div className="cr2-shop-screen__summary">
          <span>현금 {formatMoney(capital)}</span>
          <span>부채 {formatMoney(debt)}</span>
          <span>
            체력 {companyHealth}/{maxHealth}
          </span>
          <span>모멘텀 {momentum >= 0 ? `+${momentum}` : momentum}</span>
          <span>점유율 {((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%</span>
          <span>브랜드 {Math.round(brandValue)}</span>
          <span>품질 {Math.round(qualityScore)}</span>
        </div>
      </section>

      <div className="cr2-shop-screen__footer">
        <button type="button" disabled={!rewardClaimed} onClick={continueFromShop}>
          다음 층으로 →
        </button>
      </div>
    </section>
  )
}
