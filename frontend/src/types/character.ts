export type AttributeKey = 'str' | 'con' | 'dex' | 'int' | 'pow' | 'siz' | 'app' | 'edu'

export type AttributeMap = Record<AttributeKey, number>

export type SecondaryStatKey = 'hp' | 'san' | 'luck' | 'mp'

export type SecondaryStats = Record<SecondaryStatKey, number>

export interface Profession {
  id: string
  name: string
  description: string
  signatureSkills: string[]
  attributeFocus: Partial<Record<AttributeKey, number>>
  hpModifier: number
}

export interface BaseCharacterInput {
  name: string
  professionId: string
  attributes: AttributeMap
}

export interface CalculatedCharacter {
  name: string
  professionId: string
  attributes: AttributeMap
  secondaryStats: SecondaryStats
  skillPoints: number
}

