export type AttributeKey = 'str' | 'con' | 'dex' | 'int' | 'pow' | 'siz' | 'app' | 'edu'

export type AttributeMap = Record<AttributeKey, number>

export type SecondaryStatKey = 'hp' | 'san' | 'luck' | 'mp'

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
  base: number
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

export interface Profession {
  id: string
  name: string
  description: string
  signatureSkills: string[]
  attributeFocus: Partial<Record<AttributeKey, number>>
  hpModifier: number
}

export interface BaseCharacterInput {
  name: string
  professionId: string
  attributes: AttributeMap
}

export interface CalculatedCharacter {
  name: string
  professionId: string
  attributes: AttributeMap
  secondaryStats: SecondaryStats
  skillPoints: number
}

