import { useState, useMemo } from 'react'
import type { AttributeMap } from '@schema/character'
import type { FullProfession } from '@data/professions-full'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { Card, StatCard, Button } from './ui'
import styles from './ProfessionRecommendations.module.css'

/**
 * 计算职业的技能点数
 * 支持"或"的情况：取较大值
 */
const calculateProfessionSkillPoints = (
  attributes: AttributeMap,
  profession: FullProfession,
): number => {
  return profession.skillFormulas.reduce((sum, part) => {
    // 如果有可选属性，取所有属性（包括主属性和可选属性）中的最大值
    if (part.alternativeAttributes && part.alternativeAttributes.length > 0) {
      const allAttributes = [part.attribute, ...part.alternativeAttributes]
      const maxValue = Math.max(...allAttributes.map(attr => attributes[attr]))
      return sum + maxValue * part.multiplier
    }
    // 没有可选属性，直接使用主属性
    const attributeValue = attributes[part.attribute]
    return sum + attributeValue * part.multiplier
  }, 0)
}

/**
 * 生成所有可能的公式组合（用于"或"的情况）
 */
const generateFormulaVariants = (
  attributes: AttributeMap,
  profession: FullProfession,
): Array<{ formula: string; total: number }> => {
  const variants: Array<{ formula: string; total: number }> = []

  // 检查是否有"或"的情况
  const hasAlternatives = profession.skillFormulas.some(
    part => part.alternativeAttributes && part.alternativeAttributes.length > 0
  )

  if (!hasAlternatives) {
    // 没有"或"，直接生成一个公式
    const parts = profession.skillFormulas.map((part) => {
      const value = attributes[part.attribute]
      return `${ATTRIBUTE_NAMES[part.attribute]}(${value}) × ${part.multiplier}`
    })
    const total = calculateProfessionSkillPoints(attributes, profession)
    return [{ formula: parts.join(' + '), total }]
  }

  // 有"或"的情况，生成所有可能的组合
  const generateCombinations = (
    parts: typeof profession.skillFormulas,
    index: number,
    currentParts: string[],
    currentTotal: number,
  ): void => {
    if (index >= parts.length) {
      variants.push({ formula: currentParts.join(' + '), total: currentTotal })
      return
    }

    const part = parts[index]
    if (part.alternativeAttributes && part.alternativeAttributes.length > 0) {
      // 有可选属性，为每个选项生成一个分支
      const allAttributes = [part.attribute, ...part.alternativeAttributes]
      for (const attr of allAttributes) {
        const value = attributes[attr]
        const contribution = value * part.multiplier
        generateCombinations(
          parts,
          index + 1,
          [...currentParts, `${ATTRIBUTE_NAMES[attr]}(${value}) × ${part.multiplier}`],
          currentTotal + contribution,
        )
      }
    } else {
      // 没有可选属性，直接添加
      const value = attributes[part.attribute]
      const contribution = value * part.multiplier
      generateCombinations(
        parts,
        index + 1,
        [...currentParts, `${ATTRIBUTE_NAMES[part.attribute]}(${value}) × ${part.multiplier}`],
        currentTotal + contribution,
      )
    }
  }

  generateCombinations(profession.skillFormulas, 0, [], 0)

  // 去重（相同的公式和总值）
  const uniqueVariants = variants.filter(
    (v, i, self) => i === self.findIndex(t => t.formula === v.formula && t.total === v.total)
  )

  return uniqueVariants
}

/**
 * 格式化技能公式为可读字符串，包含属性值
 * 格式：教育(60) × 2 + 力量(80) × 2 = 280
 * 如果有"或"的情况，返回所有可能的组合
 */
const formatSkillFormulaWithValues = (
  attributes: AttributeMap,
  profession: FullProfession,
): string | string[] => {
  const variants = generateFormulaVariants(attributes, profession)

  if (variants.length === 1) {
    return `${variants[0].formula} = ${variants[0].total}`
  }

  // 多个组合，返回所有可能的公式
  return variants.map(v => `${v.formula} = ${v.total}`)
}

