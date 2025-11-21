/**
 * 骰子工具函数
 * 用于 COC7th 属性生成
 */

/**
 * 投掷单个骰子（1 到 sides）
 */
export const rollDie = (sides: number): number => {
  return Math.floor(Math.random() * sides) + 1
}

/**
 * 投掷多个骰子并求和
 * @param count 骰子数量
 * @param sides 骰子面数
 */
export const rollDice = (count: number, sides: number): number => {
  let sum = 0
  for (let i = 0; i < count; i++) {
    sum += rollDie(sides)
  }
  return sum
}

/**
 * COC7th 属性生成：3d6 × 5
 * 用于：力量、外貌、体质、敏捷、意志
 */
export const roll3d6x5 = (): number => {
  const roll = rollDice(3, 6)
  return roll * 5
}

/**
 * COC7th 属性生成：(2d6 + 6) × 5
 * 用于：体型、智力、教育
 */
export const roll2d6Plus6x5 = (): number => {
  const roll = rollDice(2, 6) + 6
  return roll * 5
}

