import type { ActionDefinition } from '../../../domain/combat'
import type { PhaseOneLoadout } from '../../../domain/loadout'

export const phaseOneSources = {
  officialWiki: 'https://wiki.kurobbs.com/mc/home',
  resonatorCatalogue: 'https://wiki.kurobbs.com/mc/catalogue/list?fid=1099&sid=1105',
  weaponCatalogue: 'https://wiki.kurobbs.com/mc/catalogue/list?fid=1099&sid=1106',
  echoCatalogue: 'https://wiki.kurobbs.com/mc/catalogue/list?fid=1099&sid=1107',
  sonataCatalogue: 'https://wiki.kurobbs.com/mc/catalogue/list?fid=1099&sid=1219',
  officialYangyang: 'https://wiki.kurobbs.com/mc/item/1233436648562032640',
  officialWeapon: 'https://wiki.kurobbs.com/mc/item/1235741466408321024',
  officialEcho: 'https://wiki.kurobbs.com/mc/item/1226644899569418240',
  officialSonata: 'https://wiki.kurobbs.com/mc/item/1233504762221887488',
  biliYangyang: 'https://wiki.biligame.com/wutheringwaves/共鸣者/秧秧',
  biliWeapon: 'https://wiki.biligame.com/wutheringwaves/武器/千古洑流',
  biliEcho: 'https://wiki.biligame.com/wutheringwaves/声骸/飞廉之猩',
  biliSonata: 'https://wiki.biligame.com/wutheringwaves/声骸合鸣/啸谷长风',
  wikiwikiYangyang: 'https://wikiwiki.jp/w-w/秧秧',
  wikiwikiWeapon: 'https://wikiwiki.jp/w-w/千古の湖水',
  wikiwikiEcho: 'https://wikiwiki.jp/w-w/飛廉の大猿',
  wikiwikiSonata: 'https://wikiwiki.jp/w-w/谷を突き抜ける長風',
} as const

const reviewedAt = '2026-08-10'

export const phaseOneEntities = {
  resonator: {
    id: 'yangyang',
    gameVersion: '3.5',
    name: '秧秧',
    element: '气动',
    weaponType: '迅刀',
    level: 90,
    attack: 250,
    criticalRate: 0.05,
    criticalDamageMultiplier: 1.5,
    inherentAttackBonus: 0.12,
    inherentAeroDamageBonus: 0.12,
    sourceRefs: [
      phaseOneSources.resonatorCatalogue,
      phaseOneSources.officialYangyang,
      phaseOneSources.biliYangyang,
      phaseOneSources.wikiwikiYangyang,
    ],
    reviewedAt,
    verificationStatus: 'cross-checked',
  },
  weapon: {
    id: 'qiangu-fuliu',
    gameVersion: '3.5',
    effectName: '流涡无垠',
    name: '千古洑流',
    level: 90,
    attack: 587,
    criticalRate: 0.243,
    energyRegenBonus: 0.128,
    skillCastAttackBonusPerStack: 0.06,
    maxStacks: 2,
    durationMs: 10_000,
    sourceRefs: [
      phaseOneSources.weaponCatalogue,
      phaseOneSources.officialWeapon,
      phaseOneSources.biliWeapon,
      phaseOneSources.wikiwikiWeapon,
    ],
    reviewedAt,
    verificationStatus: 'cross-checked',
  },
  mainEcho: {
    id: 'feilian-zhixing',
    gameVersion: '3.5',
    name: '飞廉之猩',
    cost: 4,
    cooldownMs: 20_000,
    postHitAeroDamageBonus: 0.12,
    postHitHeavyDamageBonus: 0.12,
    buffDurationMs: 15_000,
    sourceRefs: [
      phaseOneSources.echoCatalogue,
      phaseOneSources.officialEcho,
      phaseOneSources.biliEcho,
      phaseOneSources.wikiwikiEcho,
    ],
    reviewedAt,
    verificationStatus: 'cross-checked',
  },
  sonata: {
    id: 'xiaogu-changfeng',
    gameVersion: '3.5',
    name: '啸谷长风',
    twoPieceEffectName: '2件套',
    fivePieceEffectName: '5件套',
    aeroDamageBonus: 0.1,
    introAeroDamageBonus: 0.3,
    introBuffDurationMs: 15_000,
    sourceRefs: [
      phaseOneSources.sonataCatalogue,
      phaseOneSources.officialSonata,
      phaseOneSources.biliSonata,
      phaseOneSources.wikiwikiSonata,
    ],
    reviewedAt,
    verificationStatus: 'cross-checked',
  },
} as const

export const weaponRefinementValues = {
  energyRegenBonus: [0.128, 0.16, 0.192, 0.224, 0.256],
  skillAttackBonusPerStack: [0.06, 0.075, 0.09, 0.105, 0.12],
} as const

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
    passiveModifiers: [
      { condition: { minResonanceChain: 3 }, modifiers: { damageTypeBonuses: { skill: 0.4 } } },
    ],
    effects: [
      {
        id: 'qiangu-fuliu-liuwo-wuyin',
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
    passiveModifiers: [
      { condition: { minResonanceChain: 4 }, modifiers: { damageTypeBonuses: { basic: 0.95 } } },
    ],
    effects: [
      {
        id: 'yangyang-gongminglian-6',
        trigger: 'hit-after',
        hitId: 'final-2',
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
    damageType: 'skill',
    element: 'aero',
    hits: [
      { id: 'hit-1', multiplier: 0.7952, offsetMs: 0 },
      { id: 'hit-2', multiplier: 0.7952, offsetMs: 1 },
    ],
    effects: [
      {
        id: 'xiaogu-changfeng-wujian',
        trigger: 'hit-after',
        hitId: 'hit-2',
        durationMs: 15_000,
        modifiers: { aeroDamageBonus: 0.3 },
      },
      {
        id: 'yangyang-huimin',
        trigger: 'hit-after',
        hitId: 'hit-2',
        durationMs: 8_000,
        modifiers: { aeroDamageBonus: 0.08 },
      },
      {
        id: 'yangyang-gongminglian-1',
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
        trigger: 'hit-after',
        hitId: 'zhuiji',
        durationMs: 15_000,
        modifiers: { aeroDamageBonus: 0.12, damageTypeBonuses: { heavy: 0.12 } },
      },
    ],
    verificationStatus: 'cross-checked',
  },
]

export const defaultPhaseOneLoadout: PhaseOneLoadout = {
  gameVersion: '3.5',
  resonatorId: 'yangyang',
  weaponId: 'qiangu-fuliu',
  mainEchoId: 'feilian-zhixing',
  sonataId: 'xiaogu-changfeng',
  mainEcho: {
    id: 'echo-slot-1',
    cost: 4,
    mainStat: { stat: 'criticalRate', value: 22 },
    subStats: [],
  },
  secondaryEchoes: [
    {
      id: 'echo-slot-2',
      cost: 3,
      mainStat: { stat: 'aeroDamageBonus', value: 30 },
      subStats: [],
    },
    {
      id: 'echo-slot-3',
      cost: 3,
      mainStat: { stat: 'aeroDamageBonus', value: 30 },
      subStats: [],
    },
    {
      id: 'echo-slot-4',
      cost: 1,
      mainStat: { stat: 'attackPercent', value: 18 },
      subStats: [],
    },
    {
      id: 'echo-slot-5',
      cost: 1,
      mainStat: { stat: 'attackPercent', value: 18 },
      subStats: [],
    },
  ],
}
