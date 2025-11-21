import { getSkillById } from '@data/skills'
import type {
  AttributeMap,
  AttributeThresholds,
  BaseCharacterInput,
  CalculatedCharacter,
  Profession,
  SecondaryStats,
  SkillBudget,
  SkillDefinition,
} from '@schema/character'

// COC7th 规则常量（参考 docs/coc7th调查员手册.md）
const HP_DIVISOR = 10 // HP = (CON + SIZ) / 10
const MP_DIVISOR = 5 // MP = POW / 5
const MOV_BASE = 7 // 基础移动力

// 数值范围限制工具函数
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * 根据职业加成调整基础属性（参考 docs/coc7th调查员手册）
 */
const withProfessionFocus = (attributes: AttributeMap, profession?: Profession): AttributeMap => {
  if (!profession) {
    return attributes
  }
  const next: AttributeMap = { ...attributes }
  for (const [key, bonus] of Object.entries(profession.attributeFocus)) {
    const attributeKey = key as keyof AttributeMap
    next[attributeKey] = clamp(next[attributeKey] + (bonus ?? 0), 15, 95)
  }
  return next
}

/**
 * 移动力（MOV）计算
 * 规则：STR > SIZ 且 DEX > SIZ → 9；STR ≥ SIZ 或 DEX ≥ SIZ → 8；否则 → 7
 * 注：不含年龄/负重修正（后续可扩展）
 */
const deriveMoveRate = (attributes: AttributeMap) => {
  const { str, dex, siz } = attributes
  if (str > siz && dex > siz) {
    return 9
  }
  if (str >= siz || dex >= siz) {
    return 8
  }
  return MOV_BASE
}

/**
 * 计算二级属性（参考 COC7th 规则）
 * - HP = (CON + SIZ) / 10 + 职业修正，范围 1-30
 * - SAN = POW（初始值），范围 0-99
 * - 幸运 = POW（初始值），范围 0-99
 * - MP = POW / 5，范围 1-20
 * - MOV = 根据 STR/DEX/SIZ 计算
 */
const deriveSecondaryStats = (attributes: AttributeMap, profession?: Profession): SecondaryStats => {
  const hpRaw = Math.floor((attributes.con + attributes.siz) / HP_DIVISOR) + (profession?.hpModifier ?? 0)
  const mpRaw = Math.floor(attributes.pow / MP_DIVISOR)

  return {
    hp: clamp(hpRaw, 1, 30),
    san: clamp(attributes.pow, 0, 99),
    luck: clamp(attributes.pow, 0, 99),
    mp: clamp(mpRaw, 1, 20),
    mov: deriveMoveRate(attributes),
  }
}

/**
 * 评估职业技能公式（如 EDU×2 + APP×2）
 */
export const evaluateSkillFormulas = (attributes: AttributeMap, profession: Profession) => {
  return profession.skillFormulas.reduce((sum, part) => {
    const attributeValue = attributes[part.attribute]
    return sum + attributeValue * part.multiplier
  }, 0)
}

/**
 * 计算职业技能点数
 * 规则：优先使用职业公式（如 EDU×4、EDU×2+DEX×2），否则默认 EDU×2+INT
 */
const calculateSkillPoints = (attributes: AttributeMap, profession?: Profession) => {
  if (profession && profession.skillFormulas.length > 0) {
    return evaluateSkillFormulas(attributes, profession)
  }
  return attributes.edu * 2 + attributes.int
}

/**
 * 计算职业/兴趣技能点预算
 * - 职业：由职业公式（通常是 EDU×2 等）决定
 * - 兴趣：INT × 2
 */
const calculateSkillBudgets = (attributes: AttributeMap, profession?: Profession): SkillBudget => {
  const occupation = calculateSkillPoints(attributes, profession)
  const personal = attributes.int * 2
  return { occupation, personal }
}

/**
 * 构建属性检定阈值（COC7th 规则）
 * - 常规：属性值本身
 * - 困难：属性值 / 2（向下取整）
 * - 极难：属性值 / 5（向下取整）
 */
const buildAttributeThresholds = (attributes: AttributeMap): AttributeThresholds =>
  Object.entries(attributes).reduce<AttributeThresholds>((acc, [key, value]) => {
    const attributeKey = key as keyof AttributeMap
    acc[attributeKey] = {
      regular: value,
      hard: Math.floor(value / 2),
      extreme: Math.floor(value / 5),
    }
    return acc
  }, {} as AttributeThresholds)

/**
 * 解析职业熟练技能（从技能 ID 映射到完整定义）
 */
const resolveSignatureSkills = (profession?: Profession): SkillDefinition[] =>
  profession
    ? profession.signatureSkills
      .map((skillId) => getSkillById(skillId))
      .filter((skill): skill is SkillDefinition => Boolean(skill))
    : []

/**
 * 主计算函数：汇总角色所有计算流程
 * 1. 应用职业属性加成
 * 2. 计算二级属性（HP/SAN/MP/MOV）
 * 3. 计算技能点预算（职业/兴趣）
 * 4. 构建属性检定阈值
 * 5. 解析职业熟练技能
 */
export const calculateCharacter = (
  form: BaseCharacterInput,
  profession?: Profession,
): CalculatedCharacter => {
  const attributesWithFocus = withProfessionFocus(form.attributes, profession)
  const secondaryStats = deriveSecondaryStats(attributesWithFocus, profession)
  const skillBudgets = calculateSkillBudgets(attributesWithFocus, profession)
  const thresholds = buildAttributeThresholds(attributesWithFocus)
  const signatureSkills = resolveSignatureSkills(profession)

  return {
    name: form.name,
    professionId: form.professionId,
    attributes: attributesWithFocus,
    secondaryStats,
    thresholds,
    skillBudgets,
    signatureSkills,
  }
}

