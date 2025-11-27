import { useState, useMemo } from 'react'
import type { AttributeMap, SkillAllocation, SkillBudget, Profession } from '@schema/character'
import { SKILL_CATEGORY_NAMES } from '@data/i18n'
import {
  calculateSkillInitialValue,
  calculateSkillCurrentValue,
  validateSkillAllocation,
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
  // 分开跟踪职业点和兴趣点的分配（用于信用评级等两边都能加的技能）
  const [occAllocation, setOccAllocation] = useState<SkillAllocation>({})
  const [perAllocation, setPerAllocation] = useState<SkillAllocation>({})

  // 合并后的分配（用于显示和最终提交）
  const allocation: SkillAllocation = {}
  for (const skillId of new Set([...Object.keys(occAllocation), ...Object.keys(perAllocation)])) {
    allocation[skillId] = (occAllocation[skillId] || 0) + (perAllocation[skillId] || 0)
  }

  // 获取技能列表
  const occupationSkills = useMemo(() => {
    const skills = getOccupationSkillList(profession)
    // 调试：检查技能列表
    if (skills.length === 0 && profession.signatureSkills.length > 0) {
      console.warn('职业技能列表为空，但职业有职业技能:', {
        profession: profession.name,
        signatureSkills: profession.signatureSkills,
        mappedSkills: skills,
      })
    }
    return skills
  }, [profession])
  const personalSkills = useMemo(() => getPersonalSkillList(profession), [profession])

  // 计算已使用的点数（直接从各自的分配中累加）
  const usedOccupation = useMemo(
    () => Object.values(occAllocation).reduce((sum, v) => sum + v, 0),
    [occAllocation],
  )
  const usedPersonal = useMemo(
    () => Object.values(perAllocation).reduce((sum, v) => sum + v, 0),
    [perAllocation],
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
    const currentAlloc = allocationType === 'occupation' ? occAllocation : perAllocation
    const setCurrentAlloc = allocationType === 'occupation' ? setOccAllocation : setPerAllocation

    const currentTypePoints = currentAlloc[skillId] || 0
    const newTypePoints = Math.max(0, currentTypePoints + delta)

    // 计算总分配点数
    const otherAlloc = allocationType === 'occupation' ? perAllocation : occAllocation
    const totalNewPoints = newTypePoints + (otherAlloc[skillId] || 0)

    // 验证
    const validation = validateSkillAllocation(
      skillId,
      totalNewPoints,
      attributes,
      allocation,
      profession,
    )

    if (!validation.valid) {
      return
    }

    // 检查点数限制
    if (allocationType === 'occupation') {
      if (delta > 0 && remainingOccupation < delta) return
    } else {
      if (delta > 0 && remainingPersonal < delta) return
    }

    setCurrentAlloc((prev) => ({
      ...prev,
      [skillId]: newTypePoints,
    }))
  }

  // 随机分配技能点
  const handleRandomAllocate = () => {
    const newOccAllocation: SkillAllocation = {}
    const newPerAllocation: SkillAllocation = {}

    // 用于计算总分配（信用评级两边都能加）
    const getTotalAllocated = (skillId: string) =>
      (newOccAllocation[skillId] || 0) + (newPerAllocation[skillId] || 0)

    // 随机分配职业技能点
    let remainingOcc = skillBudgets.occupation
    const occSkillIds = occupationSkills
      .filter((s) => canAllocateSkillPoints(s.id))
      .map((s) => s.id)

    while (remainingOcc >= 5 && occSkillIds.length > 0) {
      const randomIndex = Math.floor(Math.random() * occSkillIds.length)
      const skillId = occSkillIds[randomIndex]

      const initial = calculateSkillInitialValue(skillId, attributes)
      const current = initial + getTotalAllocated(skillId)
      const max = getSkillMaxValue(skillId, profession)

      if (current + 5 <= max) {
        newOccAllocation[skillId] = (newOccAllocation[skillId] || 0) + 5
        remainingOcc -= 5
      } else {
        occSkillIds.splice(randomIndex, 1)
      }
    }

    // 随机分配兴趣技能点
    let remainingPer = skillBudgets.personal
    const perSkillIds = personalSkills
      .filter((s) => canAllocateSkillPoints(s.id))
      .map((s) => s.id)

    while (remainingPer >= 5 && perSkillIds.length > 0) {
      const randomIndex = Math.floor(Math.random() * perSkillIds.length)
      const skillId = perSkillIds[randomIndex]

      const initial = calculateSkillInitialValue(skillId, attributes)
      const current = initial + getTotalAllocated(skillId)
      const max = getSkillMaxValue(skillId, profession)

      if (current + 5 <= max) {
        newPerAllocation[skillId] = (newPerAllocation[skillId] || 0) + 5
        remainingPer -= 5
      } else {
        perSkillIds.splice(randomIndex, 1)
      }
    }

    setOccAllocation(newOccAllocation)
    setPerAllocation(newPerAllocation)
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomAllocate}
          >
            🎲 随机分配
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
                  // 当前类型的分配点数
                  const currentTypeAlloc = allocationType === 'occupation' ? occAllocation : perAllocation
                  const allocatedPoints = currentTypeAlloc[skill.id] || 0
                  const totalAllocated = allocation[skill.id] || 0
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
                            {totalAllocated !== allocatedPoints && totalAllocated > 0 && (
                              <span className={styles.totalPoints}>(共 +{totalAllocated})</span>
                            )}
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

