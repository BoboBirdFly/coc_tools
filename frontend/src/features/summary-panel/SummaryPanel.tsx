import type { CalculatedCharacter, Profession } from '@schema/character'
import styles from './SummaryPanel.module.css'

type SummaryPanelProps = {
  character: CalculatedCharacter
  profession?: Profession
}

const SummaryPanel = ({ character, profession }: SummaryPanelProps) => {
  return (
    <section className="panel">
      <h2>结果与推导</h2>
      <div className={styles.stack}>
        <div className={styles.card}>
          <p className={styles['section-title']}>主要属性</p>
          <div className={styles.grid}>
            {Object.entries(character.attributes).map(([key, value]) => (
              <div key={key} className={styles.stat}>
                <span className={styles['stat-label']}>{key.toUpperCase()}</span>
                <strong className={styles['stat-value']}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles['section-title']}>二级属性</p>
          <div className={styles.grid}>
            {Object.entries(character.secondaryStats).map(([key, value]) => (
              <div key={key} className={styles.stat}>
                <span className={styles['stat-label']}>{key.toUpperCase()}</span>
                <strong className={styles['stat-value']}>{value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.card}>
          <p className={styles['section-title']}>技能摘要</p>
          <div className={styles.grid}>
            <div className={styles.stat}>
              <span className={styles['stat-label']}>职业技能点</span>
              <strong className={styles['stat-value']}>{character.skillPoints}</strong>
            </div>
            {profession && (
              <div className={styles.stat}>
                <span className={styles['stat-label']}>推荐技能</span>
                <ul className={styles.list}>
                  {profession.signatureSkills.slice(0, 4).map((skill) => (
                    <li key={skill}>{skill}</li>
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

