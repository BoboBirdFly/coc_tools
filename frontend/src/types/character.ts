export type AttributeKey = 'str' | 'con' | 'dex' | 'int' | 'pow' | 'siz' | 'app' | 'edu'

export type AttributeMap = Record<AttributeKey, number>

export type SecondaryStatKey = 'hp' | 'san' | 'luck' | 'mp' | 'mov'

export type SecondaryStats = Record<SecondaryStatKey, number>

export type SkillCategory =
  | '学识'
  | '社交'
  | '调查'
  | '战斗'
  | '生存'
  | '技艺'
  | '医疗'

export interface SkillDefinition {
  id: string
  name: string
  category: SkillCategory
  base: number // 技能基础值（角色卡上显示的初始值，COC7th规则）
  description?: string
}

export type ItemCategory = '武器' | '工具' | '医疗' | '书籍' | '其他'

export interface EquipmentItem {
  id: string
  name: string
  category: ItemCategory
  description: string
  weight?: number
}

export interface SkillFormulaPart {
  attribute: AttributeKey
  multiplier: number
}

export interface DifficultyThreshold {
  regular: number
  hard: number
  extreme: number
}

export type AttributeThresholds = Record<AttributeKey, DifficultyThreshold>

export interface SkillBudget {
  occupation: number
  personal: number
}

export interface Profession {
  id: string
  name: string
  description: string
  signatureSkills: string[]
  attributeFocus: Partial<Record<AttributeKey, number>>
  hpModifier: number
  skillFormulas: SkillFormulaPart[]
}

export interface BaseCharacterInput {
  name: string
  professionId: string
  attributes: AttributeMap
  skills?: SkillAllocation // 技能分配（可选，车卡时分配）
}

// 技能分配：记录每个技能分配的点数
export type SkillAllocation = Record<string, number> // skillId -> allocated points

export interface CalculatedCharacter {
  name: string
  professionId: string
  attributes: AttributeMap
  secondaryStats: SecondaryStats
  thresholds: AttributeThresholds
  skillBudgets: SkillBudget
  signatureSkills: SkillDefinition[]
}

