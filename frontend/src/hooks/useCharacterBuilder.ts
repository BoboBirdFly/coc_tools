import { useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_ATTRIBUTES, STORAGE_KEYS } from '@data/constants'
import { UI_TEXT } from '@data/i18n'
import { PROFESSIONS } from '@data/professions'
import { calculateCharacter } from '@services/calculator'
import type { BaseCharacterInput, CalculatedCharacter } from '@schema/character'
import { getLocalStorageItem, setLocalStorageItem } from '@utils/storage'

// 状态管理类型定义
type BuilderState = {
  form: BaseCharacterInput
  calculated: CalculatedCharacter
}

// Reducer 动作类型（用户操作 -> 状态变更）
type BuilderAction =
  | { type: 'hydrate'; payload: BaseCharacterInput } // 从 localStorage 恢复
  | { type: 'update'; payload: Partial<BaseCharacterInput> } // 更新表单字段
  | {
      type: 'update-attribute'
      payload: { key: keyof BaseCharacterInput['attributes']; value: number }
  } // 更新单个属性值

// 使用公共配置的存储键名
const STORAGE_KEY = STORAGE_KEYS.characterBuilder

/**
 * 根据表单数据计算角色属性（调用 calculator 服务）
 */
const buildCalculated = (form: BaseCharacterInput): CalculatedCharacter => {
  const profession = PROFESSIONS.find((item) => item.id === form.professionId)
  return calculateCharacter(form, profession)
}

/**
 * 初始化状态：优先从 localStorage 恢复，否则使用默认值
 */
const makeInitialState = (): BuilderState => {
  const saved = getLocalStorageItem<BaseCharacterInput>(STORAGE_KEY)
  const form: BaseCharacterInput = saved
    ? {
        ...saved,
      // 确保所有属性都有值（合并默认值）
        attributes: { ...DEFAULT_ATTRIBUTES, ...saved.attributes },
      }
    : {
      name: UI_TEXT.defaultCharacterName,
        professionId: PROFESSIONS[0].id,
        attributes: { ...DEFAULT_ATTRIBUTES },
      }
  return {
    form,
    calculated: buildCalculated(form),
  }
}

/**
 * Reducer：处理状态变更
 * 每次表单更新后自动重新计算角色属性
 */
const reducer = (state: BuilderState, action: BuilderAction): BuilderState => {
  switch (action.type) {
    case 'hydrate': {
      // 从 localStorage 恢复完整状态
      const nextCalculated = buildCalculated(action.payload)
      return { form: action.payload, calculated: nextCalculated }
    }
    case 'update': {
      // 更新表单字段（如名称、职业）
      const nextForm = { ...state.form, ...action.payload }
      return { form: nextForm, calculated: buildCalculated(nextForm) }
    }
    case 'update-attribute': {
      // 更新单个属性值（如 STR、CON）
      const nextAttributes = {
        ...state.form.attributes,
        [action.payload.key]: action.payload.value,
      }
      const nextForm: BaseCharacterInput = { ...state.form, attributes: nextAttributes }
      return { form: nextForm, calculated: buildCalculated(nextForm) }
    }
    default:
      return state
  }
}

/**
 * 角色构建器 Hook
 * - 使用 useReducer 管理状态
 * - 自动持久化到 localStorage
 * - 提供 actions 供组件调用
 */
export const useCharacterBuilder = () => {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  // 自动保存到 localStorage（表单变化时触发）
  useEffect(() => {
    setLocalStorageItem(STORAGE_KEY, state.form)
  }, [state.form])

  // 动作函数（稳定引用，避免子组件重复渲染）
  const actions = useMemo(
    () => ({
      updateForm: (payload: Partial<BaseCharacterInput>) =>
        dispatch({ type: 'update', payload }),
      updateAttribute: (
        key: keyof BaseCharacterInput['attributes'],
        value: number,
      ) => dispatch({ type: 'update-attribute', payload: { key, value } }),
    }),
    [],
  )

  // 当前职业信息（缓存计算结果）
  const profession = useMemo(
    () => PROFESSIONS.find((item) => item.id === state.form.professionId),
    [state.form.professionId],
  )

  return {
    form: state.form,
    calculated: state.calculated,
    profession,
    actions,
  }
}

