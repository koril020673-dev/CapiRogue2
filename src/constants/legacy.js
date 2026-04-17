export const LEGACY_CONDITIONS = [
  { id: 'early_bankrupt', condition: 'bankrupt before floor 40', bonus: { startCredit: 100 } },
  { id: 'mid_bankrupt', condition: 'bankrupt floor 40-79', bonus: { startCapitalMul: 1.03 } },
  { id: 'late_bankrupt', condition: 'bankrupt floor 80+', bonus: { startBrand: 5 } },
  { id: 'clear_basic', condition: 'clear', bonus: { startQuality: 3 } },
  { id: 'clear_100m', condition: 'clear + netWorth 100M+', bonus: { startCapitalMul: 1.05 } },
  { id: 'clear_500m', condition: 'clear + netWorth 500M+', bonus: { startResistance: 0.02 } },
  { id: 'war_winner', condition: 'economic war win × 3+', bonus: { rivalStartHealth: -1 } },
  { id: 'fee_zero', condition: 'advisor fee total 0', bonus: { feeDiscount: 0.01 } },
]
