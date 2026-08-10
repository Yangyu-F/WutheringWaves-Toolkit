<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  defaultPhaseOneLoadout,
  phaseOneEntities,
  yangyangActions,
} from '../../../data/versions/v3_5/phaseOne'
import type { CriticalMode, PlannedAction } from '../../../domain/combat'
import type { EchoCost, EchoStatKey } from '../../../domain/loadout'
import {
  echoFixedMainStats,
  echoMainStatValues,
  getEchoMainStatValue,
  validatePhaseOneLoadout,
} from '../../../domain/loadout'
import { simulateDamage } from '../../../simulator/simulate'
import yangyangIcon from '../../../assets/game/characters/yangyang.webp'
import weaponIcon from '../../../assets/game/weapons/qiangu-fuliu.webp'
import echoIcon from '../../../assets/game/echoes/feilian-zhixing.webp'
import sonataIcon from '../../../assets/game/sonatas/xiaogu-changfeng.webp'

const settings = reactive({
  resonanceChain: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
  weaponRefinement: 1 as 1 | 2 | 3 | 4 | 5,
  enemyLevel: 90,
  aeroResistancePercent: 10,
  criticalMode: 'expected' as CriticalMode,
})

const loadout = reactive(structuredClone(defaultPhaseOneLoadout))
const emptySubStats = () =>
  Array.from({ length: 5 }, () => ({ stat: 'attackFlat' as EchoStatKey, value: 0 }))
loadout.mainEcho.subStats = emptySubStats()
loadout.secondaryEchoes.forEach((slot) => (slot.subStats = emptySubStats()))
const selectedActionId = ref(yangyangActions[0]?.id ?? '')
const actionCounter = ref(4)
const plannedActions = ref<PlannedAction[]>([
  { id: 'action-1', actionId: 'changtai-gongji-1', startTimeMs: 0 },
  { id: 'action-2', actionId: 'changtai-gongji-2', startTimeMs: 400 },
  { id: 'action-3', actionId: 'changtai-gongji-3', startTimeMs: 800 },
  { id: 'action-4', actionId: 'changtai-gongji-4', startTimeMs: 1200 },
])

const allEchoSlots = computed(() => [loadout.mainEcho, ...loadout.secondaryEchoes])
const totalEchoCost = computed(() => allEchoSlots.value.reduce((sum, slot) => sum + slot.cost, 0))
const subStatOptions: EchoStatKey[] = [
  'hpFlat',
  'hpPercent',
  'attackFlat',
  'attackPercent',
  'defenseFlat',
  'defensePercent',
  'criticalRate',
  'criticalDamage',
  'energyRegen',
  'basicDamageBonus',
  'heavyDamageBonus',
  'skillDamageBonus',
  'liberationDamageBonus',
]
const echoModifiers = computed(() => {
  const modifiers: Record<EchoStatKey, number> = {
    hpFlat: 0,
    hpPercent: 0,
    attackFlat: 0,
    attackPercent: 0,
    defenseFlat: 0,
    defensePercent: 0,
    criticalRate: 0,
    criticalDamage: 0,
    energyRegen: 0,
    healingBonus: 0,
    aeroDamageBonus: 0,
    basicDamageBonus: 0,
    heavyDamageBonus: 0,
    skillDamageBonus: 0,
    liberationDamageBonus: 0,
  }
  allEchoSlots.value.forEach((slot) => {
    modifiers[slot.mainStat.stat] += slot.mainStat.value
    const fixedStat = echoFixedMainStats[slot.cost]
    modifiers[fixedStat.stat] += fixedStat.value
    slot.subStats.forEach((stat) => (modifiers[stat.stat] += stat.value))
  })
  return modifiers
})
const diagnostics = computed(() => validatePhaseOneLoadout(loadout))
const result = computed(() =>
  simulateDamage(
    {
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
              echoModifiers.value.attackPercent / 100) +
            echoModifiers.value.attackFlat,
        ),
        criticalRate:
          phaseOneEntities.resonator.criticalRate +
          phaseOneEntities.weapon.criticalRate +
          echoModifiers.value.criticalRate / 100,
        criticalDamageMultiplier:
          phaseOneEntities.resonator.criticalDamageMultiplier +
          echoModifiers.value.criticalDamage / 100,
        aeroDamageBonus:
          phaseOneEntities.resonator.inherentAeroDamageBonus +
          phaseOneEntities.sonata.aeroDamageBonus +
          echoModifiers.value.aeroDamageBonus / 100,
        genericDamageBonus: 0,
        damageTypeBonuses: {
          basic: echoModifiers.value.basicDamageBonus / 100,
          heavy: echoModifiers.value.heavyDamageBonus / 100,
          skill: echoModifiers.value.skillDamageBonus / 100,
          liberation: echoModifiers.value.liberationDamageBonus / 100,
        },
      },
      actions: plannedActions.value,
    },
    yangyangActions,
  ),
)

const integerFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const formatInteger = (value: number) => integerFormatter.format(value)
const formatDecimal = (value: number) => decimalFormatter.format(value)
const formatPercent = (value: number) => `${decimalFormatter.format(value * 100)}%`

function addAction() {
  if (!selectedActionId.value) return
  actionCounter.value += 1
  const lastTime = plannedActions.value[plannedActions.value.length - 1]?.startTimeMs ?? -400
  plannedActions.value.push({
    id: `action-${actionCounter.value}`,
    actionId: selectedActionId.value,
    startTimeMs: lastTime + 400,
  })
}

function removeAction(id: string) {
  plannedActions.value = plannedActions.value.filter((action) => action.id !== id)
}

function setEchoCost(index: number, value: string) {
  const slot = allEchoSlots.value[index]
  if (!slot) return
  slot.cost = Number(value) as EchoCost
  const valueForCurrentStat = getEchoMainStatValue(slot.cost, slot.mainStat.stat)
  if (valueForCurrentStat === undefined) {
    const [stat, fixedValue] = Object.entries(echoMainStatValues[slot.cost])[0] as [
      EchoStatKey,
      number,
    ]
    slot.mainStat = { stat, value: fixedValue }
  } else slot.mainStat.value = valueForCurrentStat
}

function setEchoStat(index: number, group: 'mainStat' | number, value: string) {
  const slot = allEchoSlots.value[index]
  if (!slot) return
  if (group === 'mainStat') {
    slot.mainStat.stat = value as EchoStatKey
    slot.mainStat.value = getEchoMainStatValue(slot.cost, slot.mainStat.stat) ?? 0
  } else if (slot.subStats[group]) slot.subStats[group].stat = value as EchoStatKey
}

function getEchoMainStatOptions(cost: EchoCost): EchoStatKey[] {
  return Object.keys(echoMainStatValues[cost]) as EchoStatKey[]
}
</script>

