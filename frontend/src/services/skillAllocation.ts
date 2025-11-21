import { SKILLS } from '@data/skills'
import type { AttributeMap, SkillAllocation, SkillDefinition, Profession } from '@schema/character'
import { getSkillById } from '@data/skills'

// 特殊技能ID
export const SPECIAL_SKILLS = {
  DODGE: 'dodge', // 闪避：初始值 = DEX/2
  LANGUAGE_NATIVE: 'language-native', // 母语：初始值 = EDU
  CTHULHU_MYTHOS: 'cthulhu-mythos', // 克苏鲁神话：不能分配点数
} as const

// 技能最大值限制
export const SKILL_MAX_VALUES = {
  SIGNATURE_SKILL: 80, // 职业职业技能最大80
  NORMAL_SKILL: 50, // 普通技能最大50
} as const

/**
 * 计算技能的初始值
 * 特殊技能需要根据属性计算
 */
export const calculateSkillInitialValue = (
  skillId: string,
  attributes: AttributeMap,
): number => {
  const skill = getSkillById(skillId)
  if (!skill) return 0

  // 闪避：DEX/2
  if (skillId === SPECIAL_SKILLS.DODGE) {
    return Math.floor(attributes.dex / 2)
  }

  // 母语：EDU
  if (skillId === SPECIAL_SKILLS.LANGUAGE_NATIVE) {
    return attributes.edu
  }

  // 其他技能使用base值
  return skill.base
}

/**
 * 计算技能的当前值（初始值 + 分配的点数）
 */
export const calculateSkillCurrentValue = (
  skillId: string,
  attributes: AttributeMap,
  allocation: SkillAllocation,
): number => {
  const initial = calculateSkillInitialValue(skillId, attributes)
  const allocated = allocation[skillId] || 0
  return initial + allocated
}

/**
 * 检查技能是否可以分配点数
 */
export const canAllocateSkillPoints = (skillId: string): boolean => {
  // 克苏鲁神话不能分配点数
  return skillId !== SPECIAL_SKILLS.CTHULHU_MYTHOS
}

/**
 * 获取技能的最大值
 */
export const getSkillMaxValue = (
  skillId: string,
  profession?: Profession,
): number => {
  // 职业职业技能最大80
  if (profession?.signatureSkills.includes(skillId)) {
    return SKILL_MAX_VALUES.SIGNATURE_SKILL
  }
  // 普通技能最大50
  return SKILL_MAX_VALUES.NORMAL_SKILL
}

/**
 * 检查技能点分配是否有效
 */
export const validateSkillAllocation = (
  skillId: string,
  points: number,
  attributes: AttributeMap,
  allocation: SkillAllocation,
  profession?: Profession,
): { valid: boolean; error?: string } => {
  // 检查是否可以分配
  if (!canAllocateSkillPoints(skillId)) {
    return { valid: false, error: '该技能不能分配点数' }
  }

  // 计算当前值
  const currentValue = calculateSkillCurrentValue(skillId, attributes, {
    ...allocation,
    [skillId]: points,
  })

  // 检查最大值
  const maxValue = getSkillMaxValue(skillId, profession)
  if (currentValue > maxValue) {
    return { valid: false, error: `该技能最大值不能超过 ${maxValue}` }
  }

  // 检查最小值（不能小于0）
  if (points < 0) {
    return { valid: false, error: '分配点数不能为负数' }
  }

  return { valid: true }
}

/**
 * 计算已使用的技能点
 */
export const calculateUsedSkillPoints = (
  allocation: SkillAllocation,
  type: 'occupation' | 'personal',
  profession?: Profession,
): number => {
  let used = 0

  for (const [skillId, points] of Object.entries(allocation)) {
    if (points <= 0) continue

    const skill = getSkillById(skillId)
    if (!skill) continue

    // 判断技能点类型
    const isSignatureSkill = profession?.signatureSkills.includes(skillId) ?? false

    if (type === 'occupation') {
      // 职业技能点只能分配给职业职业技能
      if (isSignatureSkill) {
        used += points
      }
    } else {
      // 兴趣技能点可以分配给所有技能（除了职业职业技能）
      if (!isSignatureSkill) {
        used += points
      }
    }
  }

  return used
}

/**
 * 获取可以分配职业技能点的技能列表
 */
export const getOccupationSkillList = (profession?: Profession): SkillDefinition[] => {
  if (!profession) return []
  return profession.signatureSkills
    .map((skillId) => getSkillById(skillId))
    .filter((skill): skill is SkillDefinition => Boolean(skill))
}

/**
 * 获取可以分配兴趣技能点的技能列表
 */
export const getPersonalSkillList = (profession?: Profession): SkillDefinition[] => {
  const signatureSkillIds = new Set(profession?.signatureSkills ?? [])
  return SKILLS.filter(
    (skill) =>
      !signatureSkillIds.has(skill.id) && canAllocateSkillPoints(skill.id),
  )
}

