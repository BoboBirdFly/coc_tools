import { useMemo } from 'react'
import type { AttributeMap } from '@schema/character'
import type { FullProfession } from '@data/professions-full'
import { Card, StatCard } from './ui'
import styles from './ProfessionRecommendations.module.css'

/**
 * 计算职业的技能点数
 */
const calculateProfessionSkillPoints = (
  attributes: AttributeMap,
  profession: FullProfession,
): number => {
  return profession.skillFormulas.reduce((sum, part) => {
    const attributeValue = attributes[part.attribute]
    return sum + attributeValue * part.multiplier
  }, 0)
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

    // 按技能点数降序排序，取前5个
    return professionScores
      .sort((a, b) => b.skillPoints - a.skillPoints)
      .slice(0, 5)
  }, [attributes, professions])

  if (recommendedProfessions.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>💡 推荐职业（根据你的属性）</h3>
      <p className={styles.subtitle}>
        以下职业基于你当前的属性值，将获得最多的职业技能点数
      </p>
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
              <StatCard
                label="职业技能点"
                value={item.skillPoints}
                variant="highlight"
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ProfessionRecommendations

