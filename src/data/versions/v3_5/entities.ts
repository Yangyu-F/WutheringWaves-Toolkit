import { phaseOneSources } from './sources'

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
