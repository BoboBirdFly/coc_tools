import type { BaseCharacterInput, Profession } from '@schema/character'
import styles from './CharacterForm.module.css'

type CharacterFormProps = {
  value: BaseCharacterInput
  professions: Profession[]
  onChange: (payload: Partial<BaseCharacterInput>) => void
  onAttributeChange: (key: keyof BaseCharacterInput['attributes'], value: number) => void
}

const CharacterForm = ({
  value,
  professions,
  onChange,
  onAttributeChange,
}: CharacterFormProps) => {
  const activeProfession = professions.find((p) => p.id === value.professionId)

  return (
    <section className="panel">
      <h2>角色信息</h2>
      <div className={styles.section}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            名称
          </label>
          <input
            id="name"
            className={styles.input}
            type="text"
            placeholder="如：调查员 A"
            value={value.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="profession">
            职业
          </label>
          <select
            id="profession"
            className={`${styles.input} ${styles.select}`}
            value={value.professionId}
            onChange={(event) => onChange({ professionId: event.target.value })}
          >
            {professions.map((profession) => (
              <option key={profession.id} value={profession.id}>
                {profession.name}
              </option>
            ))}
          </select>
          {activeProfession && (
            <p className={styles.hint}>
              {activeProfession.description} · 关键技能：
              {activeProfession.signatureSkills.join('、')}
            </p>
          )}
        </div>

        <div>
          <p className={styles.label}>基础属性</p>
          <div className={styles.attributeGrid}>
            {Object.entries(value.attributes).map(([key, score]) => (
              <div key={key} className={styles.attributeCard}>
                <span className={styles.attributeLabel}>{key.toUpperCase()}</span>
                <input
                  className={styles.attributeInput}
                  type="number"
                  min={15}
                  max={90}
                  step={5}
                  value={score}
                  onChange={(event) =>
                    onAttributeChange(
                      key as keyof BaseCharacterInput['attributes'],
                      Number(event.target.value),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CharacterForm

