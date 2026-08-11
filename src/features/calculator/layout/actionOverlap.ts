export interface TimelineInterval {
  startTimeMs: number
  endTimeMs: number
}

export function canPlaceInterval(
  intervals: TimelineInterval[],
  candidate: TimelineInterval,
  maximumConcurrent = 4,
): boolean {
  const events = [...intervals, candidate].flatMap((interval) => [
    { timeMs: interval.startTimeMs, delta: 1 },
    { timeMs: interval.endTimeMs, delta: -1 },
  ])
  events.sort((left, right) => left.timeMs - right.timeMs || left.delta - right.delta)

  let concurrent = 0
  return events.every((event) => {
    concurrent += event.delta
    return concurrent <= maximumConcurrent
  })
}

export function findAvailableStart(
  intervals: TimelineInterval[],
  durationMs: number,
  preferredStartMs: number,
  minimumStartMs: number,
  maximumStartMs: number,
): number | undefined {
  const candidates = [preferredStartMs, ...intervals.map((interval) => interval.endTimeMs)]
    .filter((timeMs) => timeMs >= minimumStartMs && timeMs <= maximumStartMs)
    .sort(
      (left, right) =>
        Math.abs(left - preferredStartMs) - Math.abs(right - preferredStartMs) || left - right,
    )

  return candidates.find((startTimeMs) =>
    canPlaceInterval(intervals, { startTimeMs, endTimeMs: startTimeMs + durationMs }),
  )
}
