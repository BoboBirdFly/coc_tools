import type { CalculatedCharacter, AttributeKey, Profession } from '@schema/character'
import { ATTRIBUTE_NAMES, SECONDARY_NAMES, UI_TEXT } from '@data/i18n'
import { EXPORT_CONFIG } from '@data/constants'
import styles from './SummaryPanel.module.css'

type SummaryPanelProps = {
  character: CalculatedCharacter
  profession?: Profession
}

const SummaryPanel = ({ character }: SummaryPanelProps) => {
  // 渲染属性检定阈值提示
  const renderThresholdNote = (attributeKey: string) => {
    const threshold = character.thresholds[attributeKey as keyof typeof character.thresholds]
    if (!threshold) {
      return null
    }
    return (
      <span className={styles['stat-note']}>
        困难 {threshold.hard} · 极难 {threshold.extreme}
      </span>
    )
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>结果与推导</h2>
        <button
          onClick={handleExportJSON}
          className={styles.exportButton}
          title={UI_TEXT.exportButtonTitle}
        >
          {UI_TEXT.exportButtonLabel}
        </button>
      </div>
      <div className={styles.stack}>
        <div className={styles.card}>
          <p className={styles['section-title']}>主要属性</p>
          <div className={styles.grid}>
            {Object.entries(character.attributes).map(([key, value]) => {
              const attrKey = key as AttributeKey
              return (
                <div key={key} className={styles.stat}>
                  <span className={styles['stat-label']}>
                    {ATTRIBUTE_NAMES[attrKey] || key.toUpperCase()}
                  </span>
                  <strong className={styles['stat-value']}>{value}</strong>
                  {renderThresholdNote(key)}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles['section-title']}>二级属性</p>
          <div className={styles.grid}>
            {Object.entries(character.secondaryStats).map(([key, value]) => (
              <div key={key} className={styles.stat}>
                <span className={styles['stat-label']}>
                  {SECONDARY_NAMES[key] || key.toUpperCase()}
                </span>
                <strong className={styles['stat-value']}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles['section-title']}>技能点与签名技能</p>
          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles['stat-label']}>职业技能点</span>
              <strong className={styles['stat-value']}>{character.skillBudgets.occupation}</strong>
              <span className={styles['stat-note']}>{UI_TEXT.skillPointsOccupation}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles['stat-label']}>兴趣技能点</span>
              <strong className={styles['stat-value']}>{character.skillBudgets.personal}</strong>
              <span className={styles['stat-note']}>{UI_TEXT.skillPointsPersonal}</span>
            </div>
            {character.signatureSkills.length > 0 && (
              <div className={styles.stat}>
                <span className={styles['stat-label']}>签名技能</span>
                <ul className={styles.list}>
                  {character.signatureSkills.map((skill) => (
                    <li key={skill.id}>
                      {skill.name} · 基础 {skill.base}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default SummaryPanel

