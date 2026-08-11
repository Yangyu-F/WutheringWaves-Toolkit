import { describe, expect, it } from 'vitest'
import { defaultPhaseOneLoadout } from '../src/data/versions/v3_5/phaseOne'
import type { CalculatorProject } from '../src/features/calculator/persistence/projectSchema'
import {
  exportProject,
  importProject,
} from '../src/features/calculator/persistence/projectTransfer'

function fixture(): CalculatorProject {
  return {
    schemaVersion: 1,
    id: 'original',
    name: '测试项目',
    gameVersion: '3.5',
    createdAt: '2026-08-11T00:00:00.000Z',
    updatedAt: '2026-08-11T00:00:00.000Z',
    team: [
      {
        id: 'slot-1',
        resonatorId: 'yangyang',
        weaponId: 'qiangu-fuliu',
        mainEchoId: 'feilian-zhixing',
      },
      { id: 'slot-2' },
      { id: 'slot-3' },
    ],
    settings: {
      resonanceChain: 0,
      weaponRefinement: 1,
      enemyLevel: 90,
      aeroResistancePercent: 10,
      criticalMode: 'expected',
    },
    loadout: structuredClone(defaultPhaseOneLoadout),
    timeline: { schemaVersion: 2, durationMs: 30_000, snapMs: 100, actions: [] },
  }
}

describe('project transfer', () => {
  it('exports a valid project and imports it as a non-destructive copy', () => {
    const source = fixture()
    const imported = importProject(exportProject(source))
    expect(imported.id).not.toBe(source.id)
    expect(imported.name).toBe('测试项目（导入）')
    expect(imported.timeline).toEqual(source.timeline)
  })

  it('rejects invalid and oversized documents', () => {
    expect(() => importProject('{"schemaVersion":99}')).toThrow()
    expect(() => importProject(' '.repeat(2 * 1024 * 1024 + 1))).toThrow('project-too-large')
  })
})
