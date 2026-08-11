import type { PhaseOneLoadout } from '../../../../domain/loadout'

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
