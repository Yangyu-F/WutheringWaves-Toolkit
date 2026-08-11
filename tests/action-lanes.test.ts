import { describe, expect, it } from 'vitest'
import { assignActionLanes } from '../src/features/calculator/layout/assignActionLanes'

describe('action lane assignment', () => {
  it('reuses a lane for adjacent actions', () => {
    expect(
      assignActionLanes([
        { id: 'a', startTimeMs: 0, endTimeMs: 500 },
        { id: 'b', startTimeMs: 500, endTimeMs: 900 },
      ]),
    ).toEqual([
      { actionId: 'a', laneIndex: 0 },
      { actionId: 'b', laneIndex: 0 },
    ])
  })

  it('places overlapping actions on separate deterministic lanes', () => {
    expect(
      assignActionLanes([
        { id: 'b', startTimeMs: 100, endTimeMs: 600 },
        { id: 'a', startTimeMs: 0, endTimeMs: 500 },
        { id: 'c', startTimeMs: 200, endTimeMs: 300 },
      ]),
    ).toEqual([
      { actionId: 'a', laneIndex: 0 },
      { actionId: 'b', laneIndex: 1 },
      { actionId: 'c', laneIndex: 2 },
    ])
  })

  it('frees a lane when an action is trimmed', () => {
    const placements = assignActionLanes([
      { id: 'trimmed', startTimeMs: 0, endTimeMs: 200 },
      { id: 'next', startTimeMs: 200, endTimeMs: 500 },
    ])
    expect(placements.every((placement) => placement.laneIndex === 0)).toBe(true)
  })
})
