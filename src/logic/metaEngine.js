const META_KEY = 'cr2_meta'
const LEGACY_KEY = 'cr2_legacy'

const META_DEFAULT = {
  bankruptCount: 0,
  clearCount: 0,
  capitalBonus: 0,
  boomBonus: 0,
  totalPlays: 0,
  clears: 0,
  advisorUsed: [],
  economicWarWins: 0,
  floor50Reached: 0,
  floor80Reached: 0,
  analystPlays: 0,
}

export function loadMeta() {
  try {
    return {
      ...META_DEFAULT,
      ...JSON.parse(localStorage.getItem(META_KEY) || '{}'),
    }
  } catch {
    return { ...META_DEFAULT }
  }
}

export function saveMeta(meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    // Ignore storage write errors.
  }
}

export function loadLegacyCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveLegacyCards(cards) {
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(cards))
  } catch {
    // Ignore storage write errors.
  }
}

export function recordGameEnd(type, meta) {
  const updated = { ...meta, totalPlays: (meta?.totalPlays ?? 0) + 1 }

  if (type === 'bankrupt' || type === 'hostile') {
    updated.bankruptCount = (updated.bankruptCount ?? 0) + 1
    updated.capitalBonus = Math.min(0.15, (updated.capitalBonus ?? 0) + 0.005)
  }

  if (type === 'clear') {
    updated.clearCount = (updated.clearCount ?? 0) + 1
    updated.clears = (updated.clears ?? 0) + 1
    updated.boomBonus = Math.min(0.2, (updated.boomBonus ?? 0) + 0.02)
  }

  saveMeta(updated)
  return updated
}
