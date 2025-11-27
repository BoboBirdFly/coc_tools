import { useMemo, useState } from 'react'
import type { CalculatedCharacter, AttributeKey, Profession, AttributeMap, SkillAllocation } from '@schema/character'
import { ATTRIBUTE_NAMES, SECONDARY_NAMES, UI_TEXT, SKILL_CATEGORY_NAMES } from '@data/i18n'
import { EXPORT_CONFIG } from '@data/constants'
import { SKILLS } from '@data/skills'
import { calculateSkillInitialValue, calculateSkillCurrentValue } from '@services/skillAllocation'
import { Button, StatCard, Card } from '@components/ui'
import AttributeTooltip from '@components/AttributeTooltip'
import styles from './SummaryPanel.module.css'

type TabType = 'summary' | 'skills'

type SummaryPanelProps = {
  character: CalculatedCharacter
  profession?: Profession
  attributes: AttributeMap
  skillAllocation?: SkillAllocation
}

const SummaryPanel = ({
  character,
  profession,
  attributes,
  skillAllocation = {},
}: SummaryPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary')
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
          {Object.entries(skillsByCategory).map(([category, skills]) => (
            <div key={category} className={styles.skillCategory}>
              <h3 className={styles.categoryTitle}>
                {SKILL_CATEGORY_NAMES[category as keyof typeof SKILL_CATEGORY_NAMES]}
              </h3>
              <div className={styles.skillsTable}>
                {skills.map((skill) => (
                  <div key={skill.id} className={styles.skillRow}>
                    <div className={styles.skillNameCell}>
                      <span className={styles.skillName}>{skill.name}</span>
                      {profession?.signatureSkills.includes(skill.id) && (
                        <span className={styles.signatureBadge}>职业</span>
                      )}
                    </div>
                    <div className={styles.skillValuesCell}>
                      <span className={styles.currentValue}>{skill.currentValue}</span>
                      <span className={styles.hardValue}>困难 {skill.hardValue}</span>
                      <span className={styles.extremeValue}>极难 {skill.extremeValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default SummaryPanel

