import type { AttributeMap } from '@schema/character'

/**
 * 常量配置
 * 统一管理数值常量、验证规则、存储键名等
 */

// 默认属性值
export const DEFAULT_ATTRIBUTES: AttributeMap = {
  str: 60,
  con: 55,
  dex: 50,
  int: 60,
  pow: 50,
  siz: 60,
  app: 50,
  edu: 65,
}

// 属性验证规则（COC7th 规则）
export const ATTRIBUTE_RULES = {
  min: 15,
  max: 90,
  step: 5,
} as const

// localStorage 存储键名
export const STORAGE_KEYS = {
  characterBuilder: 'coc-character-builder',
} as const

// 导出文件配置
export const EXPORT_CONFIG = {
  defaultFileName: '角色卡',
  fileExtension: '.json',
} as const

// 计算服务常量（COC7th 规则）
export const CALCULATION_CONSTANTS = {
  HP_DIVISOR: 10, // HP = (CON + SIZ) / 10
  MP_DIVISOR: 5, // MP = POW / 5
  MOV_BASE: 7, // 基础移动力
} as const

