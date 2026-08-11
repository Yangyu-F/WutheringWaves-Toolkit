import { z } from 'zod'

const timelineItemSchema = z.object({
  id: z.string().min(1),
  resonatorSlotId: z.string().min(1).default('slot-1'),
  actionId: z.string().min(1),
  startTimeMs: z.number().int().nonnegative(),
  trimmedEndTimeMs: z.number().int().nonnegative().optional(),
})

export const timelineDocumentSchema = z.object({
  schemaVersion: z.literal(2),
  durationMs: z.number().int().min(1_000).max(300_000),
  snapMs: z.number().int().min(1).max(5_000),
  actions: z.array(timelineItemSchema).max(2_000),
})

export const timelineDocumentV1Schema = z.object({
  schemaVersion: z.literal(1),
  durationMs: z.number().int().min(1_000).max(300_000),
  snapMs: z.number().int().min(1).max(5_000),
  actions: z
    .array(
      z.object({
        id: z.string().min(1),
        actionId: z.string().min(1),
        startTimeMs: z.number().int().nonnegative(),
        kind: z.enum(['action', 'dodge']).optional(),
      }),
    )
    .max(2_000),
})

export type TimelineDocument = z.infer<typeof timelineDocumentSchema>
