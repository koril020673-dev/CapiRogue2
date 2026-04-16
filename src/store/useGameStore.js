import { create } from 'zustand'
import { ADVISORS } from '../constants/advisors.js'
import {
  createEncounterFromMilestone,
  getFloorMilestone,
  getFloorPhase,
} from '../constants/floorMilestones.js'
import {
  applyRivalCapitalDelta,
  calculateAllRivalHealth,
  createInitialRivalCapital,
  createInitialRivalHealth,
} from '../constants/rivals.js'

const initialRivalCapital = createInitialRivalCapital()
const initialRivalHealth = createInitialRivalHealth()

function createInitialState() {
  return {
    screen: 'advisor-select',
    advisor: 'analyst',
    advisorPreview: ADVISORS.analyst,
    floor: 1,
    floorPhase: 'normal',
    activeRivalEncounter: null,
    rivalCapital: initialRivalCapital,
    rivalHealth: initialRivalHealth,
    hoveredAdvisor: 'analyst',
    currentMilestone: getFloorMilestone(1),
  }
}

export const useGameStore = create((set, get) => ({
  ...createInitialState(),

  setScreen: (screen) => set({ screen }),

  selectAdvisor: (advisorId) => {
    const advisor = ADVISORS[advisorId] ?? ADVISORS.analyst

    set({
      advisor: advisor.id,
      advisorPreview: advisor,
    })
  },

  setHoveredAdvisor: (advisorId) => set({ hoveredAdvisor: advisorId }),

  clearHoveredAdvisor: () =>
    set((state) => ({
      hoveredAdvisor: state.advisor,
    })),

  setFloor: (floorValue) => {
    const nextFloor = Math.max(1, Math.min(floorValue, 120))
    const milestone = getFloorMilestone(nextFloor)

    set({
      floor: nextFloor,
      floorPhase: getFloorPhase(nextFloor),
      currentMilestone: milestone,
      activeRivalEncounter: createEncounterFromMilestone(nextFloor),
    })
  },

  advanceFloor: () => {
    const nextFloor = Math.max(1, Math.min(get().floor + 1, 120))
    const milestone = getFloorMilestone(nextFloor)

    set({
      floor: nextFloor,
      floorPhase: getFloorPhase(nextFloor),
      currentMilestone: milestone,
      activeRivalEncounter: createEncounterFromMilestone(nextFloor),
    })
  },

  setFloorPhase: (phase) => set({ floorPhase: phase }),

  setActiveRivalEncounter: (encounter) =>
    set({
      activeRivalEncounter: encounter,
      floorPhase: encounter?.type === 'boss' ? 'boss' : encounter ? 'mid-boss' : 'normal',
    }),

  clearActiveRivalEncounter: () =>
    set((state) => ({
      activeRivalEncounter: null,
      floorPhase: getFloorPhase(state.floor),
    })),

  markEncounterMet: () =>
    set((state) => ({
      activeRivalEncounter: state.activeRivalEncounter
        ? {
            ...state.activeRivalEncounter,
            met: true,
          }
        : null,
    })),

  setRivalCapital: (rivalCapital) =>
    set({
      rivalCapital,
      rivalHealth: calculateAllRivalHealth(rivalCapital),
    }),

  setRivalHealth: (rivalHealth) => set({ rivalHealth }),

  damageRival: (rivalId, capitalDelta) =>
    set((state) => {
      const nextRivalState = applyRivalCapitalDelta(
        state.rivalCapital,
        rivalId,
        capitalDelta,
      )

      return {
        rivalCapital: nextRivalState.rivalCapital,
        rivalHealth: nextRivalState.rivalHealth,
      }
    }),

  resetRunState: () => {
    const advisor = get().advisor
    const advisorPreview = ADVISORS[advisor] ?? ADVISORS.analyst

    set({
      ...createInitialState(),
      advisor,
      hoveredAdvisor: advisor,
      advisorPreview,
    })
  },
}))