<template>
  <div class="calculator-page">
    <header class="calculator-heading">
      <div>
        <p class="template-kicker">{{ $t('calculator.kicker') }}</p>
        <h1>{{ $t('tools.damage.name') }}</h1>
        <p>{{ $t('calculator.intro') }}</p>
      </div>
      <div class="calculator-heading-meta">
        <span>DATA 3.5</span>
        <strong>{{ $t('calculator.slice') }}</strong>
      </div>
    </header>

    <div class="calculator-workspace">
      <section class="calculator-panel loadout-panel">
        <header class="panel-heading">
          <span>01</span>
          <div>
            <h2>{{ $t('calculator.loadout') }}</h2>
            <p>{{ $t('calculator.loadoutHint') }}</p>
          </div>
        </header>

        <div class="entity-stack">
          <article class="entity-row entity-row-primary">
            <img class="entity-icon" :src="yangyangIcon" alt="" />
            <div>
              <small>{{ $t('calculator.resonator') }}</small
              ><strong>{{ $t('calculator.yangyang') }}</strong>
            </div>
            <em>{{ $t('calculator.aero') }}</em>
          </article>
          <article class="entity-row">
            <img class="entity-icon" :src="weaponIcon" alt="" />
            <div>
              <small>{{ $t('calculator.weapon') }}</small
              ><strong>{{ $t('calculator.qianguFuliu') }}</strong>
            </div>
            <em>Lv.90</em>
          </article>
          <article class="entity-row">
            <img class="entity-icon" :src="echoIcon" alt="" />
            <div>
              <small>{{ $t('calculator.mainEcho') }}</small
              ><strong>{{ $t('calculator.feilianZhixing') }}</strong>
            </div>
            <em>COST 4</em>
          </article>
          <article class="entity-row">
            <img class="entity-icon" :src="sonataIcon" alt="" />
            <div>
              <small>{{ $t('calculator.sonata') }}</small
              ><strong>{{ $t('calculator.xiaoguChangfeng') }}</strong>
            </div>
            <em>+10%</em>
          </article>
        </div>

        <fieldset class="form-section">
          <legend>{{ $t('calculator.progression') }}</legend>
          <div class="form-grid">
            <label
              ><span>{{ $t('calculator.resonanceChain') }}</span
              ><select v-model.number="settings.resonanceChain">
                <option v-for="value in 7" :key="value - 1" :value="value - 1">
                  {{ value - 1 }}
                </option>
              </select></label
            >
            <label
              ><span>{{ $t('calculator.weaponRefinement') }}</span
              ><select v-model.number="settings.weaponRefinement">
                <option v-for="value in 5" :key="value" :value="value">{{ value }}</option>
              </select></label
            >
          </div>
          <p class="provisional-note"><span>✓</span>{{ $t('calculator.maxLevelNote') }}</p>
        </fieldset>

        <fieldset class="form-section echo-slots">
          <legend>{{ $t('calculator.echoConfiguration') }}</legend>
          <div v-for="(slot, index) in allEchoSlots" :key="slot.id" class="echo-slot-row">
            <b>0{{ index + 1 }}</b>
            <label
              ><span>COST</span
              ><select
                :value="slot.cost"
                @change="setEchoCost(index, ($event.target as HTMLSelectElement).value)"
              >
                <option v-if="index === 0" :value="4">4</option>
                <option v-if="index !== 0" :value="1">1</option>
                <option v-if="index !== 0" :value="3">3</option>
                <option v-if="index !== 0" :value="4">4</option>
              </select></label
            >
            <label
              ><span>{{ $t('calculator.mainStat') }}</span
              ><select
                :value="slot.mainStat.stat"
                @change="setEchoStat(index, 'mainStat', ($event.target as HTMLSelectElement).value)"
              >
                <option v-for="stat in getEchoMainStatOptions(slot.cost)" :key="stat" :value="stat">
                  {{ $t(`calculator.echoStats.${stat}`) }}
                </option>
              </select></label
            >
            <label class="echo-value-field"
              ><span>{{ $t('calculator.value') }}</span
              ><input :value="slot.mainStat.value" type="number" readonly
            /></label>
            <div
              v-for="(subStat, subIndex) in slot.subStats"
              :key="subIndex"
              class="echo-substat-pair"
            >
              <label
                ><span>{{ $t('calculator.subStatIndex', { index: subIndex + 1 }) }}</span
                ><select
                  :value="subStat.stat"
                  @change="setEchoStat(index, subIndex, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="stat in subStatOptions" :key="stat" :value="stat">
                    {{ $t(`calculator.echoStats.${stat}`) }}
                  </option>
                </select></label
              >
              <label class="echo-value-field"
                ><span>{{ $t('calculator.value') }}</span
                ><input v-model.number="subStat.value" type="number" step="0.1"
              /></label>
            </div>
          </div>
          <div class="cost-meter" :class="{ 'is-invalid': diagnostics.length }">
            <span>{{ $t('calculator.totalCost') }}</span
            ><strong>{{ totalEchoCost }} / 12</strong>
          </div>
          <p v-for="diagnostic in diagnostics" :key="diagnostic.code" class="form-warning">
            {{ $t(`calculator.diagnostics.${diagnostic.code}`, { actual: diagnostic.actual }) }}
          </p>
        </fieldset>
      </section>

      <section class="calculator-panel action-panel">
        <header class="panel-heading">
          <span>02</span>
          <div>
            <h2>{{ $t('calculator.actions') }}</h2>
            <p>{{ $t('calculator.actionsHint') }}</p>
          </div>
        </header>
        <div class="action-adder">
          <select v-model="selectedActionId" :aria-label="$t('calculator.actionSelect')">
            <option v-for="action in yangyangActions" :key="action.id" :value="action.id">
              {{ $t(`calculator.actionsMap.${action.id}`) }}
            </option>
          </select>
          <button type="button" @click="addAction">{{ $t('calculator.addAction') }}</button>
        </div>
        <ol class="action-list">
          <li v-for="(action, index) in plannedActions" :key="action.id">
            <span class="action-order">{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ $t(`calculator.actionsMap.${action.actionId}`) }}</strong
              ><small>{{ $t('calculator.hitTime') }} {{ action.startTimeMs }} ms</small>
            </div>
            <input
              v-model.number="action.startTimeMs"
              type="number"
              min="0"
              step="1"
              :aria-label="$t('calculator.hitTime')"
            />
            <button
              type="button"
              :aria-label="$t('calculator.removeAction')"
              @click="removeAction(action.id)"
            >
              ×
            </button>
          </li>
        </ol>
        <p class="provisional-note"><span>!</span>{{ $t('calculator.timingNote') }}</p>

        <fieldset class="form-section enemy-form">
          <legend>{{ $t('calculator.enemy') }}</legend>
          <div class="form-grid">
            <label
              ><span>{{ $t('calculator.enemyLevel') }}</span
              ><input v-model.number="settings.enemyLevel" type="number" min="1" max="200"
            /></label>
            <label
              ><span>{{ $t('calculator.aeroResistance') }} %</span
              ><input v-model.number="settings.aeroResistancePercent" type="number" step="0.1"
            /></label>
          </div>
          <label class="wide-field"
            ><span>{{ $t('calculator.criticalMode') }}</span
            ><select v-model="settings.criticalMode">
              <option value="expected">{{ $t('calculator.expected') }}</option>
              <option value="critical">{{ $t('calculator.critical') }}</option>
              <option value="normal">{{ $t('calculator.normal') }}</option>
            </select></label
          >
        </fieldset>
      </section>

      <section class="calculator-panel results-panel">
        <header class="panel-heading">
          <span>03</span>
          <div>
            <h2>{{ $t('calculator.results') }}</h2>
            <p>{{ $t('calculator.resultsHint') }}</p>
          </div>
        </header>
        <div class="result-summary">
          <div>
            <small>{{ $t('calculator.totalDamage') }}</small
            ><strong>{{ formatInteger(result.totalDamage) }}</strong>
          </div>
          <div>
            <small>DPS</small><strong>{{ formatInteger(result.dps) }}</strong>
          </div>
          <div>
            <small>{{ $t('calculator.hitCount') }}</small
            ><strong>{{ result.hits.length }}</strong>
          </div>
        </div>
        <div class="breakdown-list">
          <details v-for="hit in result.hits" :key="hit.id">
            <summary>
              <span
                ><small>{{ hit.timeMs }} ms</small
                ><b>{{ $t(`calculator.actionsMap.${hit.actionId}`) }}</b></span
              ><strong>{{ formatInteger(hit.breakdown.finalDamage) }}</strong>
            </summary>
            <dl>
              <div>
                <dt>{{ $t('calculator.scalingBase') }}</dt>
                <dd>{{ formatDecimal(hit.breakdown.scalingBase) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.skillMultiplier') }}</dt>
                <dd>{{ formatPercent(hit.breakdown.skillMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.damageBonusFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.damageBonusMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.multiplierBonusFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.multiplierBonusMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.damageDeepenFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.damageDeepenMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.independentFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.independentMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.criticalFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.criticalMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.defenseFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.defenseMultiplier) }}</dd>
              </div>
              <div>
                <dt>{{ $t('calculator.resistanceFactor') }}</dt>
                <dd>× {{ formatDecimal(hit.breakdown.resistanceMultiplier) }}</dd>
              </div>
            </dl>
          </details>
        </div>
        <p class="result-footnote">{{ $t('calculator.roundingNote') }}</p>
      </section>
    </div>
    <RouterLink to="/" class="template-back">← {{ $t('template.back') }}</RouterLink>
  </div>
</template>
