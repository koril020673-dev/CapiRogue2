import './ShopScreen.css'
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

export function ShopScreen() {
  const open = useGameStore((state) => state.shopScreenOpen)
  const floor = useGameStore((state) => state.floor)
  const credits = useGameStore((state) => state.credits)
  const capital = useGameStore((state) => state.capital)
  const debt = useGameStore((state) => state.debt)
  const companyHealth = useGameStore((state) => state.companyHealth)
  const maxHealth = useGameStore((state) => state.maxHealth)
  const momentum = useGameStore((state) => state.momentum)
  const brandValue = useGameStore((state) => state.brandValue)
  const qualityScore = useGameStore((state) => state.qualityScore)
  const lastSettlement = useGameStore((state) => state.lastSettlement)
  const rewardPending = useGameStore((state) => state.rewardPending)
  const rewardSelection = useGameStore((state) => state.rewardSelection)
  const rewardClaimed = useGameStore((state) => state.rewardClaimed)
  const shopPurchasesThisFloor = useGameStore((state) => state.shopPurchasesThisFloor)
  const selectReward = useGameStore((state) => state.selectReward)
  const claimReward = useGameStore((state) => state.claimReward)
  const buyShopItem = useGameStore((state) => state.buyShopItem)
  const continueFromShop = useGameStore((state) => state.continueFromShop)

  if (!open || !rewardPending) {
    return null
  }

  return (
    <div className="cr2-shop-screen__overlay">
      <div className="cr2-shop-screen">
        <div className="cr2-shop-screen__head">
          <div>
            <p className="cr2-shop-screen__eyebrow">Post Floor</p>
            <h2>Floor {floor - 1} 보상 & 상점</h2>
          </div>
          <span className="cr2-shop-screen__credits">🔷 {credits}C</span>
        </div>

        <div className="cr2-shop-screen__layout">
          <section className="cr2-shop-screen__section">
            <div className="cr2-shop-screen__section-head">
              <h3>이번 층 보상</h3>
              <span>{getGradeChip(rewardPending.grade)}</span>
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
                  <button
                    type="button"
                    disabled={rewardClaimed}
                    onClick={() => {
                      selectReward(option.id)
                    }}
                  >
                    선택
                  </button>
                </article>
              ))}
            </div>
            <button
              type="button"
              className="cr2-shop-screen__claim"
              disabled={!rewardSelection || rewardClaimed}
              onClick={claimReward}
            >
              보상 확정
            </button>
          </section>

          <aside className="cr2-shop-screen__side">
            <section className="cr2-shop-screen__summary">
              <h3>현재 상태</h3>
              <dl>
                <div>
                  <dt>현금</dt>
                  <dd>{Math.round(capital).toLocaleString()}원</dd>
                </div>
                <div>
                  <dt>부채</dt>
                  <dd>{Math.round(debt).toLocaleString()}원</dd>
                </div>
                <div>
                  <dt>체력</dt>
                  <dd>
                    {companyHealth}/{maxHealth}
                  </dd>
                </div>
                <div>
                  <dt>모멘텀</dt>
                  <dd>{momentum >= 0 ? `+${momentum}` : momentum}</dd>
                </div>
                <div>
                  <dt>점유율</dt>
                  <dd>{((lastSettlement?.myShare ?? 0) * 100).toFixed(1)}%</dd>
                </div>
                <div>
                  <dt>브랜드</dt>
                  <dd>{Math.round(brandValue)}</dd>
                </div>
                <div>
                  <dt>품질</dt>
                  <dd>{Math.round(qualityScore)}</dd>
                </div>
              </dl>
            </section>

            <section className="cr2-shop-screen__section">
              <div className="cr2-shop-screen__section-head">
                <h3>Credit 상점</h3>
                <span>🔷 {credits}C</span>
              </div>
              <div className="cr2-shop-screen__shop-list">
                {CREDIT_SHOP.map((item) => {
                  const price = getCreditShopPrice(item.baseCost, floor)
                  const disabled = credits < price || shopPurchasesThisFloor.includes(item.id)
                  return (
                    <div key={item.id} className="cr2-shop-screen__shop-item">
                      <div>
                        <strong>{item.label}</strong>
                        <span>{price}C</span>
                      </div>
                      <button type="button" disabled={disabled} onClick={() => buyShopItem(item.id)}>
                        구매
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          </aside>
        </div>

        <div className="cr2-shop-screen__footer">
          <button type="button" disabled={!rewardClaimed} onClick={continueFromShop}>
            다음 층으로 →
          </button>
        </div>
      </div>
    </div>
  )
}
