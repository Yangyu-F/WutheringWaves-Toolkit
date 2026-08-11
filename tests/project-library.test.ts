import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectLibraryStore } from '../src/features/calculator/stores/projectLibrary'

describe('project library', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('creates and opens a usable project even when persistent storage is unavailable', async () => {
    const library = useProjectLibraryStore()
    const project = await library.createProject('新伤害计算')
    expect(library.activeProjectId).toBe(project.id)
    expect(library.activeProject?.name).toBe('新伤害计算')
    expect(library.error).toBe('storage')
  })

  it('can snapshot reactive project settings without a DataCloneError', async () => {
    const library = useProjectLibraryStore()
    await library.createProject('快照测试')
    expect(() => library.snapshotActive()).not.toThrow()
    expect(library.snapshotActive()?.settings.enemyLevel).toBe(90)
  })
})
