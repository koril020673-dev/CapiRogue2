const SAVE_SLOT_KEY = 'cr2_save_slot'
const HISTORY_KEY = 'cr2_history'
const SETTINGS_KEY = 'cr2_settings'

const DEFAULT_SETTINGS = {
  bgmVolume: 0.6,
  sfxVolume: 0.8,
  fontSize: 'medium',
  textSpeed: 'normal',
  numAnimation: true,
  uiHints: true,
}

export function loadSaveSlot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVE_SLOT_KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveSaveSlot(state) {
  try {
    localStorage.setItem(SAVE_SLOT_KEY, JSON.stringify(state))
  } catch {
    // Ignore storage write errors.
  }
}

export function clearSaveSlot() {
  try {
    localStorage.removeItem(SAVE_SLOT_KEY)
  } catch {
    // Ignore storage write errors.
  }
}

export function loadRunHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function appendRunHistory(entry) {
  const current = loadRunHistory()
  const next = [entry, ...current].slice(0, 30)

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // Ignore storage write errors.
  }

  return next
}

export function loadSettings() {
  try {
    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // Ignore storage write errors.
  }
}

export function hasSaveSlot() {
  return loadSaveSlot() !== null
}

export function getDefaultSettings() {
  return { ...DEFAULT_SETTINGS }
}
