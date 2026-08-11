import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { phaseOneEntities, yangyangActions } from '../../../data/versions/v3_5/phaseOne'
import type { SimulationInput } from '../../../domain/combat'
import { echoFixedMainStats } from '../../../domain/loadout'
import type { EchoStatKey } from '../../../domain/loadout'
import { simulateDamage } from '../../../simulator/simulate'
import { useCalculatorProjectStore } from '../stores/project'
import { useTimelineStore } from '../stores/timeline'

export function useCalculatorSimulation() {
  const projectStore = useCalculatorProjectStore()
  const timelineStore = useTimelineStore()
  const timelineRefs = storeToRefs(timelineStore)
  const { settings, loadout } = projectStore

  const echoModifiers = computed(() => {
    const values = new Map<EchoStatKey, number>()
    const add = (key: EchoStatKey, value: number) => values.set(key, (values.get(key) ?? 0) + value)

    ;[loadout.mainEcho, ...loadout.secondaryEchoes].forEach((slot) => {
      add(slot.mainStat.stat, slot.mainStat.value)
      const fixed = echoFixedMainStats[slot.cost]
      add(fixed.stat, fixed.value)
      slot.subStats.forEach((stat) => add(stat.stat, stat.value))
    })
    return values
  })

  const simulationInput = computed<SimulationInput>(() => ({
    resonatorLevel: 90,
    resonanceChain: settings.resonanceChain,
    weaponRefinement: settings.weaponRefinement,
    criticalMode: settings.criticalMode,
    enemy: {
      level: settings.enemyLevel,
      resistances: { aero: settings.aeroResistancePercent / 100 },
    },
    stats: {
      attack: Math.max(
        0,
        (phaseOneEntities.resonator.attack + phaseOneEntities.weapon.attack) *
          (1 +
            phaseOneEntities.resonator.inherentAttackBonus +
            (echoModifiers.value.get('attackPercent') ?? 0) / 100) +
          (echoModifiers.value.get('attackFlat') ?? 0),
      ),
      criticalRate:
        phaseOneEntities.resonator.criticalRate +
        phaseOneEntities.weapon.criticalRate +
        (echoModifiers.value.get('criticalRate') ?? 0) / 100,
      criticalDamageMultiplier:
        phaseOneEntities.resonator.criticalDamageMultiplier +
        (echoModifiers.value.get('criticalDamage') ?? 0) / 100,
      aeroDamageBonus:
        phaseOneEntities.resonator.inherentAeroDamageBonus +
        phaseOneEntities.sonata.aeroDamageBonus +
        (echoModifiers.value.get('aeroDamageBonus') ?? 0) / 100,
      genericDamageBonus: 0,
      damageTypeBonuses: {
        basic: (echoModifiers.value.get('basicDamageBonus') ?? 0) / 100,
        heavy: (echoModifiers.value.get('heavyDamageBonus') ?? 0) / 100,
        skill: (echoModifiers.value.get('skillDamageBonus') ?? 0) / 100,
        liberation: (echoModifiers.value.get('liberationDamageBonus') ?? 0) / 100,
      },
    },
    actions: timelineRefs.actions.value,
  }))

  const result = computed(() => simulateDamage(simulationInput.value, yangyangActions))

  return { projectStore, timelineStore, timelineRefs, settings, loadout, result }
}
