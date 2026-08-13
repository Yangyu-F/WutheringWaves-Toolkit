import { describe, expect, it } from 'vitest'
import { phaseOneEntities, yangyangActions } from '../src/data/versions/v3_5/phaseOne'
import { compileActions } from '../src/simulator/compiler/compileActions'

describe('action compiler', () => {
  it('preserves official names for the Phase 1 weapon, Echo, and Sonata effects', () => {
    expect(phaseOneEntities.weapon.effectName).toBe('流涡无垠')
    expect(phaseOneEntities.sonata.twoPieceEffectName).toBe('2件套')
    expect(phaseOneEntities.sonata.fivePieceEffectName).toBe('5件套')
    const echoAction = yangyangActions[yangyangActions.length - 1]
    expect(echoAction?.hits.map((hit) => hit.id)).toEqual(['tiji', 'zhuiji'])
  })

  it('contains every damage-dealing Yangyang action cross-checked for Phase 1', () => {
    expect(
      yangyangActions.filter((action) => action.hits.length > 0).map((action) => action.id),
    ).toEqual([
      'changtai-gongji-1',
      'changtai-gongji-2',
      'changtai-gongji-3',
      'changtai-gongji-4',
      'zhongji',
      'kongzhong-gongji',
      'zhongji-fengyin',
      'shanbi-fanji',
      'liufeng-zaiyu',
      'zhongji-fengxi',
      'kongzhong-gongji-shiyu',
      'shuofeng-xuanyong',
      'zhanlan-lizan',
      'shenghai-jineng-feilian-zhixing',
    ])
  })
  it('expands multi-hit actions and preserves stable timestamp ordering', () => {
    const hits = compileActions(
      [
        { id: 'later', actionId: 'changtai-gongji-1', startTimeMs: 1000 },
        { id: 'earlier', actionId: 'changtai-gongji-3', startTimeMs: 200 },
      ],
      yangyangActions,
    )

    expect(hits.map((hit) => [hit.actionInstanceId, hit.timeMs])).toEqual([
      ['earlier', 200],
      ['earlier', 250],
      ['later', 1000],
    ])
  })

  it('rejects unknown actions instead of silently producing wrong damage', () => {
    expect(() =>
      compileActions([{ id: 'bad', actionId: 'missing', startTimeMs: 0 }], yangyangActions),
    ).toThrow('Unknown action: missing')
  })
})
