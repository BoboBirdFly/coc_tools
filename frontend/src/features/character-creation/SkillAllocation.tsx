import { useState, useMemo, useEffect } from 'react'
import type { AttributeMap, SkillAllocation, SkillBudget, Profession } from '@schema/character'
import { SKILL_CATEGORY_NAMES, ATTRIBUTE_NAMES } from '@data/i18n'
import { evaluateSkillFormulas } from '@services/calculator'
import {
  calculateSkillInitialValue,
  calculateSkillCurrentValue,
  validateSkillAllocation,
  getOccupationSkillList,
  getPersonalSkillList,
  canAllocateSkillPoints,
  getSkillMaxValue,
  calculateUsedSkillPoints,
} from '@services/skillAllocation'
import { getSkillById, getChildSkills } from '@data/skills'
import { Card, PageHeader, Button, StatCard, NumberInput } from '@components/ui'
import styles from './SkillAllocation.module.css'

type SkillAllocationProps = {
  attributes: AttributeMap
  profession: Profession
  skillBudgets: SkillBudget
  onComplete: (allocation: SkillAllocation) => void
  onBack: () => void
  onChange?: (allocation: SkillAllocation) => void // 实时更新回调
  initialAllocation?: SkillAllocation // 初始技能分配
}

type AllocationType = 'occupation' | 'personal'
type SkillSelectionStep = 'select-optional' | 'allocate-points' // 新增：选择可选技能步骤

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
  onChange,
  initialAllocation = {},
}: SkillAllocationProps) => {
  // 步骤：先选择可选技能，再分配点数
  const [step, setStep] = useState<SkillSelectionStep>(
    profession.optionalSkillGroups && profession.optionalSkillGroups.length > 0 ? 'select-optional' : 'allocate-points'
  )

  // 用户选择的可选技能（每个可选技能组选择的技能ID列表）
  const [selectedOptionalSkills, setSelectedOptionalSkills] = useState<Record<number, string[]>>(() => {
    // 从初始分配中恢复已选择的可选技能
    const selected: Record<number, string[]> = {}
    if (profession.optionalSkillGroups) {
      profession.optionalSkillGroups.forEach((group, index) => {
        if (group.type === 'specific' && group.skillIds) {
          // 检查哪些可选技能在初始分配中有点数
          const selectedInGroup = group.skillIds.filter(skillId => initialAllocation[skillId] !== undefined)
          if (selectedInGroup.length > 0) {
            selected[index] = selectedInGroup
          }
        }
      })
    }
    return selected
  })

  const [allocationType, setAllocationType] = useState<AllocationType>('occupation')
  // 分开跟踪职业点和兴趣点的分配（用于信用评级等两边都能加的技能）
  // 从初始分配中恢复（简化处理：将初始分配全部作为职业分配）
  const [occAllocation, setOccAllocation] = useState<SkillAllocation>(() => {
    // 如果有初始分配，全部作为职业分配（简化处理）
    return { ...initialAllocation }
  })
  const [perAllocation, setPerAllocation] = useState<SkillAllocation>({})

  // 计算最终的职业技能列表（包含必需技能和用户选择的可选技能）
  // 如果职业技能包含父技能（如"射击"），则自动包含所有子技能（如"射击（手枪）"、"射击（步枪/散弹枪）"）
  const finalSignatureSkills = useMemo(() => {
    const skillSet = new Set<string>()
    const skills: string[] = []

    // 添加职业技能
    for (const skillId of profession.signatureSkills) {
      if (!skillSet.has(skillId)) {
        skills.push(skillId)
        skillSet.add(skillId)

        // 如果这个技能有子技能，也添加所有子技能
        const childSkills = getChildSkills(skillId)
        for (const childSkill of childSkills) {
          if (!skillSet.has(childSkill.id)) {
            skills.push(childSkill.id)
            skillSet.add(childSkill.id)
          }
        }
      }
    }

    // 添加用户选择的可选技能
    if (profession.optionalSkillGroups) {
      profession.optionalSkillGroups.forEach((_group, index) => {
        const selected = selectedOptionalSkills[index] || []
        for (const skillId of selected) {
          if (!skillSet.has(skillId)) {
            skills.push(skillId)
            skillSet.add(skillId)

            // 如果这个技能有子技能，也添加所有子技能
            const childSkills = getChildSkills(skillId)
            for (const childSkill of childSkills) {
              if (!skillSet.has(childSkill.id)) {
                skills.push(childSkill.id)
                skillSet.add(childSkill.id)
              }
            }
          }
        }
      })
    }

    return skills
  }, [profession.signatureSkills, profession.optionalSkillGroups, selectedOptionalSkills])

  // 创建一个临时的 profession 对象，包含最终确定的职业技能
  const finalProfession = useMemo(() => ({
    ...profession,
    signatureSkills: finalSignatureSkills,
  }), [profession, finalSignatureSkills])

  // 合并后的分配（用于显示和最终提交）
  const allocation: SkillAllocation = useMemo(() => {
    const merged: SkillAllocation = {}
    for (const skillId of new Set([...Object.keys(occAllocation), ...Object.keys(perAllocation)])) {
      merged[skillId] = (occAllocation[skillId] || 0) + (perAllocation[skillId] || 0)
    }
    return merged
  }, [occAllocation, perAllocation])

  // 实时通知父组件分配变化
  useEffect(() => {
    if (onChange) {
      onChange(allocation)
    }
  }, [allocation, onChange])

  // 获取技能列表（使用最终确定的职业技能）
  const occupationSkills = useMemo(() => {
    return getOccupationSkillList(finalProfession)
  }, [finalProfession])
  const personalSkills = useMemo(() => getPersonalSkillList(finalProfession), [finalProfession])

  // 计算已使用的点数（使用 calculateUsedSkillPoints 确保只计算分配的点数，不包含基础值）
  // 注意：应该分别使用 occAllocation 和 perAllocation，而不是合并后的 allocation
  // 因为一个技能可能同时有职业技能点和兴趣技能点（如信用评级）
  const usedOccupation = useMemo(
    () => calculateUsedSkillPoints(occAllocation, 'occupation', finalProfession),
    [occAllocation, finalProfession],
  )
  const usedPersonal = useMemo(
    () => calculateUsedSkillPoints(perAllocation, 'personal', finalProfession),
    [perAllocation, finalProfession],
  )

  // 剩余点数
  const remainingOccupation = skillBudgets.occupation - usedOccupation
  const remainingPersonal = skillBudgets.personal - usedPersonal

  // 生成职业点数计算公式的所有可能组合
  const formulaVariants = useMemo(() => {
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
      const total = evaluateSkillFormulas(attributes, profession)
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
  }, [attributes, profession])

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

    // 验证（使用最终确定的职业技能）
    const validation = validateSkillAllocation(
      skillId,
      totalNewPoints,
      attributes,
      allocation,
      finalProfession,
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
      const max = getSkillMaxValue(skillId, finalProfession)

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
      const max = getSkillMaxValue(skillId, finalProfession)

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

  // 处理可选技能选择
  const handleOptionalSkillToggle = (groupIndex: number, skillId: string) => {
    setSelectedOptionalSkills((prev) => {
      const current = prev[groupIndex] || []
      const group = profession.optionalSkillGroups?.[groupIndex]
      if (!group) return prev

      const isSelected = current.includes(skillId)
      let newSelection: string[]

      if (isSelected) {
        // 取消选择
        newSelection = current.filter(id => id !== skillId)
      } else {
        // 检查是否已达到选择数量限制
        if (current.length >= group.count) {
          return prev // 已达到上限，不添加
        }
        newSelection = [...current, skillId]
      }

      return {
        ...prev,
        [groupIndex]: newSelection,
      }
    })
  }

  // 检查可选技能选择是否完成
  const canProceedToAllocation = useMemo(() => {
    if (!profession.optionalSkillGroups || profession.optionalSkillGroups.length === 0) {
      return true
    }
    return profession.optionalSkillGroups.every((group, index) => {
      const selected = selectedOptionalSkills[index] || []
      return selected.length === group.count
    })
  }, [profession.optionalSkillGroups, selectedOptionalSkills])

  // 进入点数分配步骤
  const handleProceedToAllocation = () => {
    if (canProceedToAllocation) {
      setStep('allocate-points')
    }
  }

  // 返回选择可选技能步骤
  const handleBackToSelection = () => {
    setStep('select-optional')
  }

  // 渲染可选技能选择界面
  const renderOptionalSkillSelection = () => {
    if (!profession.optionalSkillGroups || profession.optionalSkillGroups.length === 0) {
      return null
    }

    return (
      <div className={styles.optionalSelectionSection}>
        <h3 className={styles.sectionTitle}>选择职业技能</h3>
        <p className={styles.sectionDescription}>
          请从以下可选技能组中选择你的职业技能。选择完成后，这些技能将加入你的职业技能列表，然后可以分配技能点。
        </p>

        {profession.optionalSkillGroups.map((group, groupIndex) => {
          const selected = selectedOptionalSkills[groupIndex] || []
          const isComplete = selected.length === group.count

          if (group.type === 'specific' && group.skillIds) {
            return (
              <div key={groupIndex} className={styles.optionalGroup}>
                <h4 className={styles.groupTitle}>
                  下面任选 {group.count} 项：
                  {isComplete && <span className={styles.completeBadge}>✓ 已完成</span>}
                </h4>
                <div className={styles.optionalSkillsList}>
                  {group.skillIds.map((skillId) => {
                    const skill = getSkillById(skillId)
                    if (!skill) return null
                    const isSelected = selected.includes(skillId)
                    return (
                      <Card
                        key={skillId}
                        variant={isSelected ? 'elevated' : 'outlined'}
                        padding="sm"
                        className={`${styles.optionalSkillCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleOptionalSkillToggle(groupIndex, skillId)}
                      >
                        <div className={styles.optionalSkillContent}>
                          <span className={styles.optionalSkillName}>{skill.name}</span>
                          {isSelected && <span className={styles.selectedBadge}>✓</span>}
                        </div>
                      </Card>
                    )
                  })}
                </div>
                <div className={styles.groupProgress}>
                  已选择 {selected.length} / {group.count}
                </div>
              </div>
            )
          }

          // 其他类型的可选技能组（暂时只支持 specific 类型）
          return null
        })}

        <div className={styles.selectionActions}>
          <Button
            variant="primary"
            onClick={handleProceedToAllocation}
            disabled={!canProceedToAllocation}
            fullWidth
          >
            {canProceedToAllocation
              ? '确认选择，开始分配技能点 →'
              : '请完成所有可选技能的选择'}
          </Button>
        </div>
      </div>
    )
  }

  // 如果还在选择可选技能步骤，只显示选择界面
  if (step === 'select-optional') {
    return (
      <Card variant="default" padding="md" className={styles.container}>
        <PageHeader title="选择职业技能" onBack={onBack} />
        <div className={styles.content}>
          {renderOptionalSkillSelection()}
        </div>
      </Card>
    )
  }

  return (
    <Card variant="default" padding="md" className={styles.container}>
      <PageHeader title="分配技能" onBack={profession.optionalSkillGroups && profession.optionalSkillGroups.length > 0 ? handleBackToSelection : onBack} />

      <div className={styles.content}>
        {/* 职业点数计算公式展示 */}
        <div className={styles.formulaSection}>
          <h3 className={styles.formulaTitle}>职业点数计算公式</h3>
          {formulaVariants.length === 1 ? (
            <div className={styles.formulaText}>
              {formulaVariants[0].formula} = {formulaVariants[0].total}
            </div>
          ) : (
            <div className={styles.formulaVariants}>
              {formulaVariants.map((variant, idx) => (
                <div key={idx} className={styles.formulaVariant}>
                  {variant.formula} = {variant.total}
                  {idx === 0 && (
                    <span className={styles.formulaNote}>（当前使用，取较大值）</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

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
                  const maxValue = getSkillMaxValue(skill.id, finalProfession)
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
                            {finalSignatureSkills.includes(skill.id) && (
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

