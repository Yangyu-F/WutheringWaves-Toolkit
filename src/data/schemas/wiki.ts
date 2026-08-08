import { z } from 'zod'

export const sourceRefSchema = z.object({
  url: z.string().url(),
  catalogueId: z.number().int().positive(),
  checkedAt: z.string().date(),
})
export const catalogueSchema = z.object({
  key: z.string(),
  label: z.string(),
  source: sourceRefSchema,
  status: z.enum(['candidate', 'reviewed']),
})
export const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  primarySource: z.string().url(),
  catalogues: z.array(catalogueSchema),
  futureCandidates: z.array(z.object({ key: z.string(), label: z.string(), note: z.string() })),
})
export type WikiManifest = z.infer<typeof manifestSchema>
