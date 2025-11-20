import { useEffect, useMemo, useReducer } from 'react'
import { DEFAULT_ATTRIBUTES } from '@data/constants'
import { PROFESSIONS } from '@data/professions'
import { calculateCharacter } from '@services/calculator'
import type { BaseCharacterInput, CalculatedCharacter } from '@schema/character'
import { getLocalStorageItem, setLocalStorageItem } from '@utils/storage'

type BuilderState = {
  form: BaseCharacterInput
  calculated: CalculatedCharacter
}

type BuilderAction =
  | { type: 'hydrate'; payload: BaseCharacterInput }
  | { type: 'update'; payload: Partial<BaseCharacterInput> }
  | {
      type: 'update-attribute'
      payload: { key: keyof BaseCharacterInput['attributes']; value: number }
    }

const STORAGE_KEY = 'coc-character-builder'

const buildCalculated = (form: BaseCharacterInput): CalculatedCharacter => {
  const profession = PROFESSIONS.find((item) => item.id === form.professionId)
  return calculateCharacter(form, profession)
}

const makeInitialState = (): BuilderState => {
  const saved = getLocalStorageItem<BaseCharacterInput>(STORAGE_KEY)
  const form: BaseCharacterInput = saved
    ? {
        ...saved,
        attributes: { ...DEFAULT_ATTRIBUTES, ...saved.attributes },
      }
    : {
        name: '未命名调查员',
        professionId: PROFESSIONS[0].id,
        attributes: { ...DEFAULT_ATTRIBUTES },
      }
  return {
    form,
    calculated: buildCalculated(form),
  }
}

const reducer = (state: BuilderState, action: BuilderAction): BuilderState => {
  switch (action.type) {
    case 'hydrate': {
      const nextCalculated = buildCalculated(action.payload)
      return { form: action.payload, calculated: nextCalculated }
    }
    case 'update': {
      const nextForm = { ...state.form, ...action.payload }
      return { form: nextForm, calculated: buildCalculated(nextForm) }
    }
    case 'update-attribute': {
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

export const useCharacterBuilder = () => {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  useEffect(() => {
    setLocalStorageItem(STORAGE_KEY, state.form)
  }, [state.form])

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

