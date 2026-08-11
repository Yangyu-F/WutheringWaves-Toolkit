export interface ActionInterval {
  id: string
  startTimeMs: number
  endTimeMs: number
}

export interface ActionLanePlacement {
  actionId: string
  laneIndex: number
}

export function assignActionLanes(actions: ActionInterval[]): ActionLanePlacement[] {
  const laneEnds: number[] = []
  return [...actions]
    .sort(
      (left, right) =>
        left.startTimeMs - right.startTimeMs ||
        left.endTimeMs - right.endTimeMs ||
        left.id.localeCompare(right.id),
    )
    .map((action) => {
      let laneIndex = laneEnds.findIndex((endTimeMs) => endTimeMs <= action.startTimeMs)
      if (laneIndex < 0) laneIndex = laneEnds.length
      laneEnds[laneIndex] = Math.max(action.startTimeMs, action.endTimeMs)
      return { actionId: action.id, laneIndex }
    })
}
