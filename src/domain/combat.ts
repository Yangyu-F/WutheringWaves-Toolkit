export type ElementType = 'aero'
export type DamageType = 'basic' | 'heavy' | 'skill' | 'liberation' | 'echo'
export type CriticalMode = 'expected' | 'critical' | 'normal'
export type ActionExecutionMode = 'foreground' | 'detached' | 'coordinated'

export interface CombatStats {
  attack: number
  criticalRate: number
  criticalDamageMultiplier: number
  aeroDamageBonus: number
  genericDamageBonus: number
  damageTypeBonuses: Partial<Record<DamageType, number>>
  multiplierBonus?: number
  damageDeepen?: number
  independentMultiplierBonus?: number
  defenseIgnore?: number
  resistanceIgnore?: number
}

export interface EnemyConfig {
  level: number
  resistances: Record<ElementType, number>
  immuneElements?: ElementType[]
  defenseReduction?: number
  resistanceReductions?: Partial<Record<ElementType, number>>
}

export interface CombatModifiers {
  attackPercent?: number
  aeroDamageBonus?: number
  genericDamageBonus?: number
  damageTypeBonuses?: Partial<Record<DamageType, number>>
  multiplierBonus?: number
  damageDeepen?: number
  independentMultiplierBonus?: number
  defenseIgnore?: number
  defenseReduction?: number
  resistanceIgnore?: number
  resistanceReduction?: number
  attackPercentByWeaponRefinement?: readonly number[]
}

export interface EffectCondition {
  minResonanceChain?: number
  actionIds?: string[]
}

export interface ConditionalCombatModifiers {
  condition?: EffectCondition
  modifiers: CombatModifiers
}

export interface ActionEffectDefinition extends ConditionalCombatModifiers {
  id: string
  target?: 'self' | 'team' | 'enemy'
  trigger: 'action-start' | 'hit-after'
  hitId?: string
  durationMs: number
  maxStacks?: number
}

export interface DamageHitDefinition {
  id: string
  multiplier: number
  offsetMs: number
}

export interface ActionDefinition {
  id: string
  name: string
  damageType: DamageType
  element: ElementType
  hits: DamageHitDefinition[]
  executionMode?: ActionExecutionMode
  passiveModifiers?: ConditionalCombatModifiers[]
  effects?: ActionEffectDefinition[]
  verificationStatus: 'reviewed-primary-source' | 'cross-checked' | 'provisional'
}

export interface PlannedAction {
  id: string
  resonatorSlotId?: string
  actionId: string
  startTimeMs: number
  trimmedEndTimeMs?: number
}

export interface ActionWindow {
  actionInstanceId: string
  actionId: string
  resonatorSlotId: string
  startTimeMs: number
  endTimeMs: number
  naturalEndTimeMs: number
  trimmed: boolean
  timingSource: 'estimated' | 'measured'
}

export interface TimelineDiagnostic {
  code: 'unknown-action' | 'invalid-trim'
  timeMs: number
  actionInstanceIds: string[]
}

export interface CompiledActionStart {
  actionInstanceId: string
  actionId: string
  resonatorSlotId: string
  timeMs: number
  sequence: number
}

export interface CompiledTimeline {
  starts: CompiledActionStart[]
  hits: CompiledHit[]
  windows: ActionWindow[]
  diagnostics: TimelineDiagnostic[]
}

export interface CompiledHit {
  id: string
  actionInstanceId: string
  actionId: string
  actionName: string
  resonatorSlotId: string
  damageType: DamageType
  element: ElementType
  multiplier: number
  timeMs: number
  sequence: number
}

export interface DamageBreakdown {
  scalingBase: number
  skillMultiplier: number
  rawDamage: number
  multiplierBonusMultiplier: number
  damageBonusMultiplier: number
  damageDeepenMultiplier: number
  independentMultiplier: number
  criticalMultiplier: number
  defenseMultiplier: number
  resistanceMultiplier: number
  effectiveResistance: number
  finalDamage: number
}

export interface DamageResult extends CompiledHit {
  breakdown: DamageBreakdown
}

export interface BuffInterval {
  id: string
  sourceActionId: string
  targetTrack: 'slot-1' | 'slot-2' | 'slot-3' | 'team' | 'enemy'
  startTimeMs: number
  endTimeMs: number
  stacks: number
}

export interface ResourcePoint {
  resourceId: string
  timeMs: number
  value: number
}

export interface SimulationInput {
  resonatorLevel: 90
  resonanceChain: 0 | 1 | 2 | 3 | 4 | 5 | 6
  weaponRefinement: 1 | 2 | 3 | 4 | 5
  stats: CombatStats
  enemy: EnemyConfig
  criticalMode: CriticalMode
  actions: PlannedAction[]
}

export interface SimulationResult {
  hits: DamageResult[]
  totalDamage: number
  durationMs: number
  dps: number
  timeline: Pick<CompiledTimeline, 'windows' | 'diagnostics'>
  buffIntervals: BuffInterval[]
  resourceCurve: ResourcePoint[]
}
