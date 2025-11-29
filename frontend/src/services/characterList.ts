import type { Character, BaseCharacterInput } from '@schema/character'
import { STORAGE_KEYS } from '@data/constants'
import { getLocalStorageItem, setLocalStorageItem } from '@utils/storage'

/**
 * 角色列表管理服务
 * 提供角色列表的 CRUD 操作
 */

/**
 * 获取所有角色列表（按更新时间倒序）
 */
export const getCharacterList = (): Character[] => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList) || []
  // 按更新时间倒序排列
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * 根据 ID 获取角色
 */
export const getCharacterById = (id: string): Character | null => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList) || []
  return list.find((c) => c.id === id) || null
}

/**
 * 保存角色到列表（创建新角色）
 */
export const saveCharacter = (characterData: BaseCharacterInput): Character => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList) || []
  const now = Date.now()

  const character: Character = {
    ...characterData,
    id: `char-${now}`,
    createdAt: now,
    updatedAt: now,
  }

  list.push(character)
  setLocalStorageItem(STORAGE_KEYS.characterList, list)
  return character
}

/**
 * 更新角色（如果存在）
 */
export const updateCharacter = (id: string, characterData: BaseCharacterInput): boolean => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList) || []
  const index = list.findIndex((c) => c.id === id)

  if (index >= 0) {
    const existing = list[index]
    list[index] = {
      ...existing,
      ...characterData,
      updatedAt: Date.now(),
    }
    setLocalStorageItem(STORAGE_KEYS.characterList, list)
    return true
  }

  return false
}

/**
 * 删除角色
 */
export const deleteCharacter = (id: string): boolean => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList) || []
  const filtered = list.filter((c) => c.id !== id)

  if (filtered.length !== list.length) {
    setLocalStorageItem(STORAGE_KEYS.characterList, filtered)
    return true
  }

  return false
}

/**
 * 检查是否有角色列表
 */
export const hasCharacterList = (): boolean => {
  const list = getLocalStorageItem<Character[]>(STORAGE_KEYS.characterList)
  return list !== null && Array.isArray(list) && list.length > 0
}

