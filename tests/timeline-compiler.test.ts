import { describe, expect, it } from 'vitest'
import type { ActionDefinition } from '../src/domain/combat'
import { compileTimeline, ESTIMATED_MS_PER_HIT } from '../src/simulator/compiler/compileActions'

const foreground: ActionDefinition = {
  id: 'foreground',
  name: '前台动作',
  damageType: 'skill',
  element: 'aero',
  hits: [
    { id: 'one', multiplier: 1, offsetMs: 0 },
    { id: 'two', multiplier: 1, offsetMs: 1 },
    { id: 'three', multiplier: 1, offsetMs: 2 },
  ],
  verificationStatus: 'provisional',
}

const detached: ActionDefinition = {
  ...foreground,
  id: 'detached',
  name: '持久动作',
  executionMode: 'detached',
}

describe('Phase 2 timeline compiler', () => {
  it('estimates 50ms per hit and applies the first hit at action start', () => {
    const result = compileTimeline(
      [{ id: 'skill', actionId: 'foreground', startTimeMs: 100 }],
      [foreground],
    )
    expect(result.windows[0]).toMatchObject({
      startTimeMs: 100,
      endTimeMs: 100 + ESTIMATED_MS_PER_HIT * 3,
      timingSource: 'estimated',
    })
    expect(result.hits.map((hit) => hit.timeMs)).toEqual([100, 150, 200])
  })

  it('drops hits after a trimmed action end without rolling back action start', () => {
    const result = compileTimeline(
      [{ id: 'skill', actionId: 'foreground', startTimeMs: 0, trimmedEndTimeMs: 75 }],
      [foreground],
    )
    expect(result.starts).toHaveLength(1)
    expect(result.hits.map((hit) => hit.timeMs)).toEqual([0, 50])
    expect(result.windows[0]).toMatchObject({ endTimeMs: 75, trimmed: true })
  })

  it('allows every action to overlap without diagnostics', () => {
    const result = compileTimeline(
      [
        { id: 'detached', actionId: 'detached', startTimeMs: 0 },
        { id: 'first', actionId: 'foreground', startTimeMs: 0 },
        { id: 'second', actionId: 'foreground', startTimeMs: 100 },
      ],
      [foreground, detached],
    )
    expect(result.diagnostics).toEqual([])
    expect(result.windows).toHaveLength(3)
  })
})
