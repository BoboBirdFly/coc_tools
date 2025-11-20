import type {
  AttributeMap,
  BaseCharacterInput,
  CalculatedCharacter,
  Profession,
  SecondaryStats,
} from '@schema/character'

const SECONDARY_MULTIPLIERS: Record<keyof SecondaryStats, number> = {
  hp: 0.5,
  san: 1,
  luck: 1,
  mp: 1,
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const withProfessionFocus = (
  attributes: AttributeMap,
  profession?: Profession,
): AttributeMap => {
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

const deriveSecondaryStats = (attributes: AttributeMap, profession?: Profession): SecondaryStats => {
  const hpBase = (attributes.con + attributes.siz) / 10 + (profession?.hpModifier ?? 0)
  const sanBase = attributes.pow
  const luckBase = attributes.pow
  const mpBase = attributes.pow / 5

  return {
    hp: Math.round(hpBase * SECONDARY_MULTIPLIERS.hp),
    san: Math.round(sanBase * SECONDARY_MULTIPLIERS.san),
    luck: Math.round(luckBase * SECONDARY_MULTIPLIERS.luck),
    mp: Math.round(mpBase * SECONDARY_MULTIPLIERS.mp),
  }
}

const calculateSkillPoints = (attributes: AttributeMap, profession?: Profession) => {
  const edu = attributes.edu
  const int = attributes.int
  const base = edu * 2 + int
  const focusBonus = profession
    ? Object.values(profession.attributeFocus).reduce(
        (sum, bonus) => sum + (bonus ?? 0),
        0,
      )
    : 0
  return base + focusBonus
}

export const calculateCharacter = (
  form: BaseCharacterInput,
  profession?: Profession,
): CalculatedCharacter => {
  const attributesWithFocus = withProfessionFocus(form.attributes, profession)
  const secondaryStats = deriveSecondaryStats(attributesWithFocus, profession)
  const skillPoints = calculateSkillPoints(attributesWithFocus, profession)

  return {
    name: form.name,
    professionId: form.professionId,
    attributes: attributesWithFocus,
    secondaryStats,
    skillPoints,
  }
}

