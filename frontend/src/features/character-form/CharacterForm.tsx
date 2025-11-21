import type { BaseCharacterInput, AttributeKey, Profession } from '@schema/character'
import { getSkillById } from '@data/skills'
import styles from './CharacterForm.module.css'

type CharacterFormProps = {
  value: BaseCharacterInput
  professions: Profession[]
  onChange: (payload: Partial<BaseCharacterInput>) => void
  onAttributeChange: (key: keyof BaseCharacterInput['attributes'], value: number) => void
}

// 属性中文名称映射（COC7th 标准术语）
const ATTRIBUTE_NAMES: Record<AttributeKey, string> = {
  str: '力量',
  con: '体质',
  dex: '敏捷',
  int: '智力',
  pow: '意志',
  siz: '体型',
  app: '外貌',
  edu: '教育',
}

// 输入校验：确保属性值在有效范围内（COC7th 规则：15-90，步进 5）
const validateAttribute = (value: number): number => {
  if (value < 15) return 15
  if (value > 90) return 90
  // 确保是 5 的倍数
  return Math.round(value / 5) * 5
}

const CharacterForm = ({
  value,
  professions,
  onChange,
  onAttributeChange,
}: CharacterFormProps) => {
  const activeProfession = professions.find((p) => p.id === value.professionId)

  // 处理属性输入变化，自动校验
  const handleAttributeChange = (key: AttributeKey, rawValue: number) => {
    const validated = validateAttribute(rawValue)
    onAttributeChange(key, validated)
  }

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
              {activeProfession.signatureSkills
                .map((skillId) => getSkillById(skillId)?.name ?? skillId)
                .join('、')}
            </p>
          )}
        </div>

        <div>
          <p className={styles.label}>基础属性（COC7th：15-90，步进 5）</p>
          <div className={styles.attributeGrid}>
            {Object.entries(value.attributes).map(([key, score]) => {
              const attrKey = key as AttributeKey
              return (
                <div key={key} className={styles.attributeCard}>
                  <span className={styles.attributeLabel}>
                    {ATTRIBUTE_NAMES[attrKey] || key.toUpperCase()}
                  </span>
                  <input
                    className={styles.attributeInput}
                    type="number"
                    min={15}
                    max={90}
                    step={5}
                    value={score}
                    onChange={(event) =>
                      handleAttributeChange(attrKey, Number(event.target.value) || 15)
                    }
                    onBlur={(event) => {
                      // 失焦时自动校正到有效值
                      const corrected = validateAttribute(Number(event.target.value) || 15)
                      if (corrected !== score) {
                        onAttributeChange(attrKey, corrected)
                      }
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CharacterForm

