import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { defaultPhaseOneLoadout } from '../../../data/versions/v3_5/phaseOne'
import {
  deleteProject,
  listProjects,
  readProject,
  writeProject,
} from '../persistence/projectDatabase'
import { createProjectId } from '../persistence/projectSchema'
import type { CalculatorProject, ProjectSettings } from '../persistence/projectSchema'
import { useCalculatorProjectStore } from './project'
import { DEFAULT_TIMELINE_DURATION_MS, useTimelineStore } from './timeline'

const ACTIVE_PROJECT_KEY = 'wuwa-calculator:active-project'

export const useProjectLibraryStore = defineStore('project-library', {
  state: () => ({
    projects: [] as CalculatorProject[],
    activeProjectId: '' as string,
    loading: false,
    error: '' as '' | 'storage' | 'invalid-project',
    saveStatus: 'saved' as 'saved' | 'pending' | 'saving' | 'error',
  }),
  getters: {
    activeProject: (state) =>
      state.projects.find((project) => project.id === state.activeProjectId),
  },
  actions: {
    markDirty() {
      if (this.activeProjectId) this.saveStatus = 'pending'
    },
    async initialize() {
      this.loading = true
      this.error = ''
      try {
        this.projects = await listProjects()
        const preferred = localStorage.getItem(ACTIVE_PROJECT_KEY)
        const project = this.projects.find((item) => item.id === preferred) ?? this.projects[0]
        if (project) await this.openProject(project.id)
      } catch {
        this.error = 'storage'
      } finally {
        this.loading = false
      }
    },
    createBlankProject(name = '未命名项目'): CalculatorProject {
      const projectStore = useCalculatorProjectStore()
      const timelineStore = useTimelineStore()
      const now = new Date().toISOString()
      return {
        schemaVersion: 1,
        id: createProjectId(),
        name,
        gameVersion: '3.5',
        createdAt: now,
        updatedAt: now,
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
        settings: structuredClone(toRaw(projectStore.settings)) as ProjectSettings,
        loadout: structuredClone(defaultPhaseOneLoadout),
        timeline: {
          ...timelineStore.document(),
          durationMs: DEFAULT_TIMELINE_DURATION_MS,
        },
      }
    },
    async createProject(name?: string) {
      const project = this.createBlankProject(name)
      this.projects.unshift(project)
      await this.openProject(project.id)
      try {
        await writeProject(project)
      } catch {
        this.error = 'storage'
      }
      return project
    },
    async duplicateActive() {
      const source = this.snapshotActive()
      if (!source) return
      const now = new Date().toISOString()
      const copy: CalculatorProject = {
        ...structuredClone(toRaw(source)),
        id: createProjectId(),
        name: `${source.name}（副本）`.slice(0, 80),
        createdAt: now,
        updatedAt: now,
      }
      this.projects.unshift(copy)
      await this.openProject(copy.id)
      try {
        await writeProject(copy)
      } catch {
        this.error = 'storage'
      }
    },
    async openProject(id: string) {
      const project = this.projects.find((item) => item.id === id) ?? (await readProject(id))
      if (!project) {
        this.error = 'invalid-project'
        return false
      }
      const projectStore = useCalculatorProjectStore()
      const timelineStore = useTimelineStore()
      Object.assign(projectStore.settings, structuredClone(toRaw(project.settings)))
      Object.assign(projectStore.loadout, structuredClone(toRaw(project.loadout)))
      timelineStore.replaceDocument(structuredClone(toRaw(project.timeline)))
      this.activeProjectId = id
      localStorage.setItem(ACTIVE_PROJECT_KEY, id)
      return true
    },
    snapshotActive(): CalculatorProject | undefined {
      const existing = this.activeProject
      if (!existing) return undefined
      const projectStore = useCalculatorProjectStore()
      const timelineStore = useTimelineStore()
      return {
        ...structuredClone(toRaw(existing)),
        updatedAt: new Date().toISOString(),
        settings: structuredClone(toRaw(projectStore.settings)) as ProjectSettings,
        loadout: structuredClone(toRaw(projectStore.loadout)),
        timeline: timelineStore.document(),
      }
    },
    async saveActive() {
      const project = this.snapshotActive()
      if (!project) return
      this.saveStatus = 'saving'
      try {
        await writeProject(project)
        const index = this.projects.findIndex((item) => item.id === project.id)
        if (index >= 0) this.projects[index] = project
        this.saveStatus = 'saved'
      } catch {
        this.error = 'storage'
        this.saveStatus = 'error'
      }
    },
    async renameActive(name: string) {
      const project = this.activeProject
      const trimmed = name.trim()
      if (!project || !trimmed) return
      project.name = trimmed.slice(0, 80)
      await this.saveActive()
    },
    async addImportedProject(project: CalculatorProject) {
      await writeProject(project)
      this.projects.unshift(project)
      await this.openProject(project.id)
    },
    async removeProject(id: string) {
      await deleteProject(id)
      this.projects = this.projects.filter((project) => project.id !== id)
      if (this.activeProjectId === id) {
        this.activeProjectId = ''
        localStorage.removeItem(ACTIVE_PROJECT_KEY)
        const next = this.projects[0]
        if (next) await this.openProject(next.id)
      }
    },
  },
})
