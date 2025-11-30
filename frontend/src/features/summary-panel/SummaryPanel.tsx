import { useMemo, useState } from 'react'
import type { CalculatedCharacter, AttributeKey, Profession, AttributeMap, SkillAllocation } from '@schema/character'
import { ATTRIBUTE_NAMES, SECONDARY_NAMES, UI_TEXT, SKILL_CATEGORY_NAMES } from '@data/i18n'
import { EXPORT_CONFIG } from '@data/constants'
import { SKILLS } from '@data/skills'
import {
  calculateSkillInitialValue,
  calculateSkillCurrentValue,
  canAllocateSkillPoints,
  getSkillMaxValue,
  validateSkillAllocation,
  calculateUsedSkillPoints,
} from '@services/skillAllocation'
import { Button, StatCard, Card } from '@components/ui'
import AttributeTooltip from '@components/AttributeTooltip'
import styles from './SummaryPanel.module.css'

type TabType = 'summary' | 'skills'
type SkillViewType = 'category' | 'profession'
type AllocationType = 'occupation' | 'personal'

type SummaryPanelProps = {
  character: CalculatedCharacter
  profession?: Profession
  attributes: AttributeMap
  skillAllocation?: SkillAllocation
  onSkillAllocationChange?: (allocation: SkillAllocation) => void
}

