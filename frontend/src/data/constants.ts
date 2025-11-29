import type { AttributeMap } from '@schema/character'

/**
 * 常量配置
 * 统一管理数值常量、验证规则、存储键名等
 */

// 兜底属性值（用于计算，当属性为空时使用）
export const FALLBACK_ATTRIBUTES: AttributeMap = {
  str: 0,
  con: 0,
  dex: 0,
  int: 0,
  pow: 0,
  siz: 0,
  app: 0,
  edu: 0,
}

// 属性验证规则（COC7th 规则）
export const ATTRIBUTE_RULES = {
  min: 30,
  max: 90,
  step: 5,
} as const

// localStorage 存储键名
export const STORAGE_KEYS = {
  characterBuilder: 'coc-character-builder',
  characterList: 'coc-character-list',
  creationTempData: 'coc-creation-temp-data', // 车卡过程中的临时数据（如larry版状态）
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

