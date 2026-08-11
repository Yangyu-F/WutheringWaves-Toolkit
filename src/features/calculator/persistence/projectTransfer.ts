import { calculatorProjectSchema, createProjectId } from './projectSchema'
import type { CalculatorProject } from './projectSchema'

const MAX_PROJECT_BYTES = 2 * 1024 * 1024

export function exportProject(project: CalculatorProject): string {
  return JSON.stringify(project, null, 2)
}

export function importProject(raw: string): CalculatorProject {
  if (new TextEncoder().encode(raw).byteLength > MAX_PROJECT_BYTES) {
    throw new Error('project-too-large')
  }
  const imported = calculatorProjectSchema.parse(JSON.parse(raw))
  const now = new Date().toISOString()
  return {
    ...structuredClone(imported),
    id: createProjectId(),
    name: `${imported.name}（导入）`,
    createdAt: now,
    updatedAt: now,
  }
}

export function downloadProject(project: CalculatorProject): void {
  const blob = new Blob([exportProject(project)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${project.name.replace(/[\\/:*?"<>|]/g, '-')}.wuwa-calc.json`
  link.click()
  URL.revokeObjectURL(url)
}
