export type ElementType = 'aero'
export type DamageType = 'basic' | 'heavy' | 'skill' | 'liberation' | 'echo'
export type CriticalMode = 'expected' | 'critical' | 'normal'
export type ActionExecutionMode = 'foreground' | 'detached' | 'coordinated'
export type ScalingStat = 'attack' | 'health' | 'defense'
export type MechanicTrigger = 'action-start' | 'hit-after' | 'shield-gained'
export type EffectTarget = 'self' | 'active' | 'team' | 'enemy'

export interface CombatStats {
  attack: number
  health?: number
  defense?: number
  criticalRate: number
  criticalDamageMultiplier: number
  healingBonus?: number
  healingReceivedBonus?: number
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
  healthPercent?: number
  defensePercent?: number
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
  resonatorIds?: string[]
  weaponIds?: string[]
  mainEchoIds?: string[]
  sonataIds?: string[]
  teamIncludesResonatorIds?: string[]
  minimumTeamSize?: number
  sourceIsActive?: boolean
  shieldActive?: boolean
}

export interface ConditionalCombatModifiers {
  condition?: EffectCondition
  modifiers: CombatModifiers
}

export interface ActionEffectDefinition extends ConditionalCombatModifiers {
  id: string
  target?: EffectTarget
  trigger: MechanicTrigger
  hitId?: string
  durationMs: number
  maxStacks?: number
}

export interface ResourceDefinition {
  id: string
  initialValue: number
  minimumValue: number
  maximumValue: number
}

export interface ResourceRequirement {
  resourceId: string
  minimumValue: number
}

export interface StatusRequirement {
  statusId: string
  active: boolean
}

export interface ActionStatusChangeDefinition {
  id: string
  statusId: string
  trigger: MechanicTrigger
  hitId?: string
  operation: 'apply' | 'remove'
  durationMs?: number
  condition?: EffectCondition
}

export interface ActionDerivedEventDefinition {
  id: string
  kind: 'summon' | 'coordinated-attack' | 'periodic-effect'
  trigger: 'action-start' | 'hit-after'
  hitId?: string
  delayMs: number
  intervalMs?: number
  occurrences: number
  hits?: Array<Pick<DamageHitDefinition, 'id' | 'multiplier' | 'scalingStat'>>
  condition?: EffectCondition
}

export interface ActionResourceChangeDefinition {
  id: string
  resourceId: string
  trigger: MechanicTrigger
  hitId?: string
  amount: number
  condition?: EffectCondition
  internalCooldownMs?: number
}

export type HealingTarget = 'self' | 'active' | 'team'
export type HealingScalingStat = 'attack' | 'health' | 'defense' | 'flat'

export interface ActionHealingDefinition {
  id: string
  trigger: MechanicTrigger
  hitId?: string
  target: HealingTarget
  scalingStat: HealingScalingStat
  multiplier: number
  flatValue?: number
  condition?: EffectCondition
}

export interface ActionShieldDefinition {
  id: string
  trigger: 'action-start' | 'hit-after'
  hitId?: string
  target: HealingTarget
  scalingStat: HealingScalingStat
  multiplier: number
  flatValue?: number
  durationMs: number
  condition?: EffectCondition
}

export interface ActionCooldownChangeDefinition {
  id: string
  trigger: MechanicTrigger
  hitId?: string
  targetActionIds: string[]
  operation: 'reduce' | 'reset' | 'restore-charge'
  amountMs?: number
  condition?: EffectCondition
}

export interface ResonatorMechanicsDefinition {
  resources: ResourceDefinition[]
}

