import type { ActionDefinition, ResonatorMechanicsDefinition } from '../../../../domain/combat'
import { weaponRefinementValues } from '../entities'

export const yangyangMechanics: ResonatorMechanicsDefinition = {
  resources: [{ id: 'liuxiang', initialValue: 0, minimumValue: 0, maximumValue: 3 }],
}

// Max-level skill multipliers. Offsets only preserve hit order; they are not measured frame data.
export const yangyangActions: ActionDefinition[] = [
  {
    id: 'changtai-gongji-1',
    name: '常态攻击·风羽为刃·第一段',
    damageType: 'basic',
    element: 'aero',
    hits: [{ id: 'hit-1', multiplier: 0.4473, offsetMs: 0 }],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'changtai-gongji-2',
    name: '常态攻击·风羽为刃·第二段',
    damageType: 'basic',
    element: 'aero',
    hits: [{ id: 'hit-1', multiplier: 0.5964, offsetMs: 0 }],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'changtai-gongji-3',
    name: '常态攻击·风羽为刃·第三段',
    damageType: 'basic',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.4681, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.4681, offsetMs: 1 },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'changtai-gongji-4',
    name: '常态攻击·风羽为刃·第四段',
    damageType: 'basic',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.5936, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.5936, offsetMs: 1 },
      { id: 'hit-3', multiplier: 0.7915, offsetMs: 2 },
    ],
    resourceChanges: [
      {
        id: 'liuxiang-changtai-gongji-4',
        resourceId: 'liuxiang',
        trigger: 'hit-after',
        hitId: 'hit-3',
        amount: 1,
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'zhongji',
    name: '常态攻击·风羽为刃·重击',
    damageType: 'heavy',
    element: 'aero',
    hits: [0, 1, 2].map((offsetMs) => ({
      id: `hit-${offsetMs + 1}`,
      multiplier: 0.1988,
      offsetMs,
    })),
    verificationStatus: 'cross-checked',
  },
  {
    id: 'kongzhong-gongji',
    name: '常态攻击·风羽为刃·空中攻击',
    damageType: 'basic',
    element: 'aero',
    hits: [{ id: 'hit-1', multiplier: 0.9244, offsetMs: 0 }],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'zhongji-fengyin',
    name: '常态攻击·风羽为刃·重击·风吟',
    damageType: 'heavy',
    element: 'aero',
    hits: [{ id: 'hit-1', multiplier: 1.0661, offsetMs: 0 }],
    resourceChanges: [
      {
        id: 'liuxiang-zhongji-fengyin',
        resourceId: 'liuxiang',
        trigger: 'hit-after',
        hitId: 'hit-1',
        amount: 1,
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'shanbi-fanji',
    name: '常态攻击·风羽为刃·闪避反击',
    damageType: 'basic',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.8707, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.8707, offsetMs: 1 },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'liufeng-zaiyu',
    name: '共鸣技能·流风载域',
    damageType: 'skill',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.3453, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.3453, offsetMs: 1 },
      { id: 'hit-3', multiplier: 0.3453, offsetMs: 2 },
      { id: 'hit-4', multiplier: 0.3453, offsetMs: 3 },
      { id: 'hit-5', multiplier: 2.0719, offsetMs: 4 },
    ],
    cooldownMs: 10_000,
    resourceChanges: [
      {
        id: 'liuxiang-liufeng-zaiyu',
        resourceId: 'liuxiang',
        trigger: 'hit-after',
        hitId: 'hit-1',
        amount: 1,
      },
    ],
    passiveModifiers: [
      { condition: { minResonanceChain: 3 }, modifiers: { damageTypeBonuses: { skill: 0.4 } } },
    ],
    effects: [
      {
        id: 'qiangu-fuliu-liuwo-wuyin',
        target: 'self',
        trigger: 'action-start',
        durationMs: 10_000,
        maxStacks: 2,
        modifiers: {
          attackPercentByWeaponRefinement: weaponRefinementValues.skillAttackBonusPerStack,
        },
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'zhongji-fengxi',
    name: '共鸣回路·覆声裁羽·重击·风袭',
    damageType: 'heavy',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.3802, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.3802, offsetMs: 1 },
    ],
    resourceRequirements: [{ resourceId: 'liuxiang', minimumValue: 3 }],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'kongzhong-gongji-shiyu',
    name: '共鸣回路·覆声裁羽·空中攻击·释羽',
    damageType: 'basic',
    element: 'aero',
    hits: [
      ...Array.from({ length: 5 }, (_, index) => ({
        id: `feather-${index + 1}`,
        multiplier: 0.2173,
        offsetMs: index,
      })),
      { id: 'final-1', multiplier: 1.2681, offsetMs: 5 },
      { id: 'final-2', multiplier: 1.2681, offsetMs: 6 },
    ],
    resourceRequirements: [{ resourceId: 'liuxiang', minimumValue: 3 }],
    resourceChanges: [
      {
        id: 'liuxiang-kongzhong-gongji-shiyu',
        resourceId: 'liuxiang',
        trigger: 'action-start',
        amount: -3,
      },
    ],
    passiveModifiers: [
      { condition: { minResonanceChain: 4 }, modifiers: { damageTypeBonuses: { basic: 0.95 } } },
    ],
    effects: [
      {
        id: 'yangyang-gongminglian-6',
        target: 'team',
        trigger: 'action-start',
        durationMs: 20_000,
        condition: { minResonanceChain: 6 },
        modifiers: { attackPercent: 0.2 },
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'shuofeng-xuanyong',
    name: '共鸣解放·朔风旋涌',
    damageType: 'liberation',
    element: 'aero',
    hits: [
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `wind-${index + 1}`,
        multiplier: 0.4658,
        offsetMs: index,
      })),
      { id: 'final', multiplier: 3.727, offsetMs: 12 },
    ],
    cooldownMs: 16_000,
    passiveModifiers: [
      {
        condition: { minResonanceChain: 5 },
        modifiers: { damageTypeBonuses: { liberation: 0.85 } },
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'zhanlan-lizan',
    name: '变奏技能·湛蓝礼赞',
    activation: 'intro',
    damageType: 'skill',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.7952, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.7952, offsetMs: 1 },
    ],
    resourceChanges: [
      {
        id: 'liuxiang-zhanlan-lizan',
        resourceId: 'liuxiang',
        trigger: 'action-start',
        amount: 1,
      },
    ],
    effects: [
      {
        id: 'xiaogu-changfeng-wujian',
        target: 'self',
        trigger: 'hit-after',
        hitId: 'hit-2',
        durationMs: 15_000,
        modifiers: { aeroDamageBonus: 0.3 },
      },
      {
        id: 'yangyang-huimin',
        target: 'self',
        trigger: 'hit-after',
        hitId: 'hit-2',
        durationMs: 8_000,
        modifiers: { aeroDamageBonus: 0.08 },
      },
      {
        id: 'yangyang-gongminglian-1',
        target: 'self',
        trigger: 'hit-after',
        hitId: 'hit-2',
        durationMs: 8_000,
        condition: { minResonanceChain: 1 },
        modifiers: { aeroDamageBonus: 0.15 },
      },
    ],
    verificationStatus: 'cross-checked',
  },
  {
    id: 'yanxi',
    name: '延奏技能·衍息',
    activation: 'outro',
    damageType: 'skill',
    element: 'aero',
    hits: [],
    verificationStatus: 'provisional',
  },
  {
    id: 'xiedu-pohuai-xundao',
    name: '谐度破坏·迅刀',
    damageType: 'basic',
    element: 'aero',
    hits: [],
    verificationStatus: 'provisional',
  },
  {
    id: 'shenghai-jineng-feilian-zhixing',
    name: '声骸技能·飞廉之猩',
    damageType: 'echo',
    element: 'aero',
    hits: [
      { id: 'tiji', multiplier: 2.3184, offsetMs: 0 },
      { id: 'zhuiji', multiplier: 2.8336, offsetMs: 1 },
    ],
    effects: [
      {
        id: 'feilian-zhixing-zhuiji-zengyi',
        target: 'self',
        trigger: 'hit-after',
        hitId: 'zhuiji',
        durationMs: 15_000,
        modifiers: { aeroDamageBonus: 0.12, damageTypeBonuses: { heavy: 0.12 } },
      },
    ],
    verificationStatus: 'cross-checked',
  },
]
