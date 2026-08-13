import { describe, expect, it } from 'vitest'
import { yangyangActions, yangyangMechanics } from '../src/data/versions/v3_5/phaseOne'
import type { ActionDefinition, SimulationInput } from '../src/domain/combat'
import { simulateDamage } from '../src/simulator/simulate'

const baseInput: Omit<SimulationInput, 'actions'> = {
  resonatorLevel: 90,
  resonanceChain: 0,
  weaponRefinement: 1,
  criticalMode: 'normal',
  enemy: { level: 90, resistances: { aero: 0 } },
  stats: {
    attack: 1_000,
    criticalRate: 0,
    criticalDamageMultiplier: 1.5,
    aeroDamageBonus: 0,
    genericDamageBonus: 0,
    damageTypeBonuses: {},
  },
}

describe('declarative resonator mechanics', () => {
  it('exposes Yangyang official outro and tune-break actions without inventing tune-break damage', () => {
    expect(yangyangActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'yanxi',
          name: '延奏技能·衍息',
          activation: 'outro',
        }),
        expect.objectContaining({
          id: 'xiedu-pohuai-xundao',
          name: '谐度破坏·迅刀',
        }),
      ]),
    )

    const result = simulateDamage(
      {
        ...baseInput,
        switches: [{ id: 'switch', fromSlotId: 'slot-1', toSlotId: 'slot-2', timeMs: 0 }],
        actions: [
          { id: 'outro', resonatorSlotId: 'slot-1', actionId: 'yanxi', startTimeMs: 0 },
          {
            id: 'tune-break',
            resonatorSlotId: 'slot-2',
            actionId: 'xiedu-pohuai-xundao',
            startTimeMs: 500,
          },
        ],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.timeline.diagnostics).toEqual([])
    expect(result.hits).toEqual([])
    expect(result.totalDamage).toBe(0)
  })

  it('gains, caps, requires, and consumes Yangyang Melody', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        initialActiveSlotId: 'slot-2',
        switches: [{ id: 'switch-in', fromSlotId: 'slot-2', toSlotId: 'slot-1', timeMs: 0 }],
        actions: [
          { id: 'intro', actionId: 'zhanlan-lizan', startTimeMs: 0 },
          { id: 'skill', actionId: 'liufeng-zaiyu', startTimeMs: 500 },
          { id: 'wind', actionId: 'zhongji-fengyin', startTimeMs: 1_000 },
          { id: 'windstrike', actionId: 'zhongji-fengxi', startTimeMs: 1_500 },
          { id: 'release', actionId: 'kongzhong-gongji-shiyu', startTimeMs: 2_000 },
        ],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.resourceCurve.map((point) => point.value)).toEqual([0, 1, 2, 3, 0])
    expect(result.timeline.diagnostics).toEqual([])
  })

  it('uses a configured initial resource value', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        initialResources: { liuxiang: 3 },
        actions: [{ id: 'release', actionId: 'kongzhong-gongji-shiyu', startTimeMs: 0 }],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.timeline.diagnostics).toEqual([])
    expect(result.resourceCurve.map((point) => point.value)).toEqual([3, 0])
  })

  it('keeps invalid actions as damage while reporting a soft resource diagnostic', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [{ id: 'release', actionId: 'kongzhong-gongji-shiyu', startTimeMs: 0 }],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.totalDamage).toBeGreaterThan(0)
    expect(result.timeline.diagnostics).toContainEqual({
      code: 'insufficient-resource',
      timeMs: 0,
      actionInstanceIds: ['release'],
      resourceId: 'liuxiang',
      requiredValue: 3,
      actualValue: 0,
    })
  })

  it('does not grant a hit-triggered resource when that hit is trimmed away', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          {
            id: 'basic-four',
            actionId: 'changtai-gongji-4',
            startTimeMs: 0,
            trimmedEndTimeMs: 75,
          },
        ],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.hits).toHaveLength(2)
    expect(result.resourceCurve.map((point) => point.value)).toEqual([0])
  })

  it('reports cooldown conflicts without suppressing the repeated action', () => {
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'first', actionId: 'liufeng-zaiyu', startTimeMs: 0 },
          { id: 'second', actionId: 'liufeng-zaiyu', startTimeMs: 1_000 },
        ],
      },
      yangyangActions,
      yangyangMechanics,
    )

    expect(result.hits).toHaveLength(10)
    expect(result.timeline.diagnostics).toContainEqual({
      code: 'cooldown-active',
      timeMs: 1_000,
      actionInstanceIds: ['second'],
      availableAtMs: 10_000,
    })
  })

  it('lets Yangyang Sequence 6 buff Feather Release from action start', () => {
    const calculate = (resonanceChain: 5 | 6) =>
      simulateDamage(
        {
          ...baseInput,
          resonanceChain,
          actions: [{ id: 'release', actionId: 'kongzhong-gongji-shiyu', startTimeMs: 0 }],
        },
        yangyangActions,
        yangyangMechanics,
      )

    expect(calculate(5).hits[0]?.breakdown.scalingBase).toBe(1_000)
    expect(calculate(6).hits[0]?.breakdown.scalingBase).toBe(1_200)
  })

  it('calculates one theoretical healing value and preserves its team target', () => {
    const healer: ActionDefinition = {
      id: 'heal',
      name: '测试回复',
      damageType: 'skill',
      element: 'aero',
      hits: [],
      healing: [
        {
          id: 'team-heal',
          trigger: 'action-start',
          target: 'team',
          scalingStat: 'attack',
          multiplier: 0.5,
          flatValue: 100,
        },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        stats: {
          ...baseInput.stats,
          healingBonus: 0.2,
          healingReceivedBonus: 0.1,
        },
        actions: [{ id: 'heal', actionId: 'heal', startTimeMs: 1_000 }],
      },
      [healer],
    )

    expect(result.healing).toHaveLength(1)
    expect(result.healing[0]?.target).toBe('team')
    expect(result.healing[0]?.finalHealing).toBeCloseTo(792, 12)
    expect(result.totalHealing).toBeCloseTo(792, 12)
    expect(result.hps).toBeCloseTo(792, 12)
  })

  it('projects status intervals and generated periodic damage as read-only events', () => {
    const source: ActionDefinition = {
      id: 'source',
      name: '测试召唤',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      statusChanges: [
        {
          id: 'apply-mode',
          statusId: 'test-mode',
          trigger: 'action-start',
          operation: 'apply',
          durationMs: 5_000,
        },
      ],
      derivedEvents: [
        {
          id: 'summoned-hit',
          kind: 'periodic-effect',
          trigger: 'action-start',
          delayMs: 500,
          intervalMs: 1_000,
          occurrences: 2,
          hits: [{ id: 'hit', multiplier: 0.5 }],
        },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      { ...baseInput, actions: [{ id: 'source', actionId: 'source', startTimeMs: 0 }] },
      [source],
    )

    expect(result.hits.map((hit) => hit.timeMs)).toEqual([0, 500, 1_500])
    expect(result.mechanicEvents.map((event) => event.kind)).toEqual([
      'periodic-effect',
      'periodic-effect',
    ])
    expect(result.statusIntervals).toContainEqual({
      id: 'source:apply-mode',
      statusId: 'test-mode',
      resonatorSlotId: 'slot-1',
      sourceActionId: 'source',
      startTimeMs: 0,
      endTimeMs: 5_000,
    })
  })

  it('uses the declared HP or DEF scaling stat for each damage hit', () => {
    const action: ActionDefinition = {
      id: 'alternate-scaling',
      name: '替代缩放',
      damageType: 'skill',
      element: 'aero',
      hits: [
        { id: 'hp', multiplier: 0.1, offsetMs: 0, scalingStat: 'health' },
        { id: 'def', multiplier: 0.5, offsetMs: 1, scalingStat: 'defense' },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        stats: { ...baseInput.stats, health: 20_000, defense: 2_000 },
        actions: [{ id: 'alternate', actionId: action.id, startTimeMs: 0 }],
      },
      [action],
    )

    expect(result.hits.map((hit) => hit.breakdown.scalingBase)).toEqual([20_000, 2_000])
    expect(result.hits[0]!.breakdown.rawDamage).toBe(2_000)
    expect(result.hits[1]!.breakdown.rawDamage).toBe(1_000)
  })

  it('creates a shield, tracks its target, and enables shield-gained effects', () => {
    const action: ActionDefinition = {
      id: 'shield-action',
      name: '护盾测试',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      shields: [
        {
          id: 'test-shield',
          trigger: 'action-start',
          target: 'self',
          scalingStat: 'defense',
          multiplier: 0.5,
          flatValue: 100,
          durationMs: 5_000,
        },
      ],
      effects: [
        {
          id: 'shield-attack',
          trigger: 'shield-gained',
          target: 'self',
          durationMs: 5_000,
          modifiers: { attackPercent: 0.2 },
        },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        stats: { ...baseInput.stats, defense: 1_000 },
        actions: [{ id: 'shield', actionId: action.id, startTimeMs: 0 }],
      },
      [action],
    )

    expect(result.totalShield).toBe(600)
    expect(result.shields[0]).toMatchObject({ target: 'self', targetSlotId: 'slot-1' })
    expect(result.hits[0]?.breakdown.scalingBase).toBe(1_200)
  })

  it('evaluates team and equipped-item conditions for the source slot', () => {
    const action: ActionDefinition = {
      id: 'loadout-condition',
      name: '配装条件',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      passiveModifiers: [
        {
          condition: {
            resonatorIds: ['yangyang'],
            weaponIds: ['qiangu-fuliu'],
            mainEchoIds: ['feilian-zhixing'],
            sonataIds: ['xiaogu-changfeng'],
            teamIncludesResonatorIds: ['yangyang', 'baizhi'],
            minimumTeamSize: 2,
          },
          modifiers: { attackPercent: 0.2 },
        },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        team: [
          {
            slotId: 'slot-1',
            resonatorId: 'yangyang',
            weaponId: 'qiangu-fuliu',
            mainEchoId: 'feilian-zhixing',
            sonataIds: ['xiaogu-changfeng'],
          },
          { slotId: 'slot-2', resonatorId: 'baizhi' },
        ],
        actions: [{ id: 'condition', actionId: action.id, startTimeMs: 0 }],
      },
      [action],
    )

    expect(result.hits[0]?.breakdown.scalingBase).toBe(1_200)
  })

  it('processes switches before matching outro and intro actions at the same timestamp', () => {
    const outro: ActionDefinition = {
      id: 'outro',
      name: '延奏测试',
      activation: 'outro',
      damageType: 'skill',
      element: 'aero',
      hits: [],
      effects: [
        {
          id: 'outro-buff',
          trigger: 'action-start',
          target: 'active',
          durationMs: 5_000,
          modifiers: { attackPercent: 0.2 },
        },
      ],
      verificationStatus: 'provisional',
    }
    const intro: ActionDefinition = {
      id: 'intro',
      name: '变奏测试',
      activation: 'intro',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        switches: [{ id: 'switch', fromSlotId: 'slot-1', toSlotId: 'slot-2', timeMs: 1_000 }],
        actions: [
          { id: 'outro', resonatorSlotId: 'slot-1', actionId: 'outro', startTimeMs: 1_000 },
          { id: 'intro', resonatorSlotId: 'slot-2', actionId: 'intro', startTimeMs: 1_000 },
        ],
      },
      [outro, intro],
    )

    expect(result.timeline.diagnostics).toEqual([])
    expect(result.mechanicEvents).toContainEqual(
      expect.objectContaining({ kind: 'switch', targetSlotId: 'slot-2', generated: false }),
    )
    expect(result.hits[0]?.breakdown.scalingBase).toBe(1_200)
  })

  it('tracks multiple charges and applies a declared cooldown reduction', () => {
    const charged: ActionDefinition = {
      id: 'charged',
      name: '充能技能',
      damageType: 'skill',
      element: 'aero',
      hits: [{ id: 'hit', multiplier: 1, offsetMs: 0 }],
      cooldownMs: 10_000,
      maxCharges: 2,
      chargeRecoveryMode: 'sequential',
      verificationStatus: 'provisional',
    }
    const reducer: ActionDefinition = {
      id: 'reducer',
      name: '冷却缩减',
      damageType: 'basic',
      element: 'aero',
      hits: [],
      cooldownChanges: [
        {
          id: 'reduce-charged',
          trigger: 'action-start',
          targetActionIds: ['charged'],
          operation: 'reduce',
          amountMs: 8_000,
        },
      ],
      verificationStatus: 'provisional',
    }
    const result = simulateDamage(
      {
        ...baseInput,
        actions: [
          { id: 'charge-1', actionId: 'charged', startTimeMs: 0 },
          { id: 'charge-2', actionId: 'charged', startTimeMs: 1_000 },
          { id: 'charge-invalid', actionId: 'charged', startTimeMs: 2_000 },
          { id: 'reduce', actionId: 'reducer', startTimeMs: 3_000 },
          { id: 'charge-restored', actionId: 'charged', startTimeMs: 4_000 },
        ],
      },
      [charged, reducer],
    )

    expect(result.timeline.diagnostics.filter((item) => item.code === 'no-action-charge')).toEqual([
      expect.objectContaining({ actionInstanceIds: ['charge-invalid'], availableAtMs: 10_000 }),
    ])
    expect(result.mechanicEvents).toContainEqual(
      expect.objectContaining({ kind: 'cooldown', value: -8_000 }),
    )
  })
})
