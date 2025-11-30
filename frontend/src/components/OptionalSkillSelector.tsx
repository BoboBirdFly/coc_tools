import { useState, useMemo } from 'react'
import type { Profession } from '@schema/character'
import { getSkillById } from '@data/skills'
import { Card, Button } from './ui'
import styles from './OptionalSkillSelector.module.css'

type OptionalSkillSelectorProps = {
  profession: Profession
  onComplete: (selectedSkills: Record<number, string[]>) => void
  initialSelection?: Record<number, string[]>
}

/**
 * 可选技能选择组件
 * 用于在职业变化后选择可选技能
 */
const OptionalSkillSelector = ({
  profession,
  onComplete,
  initialSelection = {},
}: OptionalSkillSelectorProps) => {
  const [selectedOptionalSkills, setSelectedOptionalSkills] = useState<Record<number, string[]>>(
    initialSelection
  )

  // 处理可选技能切换
  const handleOptionalSkillToggle = (groupIndex: number, skillId: string) => {
    setSelectedOptionalSkills((prev) => {
      const current = prev[groupIndex] || []
      const group = profession.optionalSkillGroups?.[groupIndex]
      if (!group) return prev

      const isSelected = current.includes(skillId)
      let newSelection: string[]

      if (isSelected) {
        // 取消选择
        newSelection = current.filter((id) => id !== skillId)
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
  const canProceed = useMemo(() => {
    if (!profession.optionalSkillGroups || profession.optionalSkillGroups.length === 0) {
      return true
    }
    return profession.optionalSkillGroups.every((group, index) => {
      const selected = selectedOptionalSkills[index] || []
      return selected.length === group.count
    })
  }, [profession.optionalSkillGroups, selectedOptionalSkills])

  const handleConfirm = () => {
    if (canProceed) {
      onComplete(selectedOptionalSkills)
    }
  }

  if (!profession.optionalSkillGroups || profession.optionalSkillGroups.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>选择职业技能</h2>
        <p className={styles.description}>
          请从以下可选技能组中选择你的职业技能。选择完成后，这些技能将加入你的职业技能列表。
        </p>
      </div>

      <div className={styles.groups}>
        {profession.optionalSkillGroups.map((group, groupIndex) => {
          const selected = selectedOptionalSkills[groupIndex] || []
          const isComplete = selected.length === group.count

          if (group.type === 'specific' && group.skillIds) {
            return (
              <div key={groupIndex} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  下面任选 {group.count} 项：
                  {isComplete && <span className={styles.completeBadge}>✓ 已完成</span>}
                </h3>
                <div className={styles.skillsList}>
                  {group.skillIds.map((skillId) => {
                    const skill = getSkillById(skillId)
                    if (!skill) return null
                    const isSelected = selected.includes(skillId)
                    return (
                      <Card
                        key={skillId}
                        variant={isSelected ? 'elevated' : 'outlined'}
                        padding="sm"
                        className={`${styles.skillCard} ${isSelected ? styles.selected : ''}`}
                        onClick={() => handleOptionalSkillToggle(groupIndex, skillId)}
                      >
                        <div className={styles.skillContent}>
                          <span className={styles.skillName}>{skill.name}</span>
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
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!canProceed}
          fullWidth
        >
          {canProceed ? '确认选择 →' : '请完成所有可选技能的选择'}
        </Button>
      </div>
    </div>
  )
}

export default OptionalSkillSelector

