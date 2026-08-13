import { z } from 'zod'
import type { CriticalMode } from '../../../domain/combat'
import type { PhaseOneLoadout } from '../../../domain/loadout'
import { timelineDocumentSchema } from '../timeline/schema'

const settingsSchema = z.object({
  resonanceChain: z.number().int().min(0).max(6),
  weaponRefinement: z.number().int().min(1).max(5),
  enemyLevel: z.number().int().min(1).max(200),
  aeroResistancePercent: z.number().min(-100).max(500),
  criticalMode: z.enum(['expected', 'critical', 'normal']),
  initialLiuxiang: z.number().int().min(0).max(3).default(0),
})
const teamSlotSchema = z.object({
  id: z.enum(['slot-1', 'slot-2', 'slot-3']),
  resonatorId: z.string().min(1).optional(),
  weaponId: z.string().min(1).optional(),
  mainEchoId: z.string().min(1).optional(),
})

export const calculatorProjectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(80),
  gameVersion: z.literal('3.5'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  team: z.array(teamSlotSchema).length(3),
  settings: settingsSchema,
  loadout: z.custom<PhaseOneLoadout>(
    (value) =>
      typeof value === 'object' &&
      value !== null &&
      (value as { gameVersion?: unknown }).gameVersion === '3.5',
  ),
  timeline: timelineDocumentSchema,
})

export interface ProjectSettings {
  resonanceChain: 0 | 1 | 2 | 3 | 4 | 5 | 6
  weaponRefinement: 1 | 2 | 3 | 4 | 5
  enemyLevel: number
  aeroResistancePercent: number
  criticalMode: CriticalMode
  initialLiuxiang: number
}
export type CalculatorProject = z.infer<typeof calculatorProjectSchema>

export function createProjectId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `project-${Date.now()}-${Math.random().toString(36).slice(2)}`
  )
}
