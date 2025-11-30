import { useEffect, useMemo, useReducer } from 'react'
import { FALLBACK_ATTRIBUTES, STORAGE_KEYS } from '@data/constants'
import { UI_TEXT } from '@data/i18n'
import { FULL_PROFESSIONS } from '@data/professions-full'
import { calculateCharacter } from '@services/calculator'
import type { BaseCharacterInput, CalculatedCharacter, Profession } from '@schema/character'
import { getLocalStorageItem, setLocalStorageItem } from '@utils/storage'

// 状态管理类型定义
type BuilderState = {
  form: BaseCharacterInput
  calculated: CalculatedCharacter
}

// Reducer 动作类型（用户操作 -> 状态变更）
type BuilderAction =
  | { type: 'load-character'; payload: BaseCharacterInput } // 加载角色（从 localStorage 恢复或从列表选择）
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
  const profession = FULL_PROFESSIONS.find((item) => item.id === form.professionId) as Profession | undefined
  return calculateCharacter(form, profession)
}

/**
 * 检查属性是否为空对象
 */
const isEmptyAttributes = (attrs: BaseCharacterInput['attributes']): boolean => {
  return !attrs || Object.keys(attrs).length === 0
}

/**
 * 初始化状态：优先从 localStorage 恢复，否则使用空值
 */
const makeInitialState = (): BuilderState => {
  const saved = getLocalStorageItem<BaseCharacterInput>(STORAGE_KEY)
  const form: BaseCharacterInput = saved
    ? {
        ...saved,
      // 如果保存的数据有属性，使用保存的属性；否则为空对象
      attributes: saved.attributes && !isEmptyAttributes(saved.attributes)
        ? saved.attributes
        : ({} as BaseCharacterInput['attributes']),
      // 保留技能分配
      skills: saved.skills || {},
      // 保留可选技能选择
      optionalSkills: saved.optionalSkills,
      }
    : {
      name: UI_TEXT.defaultCharacterName,
      professionId: FULL_PROFESSIONS[0].id,
      attributes: {} as BaseCharacterInput['attributes'],
      skills: {},
      }

  // 如果属性为空，计算时使用兜底值（仅用于计算，不保存到form）
  const formForCalculation: BaseCharacterInput = {
    ...form,
    attributes: !isEmptyAttributes(form.attributes)
      ? form.attributes
      : FALLBACK_ATTRIBUTES,
  }

  return {
    form,
    calculated: buildCalculated(formForCalculation),
  }
}

/**
 * Reducer：处理状态变更
 * 每次表单更新后自动重新计算角色属性
 */
const reducer = (state: BuilderState, action: BuilderAction): BuilderState => {
  switch (action.type) {
    case 'load-character': {
      // 加载角色（从 localStorage 恢复或从列表选择）
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
      loadCharacter: (character: BaseCharacterInput) =>
        dispatch({ type: 'load-character', payload: character }),
    }),
    [],
  )

  // 当前职业信息（缓存计算结果）
  const profession = useMemo(
    () => FULL_PROFESSIONS.find((item) => item.id === state.form.professionId) as Profession | undefined,
    [state.form.professionId],
  )

  return {
    form: state.form,
    calculated: state.calculated,
    profession,
    actions,
  }
}