const SummaryPanel = ({
  character,
  profession,
  attributes,
  skillAllocation = {},
  onSkillAllocationChange,
}: SummaryPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary')
  const [skillViewType, setSkillViewType] = useState<SkillViewType>('category')
  const [allocationType, setAllocationType] = useState<AllocationType>('occupation')
  // 渲染属性检定阈值提示
  const renderThresholdNote = (attributeKey: string): string | null => {
    const threshold = character.thresholds[attributeKey as keyof typeof character.thresholds]
    if (!threshold) {
      return null
    }
    return `困难 ${threshold.hard} · 极难 ${threshold.extreme}`
  }

  // 计算所有技能的当前值、困难成功值、极难成功值
  const skillsWithValues = useMemo(() => {
    return SKILLS.map((skill) => {
      const initialValue = calculateSkillInitialValue(skill.id, attributes)
      const currentValue = calculateSkillCurrentValue(skill.id, attributes, skillAllocation)
      const hardValue = Math.floor(currentValue / 2)
      const extremeValue = Math.floor(currentValue / 5)

      return {
        ...skill,
        initialValue,
        currentValue,
        hardValue,
        extremeValue,
      }
    })
  }, [attributes, skillAllocation])

  // 计算职业技能 ID 集合（包括可选技能和子技能）
  const signatureSkillIds = useMemo(() => {
    const skillSet = new Set<string>()
    character.signatureSkills.forEach((skill) => {
      skillSet.add(skill.id)
    })
    return skillSet
  }, [character.signatureSkills])

  // 按分类分组技能
  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, typeof skillsWithValues> = {}
    skillsWithValues.forEach((skill) => {
      if (!grouped[skill.category]) {
        grouped[skill.category] = []
      }
      grouped[skill.category].push(skill)
    })
    // 对每个分类内的技能按名称排序
    for (const category in grouped) {
      grouped[category].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    }
    return grouped
  }, [skillsWithValues])

  // 按职业与非职业分组技能
  const skillsByProfession = useMemo(() => {
    const occupation: typeof skillsWithValues = []
    const personal: typeof skillsWithValues = []

    skillsWithValues.forEach((skill) => {
      if (signatureSkillIds.has(skill.id)) {
        occupation.push(skill)
      } else {
        personal.push(skill)
      }
    })

    // 对每个分组内的技能按名称排序
    occupation.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    personal.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

    return { occupation, personal }
  }, [skillsWithValues, signatureSkillIds])

  // 计算已使用的职业技能点和兴趣技能点
  // 使用 calculateUsedSkillPoints 来正确处理信用评级的特殊情况
  // 信用评级可以同时使用职业技能点和兴趣技能点
  const usedOccupation = useMemo(() => {
    return calculateUsedSkillPoints(skillAllocation, 'occupation', profession)
  }, [skillAllocation, profession])

  const usedPersonal = useMemo(() => {
    return calculateUsedSkillPoints(skillAllocation, 'personal', profession)
  }, [skillAllocation, profession])

  // 剩余点数
  const remainingOccupation = character.skillBudgets.occupation - usedOccupation
  const remainingPersonal = character.skillBudgets.personal - usedPersonal

  // 调整技能点数
  const adjustSkillPoints = (skillId: string, delta: number) => {
    if (!onSkillAllocationChange) return

    const currentPoints = skillAllocation[skillId] || 0
    const newPoints = Math.max(0, currentPoints + delta)

    // 验证
    const validation = validateSkillAllocation(
      skillId,
      newPoints,
      attributes,
      skillAllocation,
      profession,
    )

    if (!validation.valid) {
      return
    }

    // 检查点数限制
    if (allocationType === 'occupation') {
      // 职业技能点只能分配给职业技能
      if (!signatureSkillIds.has(skillId)) {
        return
      }
      if (delta > 0 && remainingOccupation < delta) {
        return
      }
    } else {
      // 兴趣技能点可以分配给所有技能（包括职业技能）
      if (delta > 0 && remainingPersonal < delta) {
        return
      }
    }

    // 更新分配
    const newAllocation = { ...skillAllocation }
    if (newPoints === 0) {
      delete newAllocation[skillId]
    } else {
      newAllocation[skillId] = newPoints
    }
    onSkillAllocationChange(newAllocation)
  }

  // 导出角色卡为 JSON（供备份）
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(character, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${character.name || EXPORT_CONFIG.defaultFileName}_${new Date().toISOString().split('T')[0]}${EXPORT_CONFIG.fileExtension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <section className="panel">
      <div className={styles.tabHeader}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'summary' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            结果与推导
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'skills' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            技能表
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJSON}
          title={UI_TEXT.exportButtonTitle}
        >
          {UI_TEXT.exportButtonLabel}
        </Button>
      </div>

      {activeTab === 'summary' && (
        <div className={styles.stack}>
          <Card variant="default" padding="md">
            <p className={styles['section-title']}>主要属性</p>
            <div className={styles.grid}>
              {Object.entries(character.attributes).map(([key, value]) => {
                const attrKey = key as AttributeKey
                return (
                  <StatCard
                    key={key}
                    label={
                      <span className={styles.attrLabel}>
                        {ATTRIBUTE_NAMES[attrKey] || key.toUpperCase()}
                        <AttributeTooltip attribute={attrKey} />
                      </span>
                    }
                    value={value}
                    note={renderThresholdNote(key) || undefined}
                  />
                )
              })}
            </div>
          </Card>

          <Card variant="default" padding="md">
            <p className={styles['section-title']}>二级属性</p>
            <div className={styles.grid}>
              {Object.entries(character.secondaryStats).map(([key, value]) => (
                <StatCard
                  key={key}
                  label={SECONDARY_NAMES[key] || key.toUpperCase()}
                  value={value}
                />
              ))}
              <StatCard
                label="职业技能点"
                value={character.skillBudgets.occupation}
                note={UI_TEXT.skillPointsOccupation}
              />
              <StatCard
                label="兴趣技能点"
                value={character.skillBudgets.personal}
                note={UI_TEXT.skillPointsPersonal}
              />
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className={styles.skillsContainer}>
          {/* 技能点显示和选择 */}
          {onSkillAllocationChange && (
            <div className={styles.skillPointsHeader}>
              <label className={styles.skillPointCheckbox}>
                <input
                  type="checkbox"
                  checked={allocationType === 'occupation'}
                  onChange={() => setAllocationType('occupation')}
                />
                <span className={styles.checkboxLabel}>
                  职业技能点：{usedOccupation} / {character.skillBudgets.occupation}
                  {remainingOccupation > 0 && ` (剩余 ${remainingOccupation})`}
                </span>
              </label>
              <label className={styles.skillPointCheckbox}>
                <input
                  type="checkbox"
                  checked={allocationType === 'personal'}
                  onChange={() => setAllocationType('personal')}
                />
                <span className={styles.checkboxLabel}>
                  兴趣技能点：{usedPersonal} / {character.skillBudgets.personal}
                  {remainingPersonal > 0 && ` (剩余 ${remainingPersonal})`}
                </span>
              </label>
            </div>
          )}

          {/* 技能表分类 tab */}
          <div className={styles.skillViewTabs}>
            <button
              className={`${styles.skillViewTab} ${skillViewType === 'category' ? styles.skillViewTabActive : ''}`}
              onClick={() => setSkillViewType('category')}
            >
              按类别
            </button>
            <button
              className={`${styles.skillViewTab} ${skillViewType === 'profession' ? styles.skillViewTabActive : ''}`}
              onClick={() => setSkillViewType('profession')}
            >
              按职业
            </button>
          </div>

          {/* 按类别显示 */}
          {skillViewType === 'category' && (
            <>
              {Object.entries(skillsByCategory).map(([category, skills]) => (
                <div key={category} className={styles.skillCategory}>
                  <h3 className={styles.categoryTitle}>
                    {SKILL_CATEGORY_NAMES[category as keyof typeof SKILL_CATEGORY_NAMES]}
                  </h3>
                  <div className={styles.skillsTable}>
                    {skills.map((skill) => {
                      const allocatedPoints = skillAllocation[skill.id] || 0
                      const maxValue = getSkillMaxValue(skill.id, profession)
                      const canIncrease =
                        canAllocateSkillPoints(skill.id) &&
                        skill.currentValue < maxValue &&
                        (allocationType === 'occupation' ? remainingOccupation > 0 : remainingPersonal > 0)
                      const canDecrease = allocatedPoints > 0
                      const isSignatureSkill = signatureSkillIds.has(skill.id)
                      const canAllocateWithCurrentType =
                        allocationType === 'occupation'
                          ? isSignatureSkill  // 职业技能点只能分配给职业技能
                          : true  // 兴趣技能点可以分配给所有技能

                      return (
                        <div key={skill.id} className={styles.skillRow}>
                          <div className={styles.skillNameCell}>
                            <span className={styles.skillName}>{skill.name}</span>
                            {isSignatureSkill && (
                              <span className={styles.signatureBadge}>职业</span>
                            )}
                          </div>
                          <div className={styles.skillValuesCell}>
                            <span className={styles.currentValue}>{skill.currentValue}</span>
                            <span className={styles.hardValue}>困难 {skill.hardValue}</span>
                            <span className={styles.extremeValue}>极难 {skill.extremeValue}</span>
                          </div>
                          {onSkillAllocationChange && canAllocateSkillPoints(skill.id) && (
                            <div className={styles.skillControls}>
                              {canAllocateWithCurrentType && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => adjustSkillPoints(skill.id, -1)}
                                    disabled={!canDecrease}
                                    className={styles.controlButton}
                                  >
                                    -1
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => adjustSkillPoints(skill.id, -5)}
                                    disabled={!canDecrease || allocatedPoints < 5}
                                    className={styles.controlButton}
                                  >
                                    -5
                                  </Button>
                                  <span className={styles.allocatedPoints}>
                                    {allocatedPoints > 0 ? `+${allocatedPoints}` : '0'}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => adjustSkillPoints(skill.id, 5)}
                                    disabled={!canIncrease || (allocationType === 'occupation' ? remainingOccupation < 5 : remainingPersonal < 5) || skill.currentValue + 5 > maxValue}
                                    className={styles.controlButton}
                                  >
                                    +5
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => adjustSkillPoints(skill.id, 1)}
                                    disabled={!canIncrease || skill.currentValue >= maxValue}
                                    className={styles.controlButton}
                                  >
                                    +1
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 按职业与非职业显示 */}
          {skillViewType === 'profession' && (
            <>
              {/* 职业技能 */}
              <div className={styles.skillCategory}>
                <h3 className={styles.categoryTitle}>职业技能</h3>
                <div className={styles.skillsTable}>
                  {skillsByProfession.occupation.map((skill) => {
                    const allocatedPoints = skillAllocation[skill.id] || 0
                    const maxValue = getSkillMaxValue(skill.id, profession)
                    const canIncrease =
                      canAllocateSkillPoints(skill.id) &&
                      skill.currentValue < maxValue &&
                      (allocationType === 'occupation' ? remainingOccupation > 0 : remainingPersonal > 0)
                    const canDecrease = allocatedPoints > 0
                    const canAllocateWithCurrentType =
                      allocationType === 'occupation' ? true : true  // 两种点数都可以分配给职业技能

                    return (
                      <div key={skill.id} className={styles.skillRow}>
                        <div className={styles.skillNameCell}>
                          <span className={styles.skillName}>{skill.name}</span>
                          <span className={styles.signatureBadge}>职业</span>
                        </div>
                        <div className={styles.skillValuesCell}>
                          <span className={styles.currentValue}>{skill.currentValue}</span>
                          <span className={styles.hardValue}>困难 {skill.hardValue}</span>
                          <span className={styles.extremeValue}>极难 {skill.extremeValue}</span>
                        </div>
                        {onSkillAllocationChange && canAllocateSkillPoints(skill.id) && canAllocateWithCurrentType && (
                          <div className={styles.skillControls}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, -1)}
                              disabled={!canDecrease}
                              className={styles.controlButton}
                            >
                              -1
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, -5)}
                              disabled={!canDecrease || allocatedPoints < 5}
                              className={styles.controlButton}
                            >
                              -5
                            </Button>
                            <span className={styles.allocatedPoints}>
                              {allocatedPoints > 0 ? `+${allocatedPoints}` : '0'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, 5)}
                              disabled={!canIncrease || (allocationType === 'occupation' ? remainingOccupation < 5 : remainingPersonal < 5) || skill.currentValue + 5 > maxValue}
                              className={styles.controlButton}
                            >
                              +5
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, 1)}
                              disabled={!canIncrease || skill.currentValue >= maxValue}
                              className={styles.controlButton}
                            >
                              +1
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 非职业技能 */}
              <div className={styles.skillCategory}>
                <h3 className={styles.categoryTitle}>非职业技能</h3>
                <div className={styles.skillsTable}>
                  {skillsByProfession.personal.map((skill) => {
                    const allocatedPoints = skillAllocation[skill.id] || 0
                    const maxValue = getSkillMaxValue(skill.id, profession)
                    const canIncrease =
                      canAllocateSkillPoints(skill.id) &&
                      skill.currentValue < maxValue &&
                      allocationType === 'personal' &&
                      remainingPersonal > 0
                    const canDecrease = allocatedPoints > 0

                    return (
                      <div key={skill.id} className={styles.skillRow}>
                        <div className={styles.skillNameCell}>
                          <span className={styles.skillName}>{skill.name}</span>
                        </div>
                        <div className={styles.skillValuesCell}>
                          <span className={styles.currentValue}>{skill.currentValue}</span>
                          <span className={styles.hardValue}>困难 {skill.hardValue}</span>
                          <span className={styles.extremeValue}>极难 {skill.extremeValue}</span>
                        </div>
                        {onSkillAllocationChange && canAllocateSkillPoints(skill.id) && allocationType === 'personal' && (
                          <div className={styles.skillControls}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, -1)}
                              disabled={!canDecrease}
                              className={styles.controlButton}
                            >
                              -1
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, -5)}
                              disabled={!canDecrease || allocatedPoints < 5}
                              className={styles.controlButton}
                            >
                              -5
                            </Button>
                            <span className={styles.allocatedPoints}>
                              {allocatedPoints > 0 ? `+${allocatedPoints}` : '0'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, 5)}
                              disabled={!canIncrease || remainingPersonal < 5 || skill.currentValue + 5 > maxValue}
                              className={styles.controlButton}
                            >
                              +5
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustSkillPoints(skill.id, 1)}
                              disabled={!canIncrease || skill.currentValue >= maxValue}
                              className={styles.controlButton}
                            >
                              +1
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export default SummaryPanel

