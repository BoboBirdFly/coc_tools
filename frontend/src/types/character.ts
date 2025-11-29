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
  // 可选属性（用于"或"的情况，取较大值）
  alternativeAttributes?: AttributeKey[]
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

// 可选技能组的类型
export type OptionalSkillType =
  | 'specific' // 明确选项列表：下面任选X项：技能1、技能2、技能3
  | 'personal-or-era' // 个人或时代特长：任意X项其他个人或时代特长
  | 'all' // 全技能开放：任意X项其他技能
  | 'academic-personal-era' // 学术/个人/时代混合：任意X项其他学术、个人或时代特长
  | 'academic' // 学术领域：任意X项其他学术领域
  | 'science' // 科学专业：任意X项科学专业领域
  | 'free' // 自由选择：X个和学习内容相关的专业技能
  | 'skill-subset' // 技能子项：技能名（固定项和任意X项）

// 可选技能组（如"下面任选两项：急救、机械维修、外语"）
export interface OptionalSkillGroup {
  type: OptionalSkillType
  count: number // 需要选择的数量
  skillIds?: string[] // 明确选项列表（type='specific'时使用）
  skillId?: string // 技能ID（type='skill-subset'时使用）
  fixedSubItems?: string[] // 固定子项（type='skill-subset'时使用）
  description?: string // 特殊说明（type='free'时使用）
}

export interface Profession {
  id: string
  name: string
  description: string
  signatureSkills: string[]
  optionalSkillGroups?: OptionalSkillGroup[] // 可选技能组
  attributeFocus: Partial<Record<AttributeKey, number>>
  hpModifier: number
  skillFormulas: SkillFormulaPart[]
}

export interface BaseCharacterInput {
  professionId: string
  name: string
  attributes: AttributeMap
  skills?: SkillAllocation // 技能分配（可选，车卡时分配）
  background?: CharacterBackground // 背景信息
  assets?: CharacterAssets // 资产信息
}

// 技能分配：记录每个技能分配的点数
export type SkillAllocation = Record<string, number> // skillId -> allocated points

// 角色背景信息
export interface CharacterBackground {
  appearance: string // 形象描述
  ideology: string // 思想与信念
  significantPeople: string // 重要之人
  treasuredPossessions: string // 宝贵之物
  significantLocations: string // 意义非凡之地
  traits: string // 特质
  phobiasAndManias: string // 恐惧症与躁狂症
  thirdKindEncounters: string // 第三类接触
  mythosKnowledge: string // 典籍、法术和神话造物
  inventory: string // 携带物品
}

// 资产信息
export interface CharacterAssets {
  spendingLevel: string // 消费水平
  cash: string // 现金
  assets: string // 资产
}

export interface CalculatedCharacter {
  name: string
  professionId: string
  attributes: AttributeMap
  secondaryStats: SecondaryStats
  thresholds: AttributeThresholds
  skillBudgets: SkillBudget
  signatureSkills: SkillDefinition[]
}

// 完整的角色数据（用于存储和列表展示）
export interface Character extends BaseCharacterInput {
  id: string // 唯一标识符
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}

// Larry版车卡临时数据（用于保存和恢复车卡过程中的状态）
export interface LarryCreationTempData {
  mode: 'larry'
  larryGroup1: number[] // str、dex、app、pow、con 的5个值
  larryGroup2: number[] // siz、int、edu 的3个值
  larryAllocations: Partial<AttributeMap> // 用户分配的属性值
  luck: number | null // 幸运值
}

