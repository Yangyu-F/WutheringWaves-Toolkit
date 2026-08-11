import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { defaultPhaseOneLoadout } from '../../../data/versions/v3_5/phaseOne'
import type { CriticalMode } from '../../../domain/combat'

export const useCalculatorProjectStore = defineStore('calculator-project', () => {
  const settings = reactive({
    resonanceChain: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    weaponRefinement: 1 as 1 | 2 | 3 | 4 | 5,
    enemyLevel: 90,
    aeroResistancePercent: 10,
    criticalMode: 'expected' as CriticalMode,
  })

  const loadout = reactive(structuredClone(defaultPhaseOneLoadout))

  return { settings, loadout }
})
