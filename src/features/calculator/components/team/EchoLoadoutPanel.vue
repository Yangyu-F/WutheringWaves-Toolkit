<script setup lang="ts">
import { computed } from 'vue'
import {
  echoMainStatValues,
  echoSubStatValues,
  getEchoMainStatValue,
  validatePhaseOneLoadout,
} from '../../../../domain/loadout'
import type { EchoCost, EchoStatKey, EchoStatSlot } from '../../../../domain/loadout'
import { useCalculatorProjectStore } from '../../stores/project'

const project = useCalculatorProjectStore()
const echoes = computed(() => [project.loadout.mainEcho, ...project.loadout.secondaryEchoes])
const totalCost = computed(() => echoes.value.reduce((sum, echo) => sum + echo.cost, 0))
const diagnostics = computed(() => validatePhaseOneLoadout(project.loadout))
const statNames: Record<EchoStatKey, string> = {
  hpFlat: '生命',
  hpPercent: '生命%',
  attackFlat: '攻击',
  attackPercent: '攻击%',
  defenseFlat: '防御',
  defensePercent: '防御%',
  criticalRate: '暴击',
  criticalDamage: '暴伤',
  energyRegen: '共鸣效率',
  healingBonus: '治疗加成',
  aeroDamageBonus: '气动伤害',
  basicDamageBonus: '普攻伤害',
  heavyDamageBonus: '重击伤害',
  skillDamageBonus: '技能伤害',
  liberationDamageBonus: '解放伤害',
}
const subStatKeys = Object.keys(echoSubStatValues) as EchoStatKey[]
const mainStatKeys = (cost: EchoCost) => Object.keys(echoMainStatValues[cost]) as EchoStatKey[]
function changeCost(slot: EchoStatSlot, cost: EchoCost) {
  slot.cost = cost
  const stat = mainStatKeys(cost)[0]!
  slot.mainStat = { stat, value: getEchoMainStatValue(cost, stat)! }
}
function changeMainStat(slot: EchoStatSlot, stat: EchoStatKey) {
  slot.mainStat = { stat, value: getEchoMainStatValue(slot.cost, stat)! }
}
function addSubStat(slot: EchoStatSlot) {
  if (slot.subStats.length >= 5) return
  const stat = subStatKeys.find((key) => !slot.subStats.some((item) => item.stat === key))
  if (stat) slot.subStats.push({ stat, value: echoSubStatValues[stat]![0]! })
}
function changeSubStat(slot: EchoStatSlot, index: number, stat: EchoStatKey) {
  slot.subStats[index] = { stat, value: echoSubStatValues[stat]![0]! }
}
</script>

<template>
  <section class="side-section echo-loadout">
    <header>
      <h2>声骸配置</h2>
      <span :class="{ invalid: diagnostics.length }">COST {{ totalCost }}/12</span>
    </header>
    <details v-for="(slot, index) in echoes" :key="slot.id" :open="index === 0">
      <summary>
        <b>0{{ index + 1 }}</b
        ><span>{{ index === 0 ? '飞廉之猩 · 首位' : `声骸位 ${index + 1}` }}</span
        ><i>C{{ slot.cost }}</i>
      </summary>
      <div class="echo-fields">
        <label
          >Cost<select
            :value="slot.cost"
            :disabled="index === 0"
            @change="
              changeCost(slot, Number(($event.target as HTMLSelectElement).value) as EchoCost)
            "
          >
            <option v-for="cost in [1, 3, 4]" :key="cost" :value="cost">{{ cost }}</option>
          </select></label
        >
        <label
          >主词条<select
            :value="slot.mainStat.stat"
            @change="
              changeMainStat(slot, ($event.target as HTMLSelectElement).value as EchoStatKey)
            "
          >
            <option v-for="stat in mainStatKeys(slot.cost)" :key="stat" :value="stat">
              {{ statNames[stat] }}
            </option>
          </select></label
        >
        <output>{{ slot.mainStat.value }}%</output>
      </div>
      <div v-for="(subStat, subIndex) in slot.subStats" :key="subIndex" class="substat-row">
        <select
          :value="subStat.stat"
          @change="
            changeSubStat(slot, subIndex, ($event.target as HTMLSelectElement).value as EchoStatKey)
          "
        >
          <option
            v-for="stat in subStatKeys"
            :key="stat"
            :value="stat"
            :disabled="
              slot.subStats.some((item, itemIndex) => itemIndex !== subIndex && item.stat === stat)
            "
          >
            {{ statNames[stat] }}
          </option>
        </select>
        <select v-model.number="subStat.value">
          <option v-for="value in echoSubStatValues[subStat.stat]" :key="value" :value="value">
            {{ value }}
          </option>
        </select>
        <button type="button" title="删除词条" @click="slot.subStats.splice(subIndex, 1)">×</button>
      </div>
      <button
        class="add-substat"
        type="button"
        :disabled="slot.subStats.length >= 5"
        @click="addSubStat(slot)"
      >
        ＋ 添加副词条
      </button>
    </details>
    <p v-if="diagnostics.length" class="loadout-warning">当前声骸 Cost 或词条组合不合法</p>
  </section>
</template>
