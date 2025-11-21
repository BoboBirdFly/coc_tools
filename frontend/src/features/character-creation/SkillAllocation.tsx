import { useState, useMemo } from 'react'
import type { AttributeMap, SkillAllocation, SkillBudget, Profession } from '@schema/character'
import { SKILL_CATEGORY_NAMES } from '@data/i18n'
import {
  calculateSkillInitialValue,
  calculateSkillCurrentValue,
  validateSkillAllocation,
  calculateUsedSkillPoints,
  getOccupationSkillList,
  getPersonalSkillList,
  canAllocateSkillPoints,
  getSkillMaxValue,
} from '@services/skillAllocation'
import { Card, PageHeader, Button, StatCard, NumberInput } from '@components/ui'
import styles from './SkillAllocation.module.css'

type SkillAllocationProps = {
  attributes: AttributeMap
  profession: Profession
  skillBudgets: SkillBudget
  onComplete: (allocation: SkillAllocation) => void
  onBack: () => void
}

type AllocationType = 'occupation' | 'personal'

/**
 * 技能点分配组件
 * 区分职业技能点和兴趣技能点，处理特殊技能规则
 */
const SkillAllocationComponent = ({
  attributes,
  profession,
  skillBudgets,
  onComplete,
  onBack,
}: SkillAllocationProps) => {
  const [allocationType, setAllocationType] = useState<AllocationType>('occupation')
  const [allocation, setAllocation] = useState<SkillAllocation>({})

  // 获取技能列表
  const occupationSkills = useMemo(() => {
    const skills = getOccupationSkillList(profession)
    // 调试：检查技能列表
    if (skills.length === 0 && profession.signatureSkills.length > 0) {
      console.warn('职业技能列表为空，但职业有熟练技能:', {
        profession: profession.name,
        signatureSkills: profession.signatureSkills,
        mappedSkills: skills,
      })
    }
    return skills
  }, [profession])
  const personalSkills = useMemo(() => getPersonalSkillList(profession), [profession])

  // 计算已使用的点数
  const usedOccupation = useMemo(
    () => calculateUsedSkillPoints(allocation, 'occupation', profession),
    [allocation, profession],
  )
  const usedPersonal = useMemo(
    () => calculateUsedSkillPoints(allocation, 'personal', profession),
    [allocation, profession],
  )

  // 剩余点数
  const remainingOccupation = skillBudgets.occupation - usedOccupation
  const remainingPersonal = skillBudgets.personal - usedPersonal

  // 当前类型的剩余点数
  const remainingPoints =
    allocationType === 'occupation' ? remainingOccupation : remainingPersonal

  // 当前可用的技能列表
  const currentSkills =
    allocationType === 'occupation' ? occupationSkills : personalSkills

  // 按分类分组技能
  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, typeof currentSkills> = {}
    currentSkills.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = []
      }
      grouped[skill.category].push(skill)
    })
    return grouped
  }, [currentSkills])

  // 调整技能点数
  const adjustSkillPoints = (skillId: string, delta: number) => {
    const currentPoints = allocation[skillId] || 0
    const newPoints = Math.max(0, currentPoints + delta)

    // 验证
    const validation = validateSkillAllocation(
      skillId,
      newPoints,
      attributes,
      allocation,
      profession,
    )

    if (!validation.valid) {
      // 可以显示错误提示，这里先简单处理
      return
    }

    // 检查点数限制
    if (allocationType === 'occupation') {
      if (delta > 0 && remainingOccupation < delta) return
    } else {
      if (delta > 0 && remainingPersonal < delta) return
    }

    setAllocation((prev) => ({
      ...prev,
      [skillId]: newPoints,
    }))
  }

  // 完成分配
  const handleComplete = () => {
    if (remainingOccupation === 0 && remainingPersonal === 0) {
      onComplete(allocation)
    }
  }

  // 是否可以完成
  const canComplete = remainingOccupation === 0 && remainingPersonal === 0

  return (
    <Card variant="default" padding="md" className={styles.container}>
      <PageHeader title="分配技能" onBack={onBack} />

      <div className={styles.content}>
        {/* 技能点预算显示 */}
        <div className={styles.budgetSection}>
          <div className={styles.budgetCards}>
            <StatCard
              label="职业技能点"
              value={`${usedOccupation} / ${skillBudgets.occupation}`}
              variant={remainingOccupation === 0 ? 'highlight' : 'default'}
            />
            <StatCard
              label="兴趣技能点"
              value={`${usedPersonal} / ${skillBudgets.personal}`}
              variant={remainingPersonal === 0 ? 'highlight' : 'default'}
            />
          </div>
          {remainingOccupation < 0 || remainingPersonal < 0 ? (
            <div className={styles.errorMessage}>
              ⚠️ 技能点分配超出预算，请减少部分技能的点数
            </div>
          ) : null}
        </div>

        {/* 分配类型切换 */}
        <div className={styles.typeSelector}>
          <Button
            variant={allocationType === 'occupation' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAllocationType('occupation')}
          >
            职业技能点 ({remainingOccupation >= 0 ? remainingOccupation : 0} 剩余)
          </Button>
          <Button
            variant={allocationType === 'personal' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setAllocationType('personal')}
          >
            兴趣技能点 ({remainingPersonal >= 0 ? remainingPersonal : 0} 剩余)
          </Button>
        </div>

        {/* 技能列表 */}
        <div className={styles.skillsSection}>
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category} className={styles.categoryGroup}>
              <h3 className={styles.categoryTitle}>
                {SKILL_CATEGORY_NAMES[category as keyof typeof SKILL_CATEGORY_NAMES]}
              </h3>
              <div className={styles.skillsList}>
                {skills.map((skill) => {
                  const initialValue = calculateSkillInitialValue(skill.id, attributes)
                  const currentValue = calculateSkillCurrentValue(
                    skill.id,
                    attributes,
                    allocation,
                  )
                  const allocatedPoints = allocation[skill.id] || 0
                  const maxValue = getSkillMaxValue(skill.id, profession)
                  const canIncrease =
                    canAllocateSkillPoints(skill.id) &&
                    currentValue < maxValue &&
                    remainingPoints > 0
                  const canDecrease = allocatedPoints > 0

                  return (
                    <Card
                      key={skill.id}
                      variant="outlined"
                      padding="sm"
                      className={styles.skillCard}
                    >
                      <div className={styles.skillHeader}>
                        <div className={styles.skillInfo}>
                          <h4 className={styles.skillName}>{skill.name}</h4>
                          <span className={styles.skillBase}>
                            基础 {initialValue}
                            {profession.signatureSkills.includes(skill.id) && (
                              <span className={styles.signatureBadge}>职业</span>
                            )}
                          </span>
                        </div>
                        <div className={styles.skillValue}>
                          <span className={styles.currentValue}>{currentValue}</span>
                          <span className={styles.maxValue}>/ {maxValue}</span>
                        </div>
                      </div>

                      {canAllocateSkillPoints(skill.id) ? (
                        <div className={styles.skillControls}>
                          <div className={styles.controlGroup}>
                            <NumberInput
                              value={allocatedPoints}
                              min={0}
                              max={maxValue - initialValue}
                              step={1}
                              readOnly
                              onIncrement={() => adjustSkillPoints(skill.id, 1)}
                              onDecrement={() => adjustSkillPoints(skill.id, -1)}
                              canIncrement={canIncrease}
                              canDecrement={canDecrease}
                            />
                            <div className={styles.quickButtons}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustSkillPoints(skill.id, -5)}
                                disabled={!canDecrease || allocatedPoints < 5}
                                className={styles.quickButton}
                                aria-label="减少5点"
                              >
                                -5
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => adjustSkillPoints(skill.id, 5)}
                                disabled={!canIncrease || remainingPoints < 5 || currentValue + 5 > maxValue}
                                className={styles.quickButton}
                                aria-label="增加5点"
                              >
                                +5
                              </Button>
                            </div>
                          </div>
                          <span className={styles.pointsLabel}>
                            {allocatedPoints > 0 ? `+${allocatedPoints}` : '0'} 点
                          </span>
                        </div>
                      ) : (
                        <div className={styles.skillNote}>
                          <span className={styles.disabledNote}>
                            该技能不能分配点数
                          </span>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 完成按钮 */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleComplete}
            disabled={!canComplete}
            fullWidth
          >
            {canComplete
              ? '完成分配 →'
              : `还需分配 ${Math.abs(remainingOccupation + remainingPersonal)} 点`}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default SkillAllocationComponent

