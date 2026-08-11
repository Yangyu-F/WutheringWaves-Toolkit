import { describe, expect, it } from 'vitest'
import { yangyangActions } from '../src/data/versions/v3_5/phaseOne'
import type { SimulationInput } from '../src/domain/combat'
import { simulateDamage } from '../src/simulator/simulate'
import type { ActionDefinition } from '../src/domain/combat'

const baseInput: Omit<SimulationInput, 'actions'> = {
  resonatorLevel: 90,
  resonanceChain: 0,
  weaponRefinement: 1,
  criticalMode: 'normal',
  enemy: { level: 90, resistances: { aero: 0 } },
  stats: {
    attack: 1000,
    criticalRate: 0,
    criticalDamageMultiplier: 1.5,
    aeroDamageBonus: 0,
    genericDamageBonus: 0,
    damageTypeBonuses: {},
  },
}

describe('declarative Phase 1 effects', () => {
  it('uses one pre-hit snapshot for every hit at the same timestamp', () => {
    const trigger: ActionDefinition = {
      id: 'trigger',
      name: '触发命中',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      effects: [
        {
          id: 'after-hit-buff',
          trigger: 'hit-after',
          hitId: 'hit',
          durationMs: 1_000,
          modifiers: { aeroDamageBonus: 1 },
        },
      ],
      verificationStatus: 'provisional',
    }
    const plain: ActionDefinition = { ...trigger, id: 'plain', name: '同时命中', effects: [] }
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'trigger', actionId: 'trigger', startTimeMs: 0 },
          { id: 'plain', actionId: 'plain', startTimeMs: 0 },
        ],
      },
      [trigger, plain],
    )
    expect(result.hits.map((hit) => hit.breakdown.damageBonusMultiplier)).toEqual([1, 1])
  })

  it('routes self, team, and enemy effects to the five-track model', () => {
    const targeted = (target: 'self' | 'team' | 'enemy'): ActionDefinition => ({
      id: `target-${target}`,
      name: `目标 ${target}`,
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      effects: [
        {
          id: `buff-${target}`,
          target,
          trigger: 'action-start',
          durationMs: 1_000,
          modifiers: { aeroDamageBonus: 0.1 },
        },
      ],
      verificationStatus: 'provisional',
    })
    const definitions = [targeted('self'), targeted('team'), targeted('enemy')]
    const result = simulateDamage(
      {
        ...baseInput,
        actions: definitions.map((definition, index) => ({
          id: `action-${index}`,
          actionId: definition.id,
          resonatorSlotId: 'slot-2',
          startTimeMs: index * 1_000,
        })),
      },
      definitions,
    )
    expect(result.buffIntervals.map((buff) => buff.targetTrack)).toEqual([
      'slot-2',
      'team',
      'enemy',
    ])
  })

  it('does not apply a self buff to another resonator slot', () => {
    const trigger: ActionDefinition = {
      id: 'self-trigger',
      name: '自身增益',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      effects: [
        {
          id: 'self-only',
          target: 'self',
          trigger: 'action-start',
          durationMs: 2_000,
          modifiers: { aeroDamageBonus: 1 },
        },
      ],
      verificationStatus: 'provisional',
    }
    const plain: ActionDefinition = { ...trigger, id: 'plain-other', effects: [] }
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'self', actionId: trigger.id, resonatorSlotId: 'slot-1', startTimeMs: 0 },
          { id: 'other', actionId: plain.id, resonatorSlotId: 'slot-2', startTimeMs: 500 },
        ],
      },
      [trigger, plain],
    )
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'other')?.breakdown.damageBonusMultiplier,
    ).toBe(1)
  })

  it('stacks the weapon effect twice, includes the exact expiry timestamp, then expires', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'skill-1', actionId: 'liufeng-zaiyu', startTimeMs: 0 },
          { id: 'skill-2', actionId: 'liufeng-zaiyu', startTimeMs: 100 },
          { id: 'inside', actionId: 'changtai-gongji-1', startTimeMs: 10_000 },
          { id: 'outside', actionId: 'changtai-gongji-1', startTimeMs: 10_101 },
        ],
      },
      yangyangActions,
    )
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'skill-1')?.breakdown.scalingBase,
    ).toBe(1060)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'skill-2')?.breakdown.scalingBase,
    ).toBe(1120)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'inside')?.breakdown.scalingBase,
    ).toBe(1120)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'outside')?.breakdown.scalingBase,
    ).toBe(1000)
  })

  it('applies Feilian Beringal only after its follow-up hit', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'echo', actionId: 'shenghai-jineng-feilian-zhixing', startTimeMs: 0 },
          { id: 'inside', actionId: 'zhongji', startTimeMs: 601 },
          { id: 'outside', actionId: 'zhongji', startTimeMs: 15_601 },
        ],
      },
      yangyangActions,
    )
    const echoHits = result.hits.filter((hit) => hit.actionInstanceId === 'echo')
    expect(echoHits.every((hit) => hit.breakdown.damageBonusMultiplier === 1)).toBe(true)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'inside')?.breakdown.damageBonusMultiplier,
    ).toBeCloseTo(1.24, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'outside')?.breakdown
        .damageBonusMultiplier,
    ).toBe(1)
  })

  it('applies intro buffs after the final intro hit with independent durations', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        resonanceChain: 1,
        actions: [
          { id: 'bianzou', actionId: 'zhanlan-lizan', startTimeMs: 0 },
          { id: 'all', actionId: 'changtai-gongji-1', startTimeMs: 601 },
          { id: 'sonata-only', actionId: 'changtai-gongji-1', startTimeMs: 8_601 },
          { id: 'expired', actionId: 'changtai-gongji-1', startTimeMs: 15_601 },
        ],
      },
      yangyangActions,
    )
    expect(
      result.hits
        .filter((hit) => hit.actionInstanceId === 'bianzou')
        .every((hit) => hit.breakdown.damageBonusMultiplier === 1),
    ).toBe(true)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'all')?.breakdown.damageBonusMultiplier,
    ).toBeCloseTo(1.53, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'sonata-only')?.breakdown
        .damageBonusMultiplier,
    ).toBeCloseTo(1.3, 12)
    expect(
      result.hits.find((hit) => hit.actionInstanceId === 'expired')?.breakdown
        .damageBonusMultiplier,
    ).toBe(1)
  })
})
