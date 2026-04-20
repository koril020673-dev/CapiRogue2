import { useEffect, useMemo, useState } from 'react'
import './ShopScreen.css'
import { GRADE_LABEL, CREDIT_SHOP_ITEMS } from '../constants/rewards.js'
import { getAdvisorBriefing } from '../logic/advisorBriefingEngine.js'
import { getPrice } from '../logic/creditEngine.js'
import { useGameStore } from '../store/useGameStore.js'

function fmt(value) {
  return `${Math.round(value ?? 0).toLocaleString()}원`
}

export function ShopScreen() {
  const floorStage = useGameStore((state) => state.floorStage)
  const floor = useGameStore((state) => state.floor)
  const credits = useGameStore((state) => state.credits)
  const advisor = useGameStore((state) => state.advisor)
  const econPhase = useGameStore((state) => state.econPhase)
  const rivals = useGameStore((state) => state.rivals)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const currentRewards = useGameStore((state) => state.currentRewards)
  const rewardSelection = useGameStore((state) => state.rewardSelection)
  const shopPurchasesThisFloor = useGameStore((state) => state.shopPurchasesThisFloor)
  const generateFloorRewards = useGameStore((state) => state.generateFloorRewards)
  const selectReward = useGameStore((state) => state.selectReward)
  const buyItem = useGameStore((state) => state.buyItem)
  const continueFromShop = useGameStore((state) => state.continueFromShop)

  const [briefingOpen, setBriefingOpen] = useState(false)

  useEffect(() => {
    if (floorStage === 'shop' && currentRewards.length === 0) {
      generateFloorRewards()
    }
  }, [currentRewards.length, floorStage, generateFloorRewards])

  const activeRivals = useMemo(
    () => rivals.filter((rival) => rival.active && !rival.bankrupt && !rival.eliminated),
    [rivals],
  )

  const briefing = useMemo(
    () => getAdvisorBriefing(advisor, econPhase, activeRivals),
    [activeRivals, advisor, econPhase],
  )

  if (floorStage !== 'shop') {
    return null
  }

  return (
    <section className="cr2-shop cr2-game__panel">
      <div className="cr2-shop-header">
        <span>🔷 {credits}C</span>
        <span>Floor {floor} 보상</span>
      </div>

      <div className="cr2-shop-credit-row">
        {CREDIT_SHOP_ITEMS.map((item) => {
          const price = getPrice(item.baseCost, floor)
          const done = shopPurchasesThisFloor.includes(item.id)

          return (
            <article key={item.id} className="cr2-credit-item" data-done={done}>
              <span className="cr2-credit-item-icon">{item.icon}</span>
              <span className="cr2-credit-item-name">{item.label}</span>
              <span className="cr2-credit-item-cost">{price}C</span>
              <button
                type="button"
                disabled={credits < price || done}
                onClick={() => buyItem(item.id)}
              >
                {done ? '완료' : '구매'}
              </button>
            </article>
          )
        })}
      </div>

      <div className="cr2-shop-reward-row">
        {currentRewards.map((reward) => (
          <article
            key={reward.id}
            className="cr2-reward-card"
            data-grade={reward.grade}
            data-selected={rewardSelection === reward.id}
            onClick={() => selectReward(reward.id)}
          >
            <span className="cr2-reward-icon">{reward.icon}</span>
            <span className="cr2-reward-grade" data-grade={reward.grade}>
              {GRADE_LABEL[reward.grade]}
            </span>
            <span className="cr2-reward-name">{reward.label}</span>
            <span className="cr2-reward-effect">{reward.effectText}</span>
          </article>
        ))}
      </div>

      {!briefingOpen ? (
        <div className="cr2-shop-footer">
          <button type="button" className="cr2-btn-secondary" onClick={() => setBriefingOpen(true)}>
            현상황
          </button>
          <button
            type="button"
            className="cr2-btn-primary"
            disabled={!rewardSelection}
            onClick={continueFromShop}
          >
            보상 확정 →
          </button>
        </div>
      ) : null}

      {briefingOpen ? (
        <div className="cr2-briefing-panel">
          <div className="cr2-briefing-summary">
            <span>📊</span>
            <p>{briefing}</p>
          </div>

          <div className="cr2-briefing-body">
            <div className="cr2-briefing-rivals">
              <p className="cr2-briefing-col-title">라이벌 전략</p>
              {activeRivals.length ? (
                activeRivals.map((rival) => (
                  <div key={rival.id} className="cr2-briefing-rival-row">
                    <span>
                      {rival.name} ({rival.tier}단계)
                    </span>
                    <span>→ {rival.strategyLabel}</span>
                    <span>{rival.sellPrice?.toLocaleString()}원</span>
                    <span>{Number(rival.marketShare ?? 0).toFixed(1)}%</span>
                  </div>
                ))
              ) : (
                <div className="cr2-briefing-empty">현재 표시할 라이벌 정보가 없습니다.</div>
              )}
            </div>

            <div className="cr2-briefing-company">
              <p className="cr2-briefing-col-title">내 회사 상황</p>
              {[
                ['현금', fmt(capital)],
                ['부채', fmt(debt)],
                ['브랜드', `${Math.round(brandValue)}pt`],
                ['품질', `${Math.round(qualityScore)}pt`],
                ['점유율', `${((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%`],
              ].map(([label, value]) => (
                <div key={label} className="cr2-briefing-stat-row">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
              ))}

              <div className="cr2-briefing-health">
                {Array.from({ length: 10 }, (_, index) => (
                  <div key={index} className="cr2-health-pip" data-filled={index < companyHealth} />
                ))}
                <span>{companyHealth}/10</span>
              </div>
            </div>
          </div>

          <div className="cr2-briefing-footer">
            <button type="button" className="cr2-btn-secondary" onClick={() => setBriefingOpen(false)}>
              현상황 닫기
            </button>
            <button type="button" className="cr2-btn-ghost" onClick={() => setBriefingOpen(false)}>
              돌아가기 ↩
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
