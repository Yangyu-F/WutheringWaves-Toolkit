import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimelineStore } from '../src/features/calculator/stores/timeline'
import { useTimelineViewportStore } from '../src/features/calculator/stores/timelineViewport'
import { parseTimelineDocument } from '../src/features/calculator/timeline/migrations'

describe('timeline editor store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts new timelines at one minute', () => {
    expect(useTimelineStore().durationMs).toBe(60_000)
  })

  it('clamps legacy long timelines to the supported 120 second maximum', () => {
    const store = useTimelineStore()
    store.replaceDocument({
      schemaVersion: 2,
      durationMs: 240_000,
      snapMs: 1,
      actions: [],
      switches: [],
    })

    expect(store.durationMs).toBe(120_000)
  })

  it('keeps millisecond precision and supports undo and redo', () => {
    const store = useTimelineStore()
    store.moveAction('action-1', 176)
    expect(store.actions[0]?.startTimeMs).toBe(176)
    store.undo()
    expect(store.actions[0]?.startTimeMs).toBe(0)
    store.redo()
    expect(store.actions[0]?.startTimeMs).toBe(176)
  })

  it('persists switch events and includes them in undo and redo history', () => {
    const store = useTimelineStore()
    store.addSwitch('slot-2', 1_250)
    expect(store.switches).toEqual([
      { id: 'switch-5', fromSlotId: 'slot-1', toSlotId: 'slot-2', timeMs: 1_250 },
    ])
    store.undo()
    expect(store.switches).toEqual([])
    store.redo()
    expect(store.document().switches).toHaveLength(1)
  })

  it('adds a skill at the center of the visible timeline window', () => {
    const store = useTimelineStore()
    const viewport = useTimelineViewportStore()
    store.actions = []
    viewport.updateViewport(10_000, 5_000)
    store.addActionToViewport(
      'changtai-gongji-1',
      'slot-1',
      viewport.viewportStartMs,
      viewport.viewportDurationMs,
    )

    expect(store.actions[0]?.startTimeMs).toBe(12_500)
  })

  it('rejects a fifth overlapping skill on the same resonator track', () => {
    const store = useTimelineStore()
    store.actions = []
    for (let index = 0; index < 5; index += 1) store.addAction('changtai-gongji-1', 'slot-1', 1_000)

    expect(store.actions).toHaveLength(4)
    expect(store.operationMessage).toBe('maximum-overlap')
  })

  it('exposes the newly added action for selection feedback', () => {
    const store = useTimelineStore()
    store.actions = []
    const id = store.addAction('changtai-gongji-1', 'slot-1', 800)

    expect(id).toBe(store.lastAddedActionId)
  })

  it('round-trips a versioned document and rejects invalid input', () => {
    const store = useTimelineStore()
    store.actions[0]!.resonatorSlotId = 'slot-2'
    store.trimAction('action-1', 25)
    const exported = JSON.stringify(store.document())

    const restored = useTimelineStore(createPinia())
    const parsed = parseTimelineDocument(JSON.parse(exported))
    expect(parsed).toBeDefined()
    restored.replaceDocument(parsed!)
    expect(restored.actions[0]?.trimmedEndTimeMs).toBe(25)
    expect(restored.actions[0]?.resonatorSlotId).toBe('slot-2')
    expect(parseTimelineDocument({ schemaVersion: 2 })).toBeUndefined()
  })

  it('does not trim an action beyond its natural duration', () => {
    const store = useTimelineStore()

    store.trimAction('action-1', 10_000)

    expect(store.actions[0]?.trimmedEndTimeMs).toBeUndefined()
  })
})