type ProfessionRecommendationsProps = {
  attributes: AttributeMap
  professions: FullProfession[]
  onSelect: (professionId: string) => void
}

/**
 * 职业推荐组件
 * 根据属性值计算每个职业的技能点数，推荐前5个技能点最多的职业
 */
const ProfessionRecommendations = ({
  attributes,
  professions,
  onSelect,
}: ProfessionRecommendationsProps) => {
  const [isExpanded, setIsExpanded] = useState(true)

  // 计算每个职业的技能点数并排序
  const recommendedProfessions = useMemo(() => {
    const professionScores = professions.map((profession) => {
      // 计算职业技能点数
      const skillPoints = calculateProfessionSkillPoints(attributes, profession)

      return {
        profession,
        skillPoints,
      }
    })

    // 按技能点数降序排序
    const sorted = professionScores.sort((a, b) => b.skillPoints - a.skillPoints)

    if (sorted.length === 0) {
      return []
    }

    // 获取最高职业点数
    const maxSkillPoints = sorted[0].skillPoints

    // 先选取最大职业点数的所有职业
    const maxScoreProfessions = sorted.filter((item) => item.skillPoints === maxSkillPoints)

    // 如果最大职业点数的职业已经达到或超过6个，返回所有最大职业点数的职业（不限制数量）
    if (maxScoreProfessions.length >= 6) {
      return maxScoreProfessions
    }

    // 如果最大职业点数的职业少于6个，继续按顺序添加，直到够6个
    // 按职业点数分组，确保相同点数的职业一起添加
    const result: typeof sorted = [...maxScoreProfessions]
    let currentIndex = maxScoreProfessions.length

    while (result.length < 6 && currentIndex < sorted.length) {
      const currentScore = sorted[currentIndex].skillPoints

      // 找到所有具有相同职业点数的职业
      const sameScoreGroup: typeof sorted = []
      for (let i = currentIndex; i < sorted.length; i++) {
        if (sorted[i].skillPoints === currentScore) {
          sameScoreGroup.push(sorted[i])
        } else {
          break
        }
      }

      // 添加整个组
      result.push(...sameScoreGroup)
      currentIndex += sameScoreGroup.length

      // 如果已经够6个，停止
      if (result.length >= 6) {
        break
      }
    }

    // 如果超过6个，只取前6个
    return result.slice(0, 6)
  }, [attributes, professions])

  if (recommendedProfessions.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>💡 推荐职业（根据你的属性）</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            {isExpanded ? '收起' : '展开'}
            <span className={styles.toggleIcon}>{isExpanded ? '▲' : '▼'}</span>
          </Button>
        </div>
        {isExpanded && (
          <p className={styles.subtitle}>
            以下职业基于你当前的属性值，将获得最多的职业技能点数
          </p>
        )}
      </div>
      {isExpanded && (
        <div className={styles.recommendations}>
          {recommendedProfessions.map((item, index) => (
            <Card
              key={item.profession.id}
              variant="outlined"
              padding="sm"
              className={styles.recommendationCard}
              onClick={() => onSelect(item.profession.id)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.rank}>#{index + 1}</div>
                <div className={styles.professionInfo}>
                  <h4 className={styles.professionName}>{item.profession.name}</h4>
                  <p className={styles.professionDescription}>
                    {item.profession.description}
                  </p>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.formulaSection}>
                  <div className={styles.formulaLabel}>计算公式：</div>
                  <div className={styles.formulaValue}>
                    {(() => {
                      const formula = formatSkillFormulaWithValues(attributes, item.profession)
                      if (Array.isArray(formula)) {
                        return (
                          <div className={styles.formulaVariants}>
                            {formula.map((f, idx) => (
                              <div key={idx} className={styles.formulaVariant}>
                                {f}
                                {idx === 0 && (
                                  <span className={styles.formulaNote}>（取较大值）</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return formula
                    })()}
                  </div>
                </div>
                <div className={styles.skillPointsSection}>
                  <StatCard
                    label="职业技能点"
                    value={item.skillPoints}
                    variant="highlight"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ProfessionRecommendations