export interface DamageHitDefinition {
  id: string
  multiplier: number
  offsetMs: number
  scalingStat?: ScalingStat
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
  resourceRequirements?: ResourceRequirement[]
  resourceChanges?: ActionResourceChangeDefinition[]
  statusRequirements?: StatusRequirement[]
  statusChanges?: ActionStatusChangeDefinition[]
  derivedEvents?: ActionDerivedEventDefinition[]
  replacesActionId?: string
  healing?: ActionHealingDefinition[]
  shields?: ActionShieldDefinition[]
  cooldownMs?: number
  maxCharges?: number
  chargeRecoveryMode?: 'parallel' | 'sequential'
  cooldownChanges?: ActionCooldownChangeDefinition[]
  activation?: 'normal' | 'intro' | 'outro'
  verificationStatus: 'reviewed-primary-source' | 'cross-checked' | 'provisional'
}

export interface PlannedAction {
  id: string
  resonatorSlotId?: string
  actionId: string
  startTimeMs: number
  trimmedEndTimeMs?: number
}

export interface PlannedSwitchEvent {
  id: string
  fromSlotId: string
  toSlotId: string
  timeMs: number
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
  code:
    | 'unknown-action'
    | 'invalid-trim'
    | 'insufficient-resource'
    | 'cooldown-active'
    | 'missing-status'
    | 'no-action-charge'
    | 'invalid-intro-source'
    | 'invalid-outro-source'
  timeMs: number
  actionInstanceIds: string[]
  resourceId?: string
  requiredValue?: number
  actualValue?: number
  availableAtMs?: number
  statusId?: string
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
  scalingStat: ScalingStat
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
  resonatorSlotId: string
  timeMs: number
  value: number
  change: number
  sourceActionId?: string
}

export interface HealingResult {
  id: string
  sourceActionId: string
  actionInstanceId: string
  resonatorSlotId: string
  target: HealingTarget
  timeMs: number
  scalingStat: HealingScalingStat
  scalingBase: number
  multiplier: number
  flatValue: number
  healingBonusMultiplier: number
  healingReceivedMultiplier: number
  finalHealing: number
}

export interface ShieldResult {
  id: string
  sourceActionId: string
  actionInstanceId: string
  resonatorSlotId: string
  target: HealingTarget
  targetSlotId?: string
  timeMs: number
  endTimeMs: number
  scalingStat: HealingScalingStat
  scalingBase: number
  multiplier: number
  flatValue: number
  finalShield: number
}

export interface TeamMemberContext {
  slotId: string
  resonatorId: string
  weaponId?: string
  mainEchoId?: string
  sonataIds?: string[]
}

export interface SimulationInput {
  resonatorLevel: 90
  resonanceChain: 0 | 1 | 2 | 3 | 4 | 5 | 6
  weaponRefinement: 1 | 2 | 3 | 4 | 5
  stats: CombatStats
  enemy: EnemyConfig
  criticalMode: CriticalMode
  initialResources?: Record<string, number>
  team?: TeamMemberContext[]
  initialActiveSlotId?: string
  switches?: PlannedSwitchEvent[]
  actions: PlannedAction[]
}

export interface MechanicEvent {
  id: string
  kind:
    | 'resource'
    | 'healing'
    | 'shield'
    | 'switch'
    | 'charge'
    | 'cooldown'
    | 'summon'
    | 'coordinated-attack'
    | 'periodic-effect'
  sourceActionId: string
  actionInstanceId: string
  resonatorSlotId: string
  timeMs: number
  label: string
  value?: number
  target?: HealingTarget | 'enemy'
  targetSlotId?: string
  generated: boolean
}

export interface StatusInterval {
  id: string
  statusId: string
  resonatorSlotId: string
  sourceActionId: string
  startTimeMs: number
  endTimeMs: number
}

export interface SimulationResult {
  hits: DamageResult[]
  totalDamage: number
  durationMs: number
  dps: number
  healing: HealingResult[]
  totalHealing: number
  hps: number
  shields: ShieldResult[]
  totalShield: number
  timeline: Pick<CompiledTimeline, 'windows' | 'diagnostics'>
  buffIntervals: BuffInterval[]
  resourceCurve: ResourcePoint[]
  mechanicEvents: MechanicEvent[]
  statusIntervals: StatusInterval[]
}
