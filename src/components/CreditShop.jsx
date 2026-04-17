import './CreditShop.css'
import { CREDIT_SHOP } from '../constants/rewards.js'
import { getCreditShopPrice } from '../logic/creditEngine.js'
import { useGameStore } from '../store/useGameStore.js'

export function CreditShop() {
  const floor = useGameStore((state) => state.floor)
  const credits = useGameStore((state) => state.credits)
  const shopOpen = useGameStore((state) => state.shopOpen)
  const shopPurchasesThisFloor = useGameStore((state) => state.shopPurchasesThisFloor)
  const toggleShop = useGameStore((state) => state.toggleShop)
  const buyShopItem = useGameStore((state) => state.buyShopItem)

  return (
    <div className="cr2-shop" data-open={shopOpen}>
      <div className="cr2-shop__head">
        <strong>크레딧 상점</strong>
        <button type="button" onClick={toggleShop}>
          ✕
        </button>
      </div>
      <div className="cr2-shop__items">
        {CREDIT_SHOP.map((item) => {
          const price = getCreditShopPrice(item.baseCost, floor)
          const disabled = credits < price || shopPurchasesThisFloor.includes(item.id)
          return (
            <div key={item.id} className="cr2-shop__item">
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
    </div>
  )
}
