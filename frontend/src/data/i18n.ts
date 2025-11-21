import type { AttributeKey, SkillCategory } from '@schema/character'

/**
 * 国际化配置
 * 统一管理所有中文翻译、英文缩写映射
 */

// 属性中文名称映射（COC7th 标准术语）
export const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  str: '力量',
  con: '体质',
  dex: '敏捷',
  int: '智力',
  pow: '意志',
  siz: '体型',
  app: '外貌',
  edu: '教育',
}

// 属性中文名称到英文键的反向映射（用于解析技能公式等场景）
export const ATTRIBUTE_NAME_TO_KEY: Record<string, AttributeKey> = Object.entries(
  ATTRIBUTE_NAMES,
).reduce(
  (acc, [key, name]) => {
    acc[name] = key as AttributeKey
    return acc
  },
  {} as Record<string, AttributeKey>,
)

// 属性英文缩写映射
export const ATTRIBUTE_ABBREVIATIONS: Record<AttributeKey, string> = {
  str: 'STR',
  con: 'CON',
  dex: 'DEX',
  int: 'INT',
  pow: 'POW',
  siz: 'SIZ',
  app: 'APP',
  edu: 'EDU',
}

// 二级属性中文名称映射
export const SECONDARY_NAMES: Record<string, string> = {
  hp: '生命值',
  san: '理智值',
  luck: '幸运',
  mp: '魔法值',
  mov: '移动力',
}

// 二级属性英文缩写映射
export const SECONDARY_ABBREVIATIONS: Record<string, string> = {
  hp: 'HP',
  san: 'SAN',
  luck: 'LUCK',
  mp: 'MP',
  mov: 'MOV',
}

// 技能类别中文名称（与类型定义保持一致）
export const SKILL_CATEGORY_NAMES: Record<SkillCategory, string> = {
  学识: '学识',
  社交: '社交',
  调查: '调查',
  战斗: '战斗',
  生存: '生存',
  技艺: '技艺',
  医疗: '医疗',
}

// UI 文本常量
export const UI_TEXT = {
  defaultCharacterName: '未命名调查员',
  defaultExportFileName: '角色卡',
  exportButtonTitle: '导出角色卡为 JSON（供备份）',
  exportButtonLabel: '导出 JSON',
  attributeInputLabel: '基础属性（范围：15-90，每次调整 5）',
  skillPointsOccupation: '按 COC7th 职业配点',
  skillPointsPersonal: 'INT × 2',
} as const

