import type { BaseCharacterInput, AttributeKey } from '@schema/character'
import type { FullProfession } from '@data/professions-full'
import { ATTRIBUTE_NAMES, UI_TEXT } from '@data/i18n'
import { ATTRIBUTE_RULES } from '@data/constants'
import ProfessionSelector from '@components/ProfessionSelector'
import AttributeTooltip from '@components/AttributeTooltip'
import styles from './CharacterForm.module.css'

type CharacterFormProps = {
  value: BaseCharacterInput
  professions: FullProfession[]
  onChange: (payload: Partial<BaseCharacterInput>) => void
  onAttributeChange: (key: keyof BaseCharacterInput['attributes'], value: number) => void
}

// 输入校验：确保属性值在有效范围内（使用公共配置）
const validateAttribute = (value: number): number => {
  if (value < ATTRIBUTE_RULES.min) return ATTRIBUTE_RULES.min
  if (value > ATTRIBUTE_RULES.max) return ATTRIBUTE_RULES.max
  // 确保是 step 的倍数
  return Math.round(value / ATTRIBUTE_RULES.step) * ATTRIBUTE_RULES.step
}

const CharacterForm = ({
  value,
  professions,
  onChange,
  onAttributeChange,
}: CharacterFormProps) => {
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
          <ProfessionSelector
            professions={professions}
            value={value.professionId}
            onChange={(professionId) => onChange({ professionId })}
          />
        </div>

        <div>
          <p className={styles.label}>{UI_TEXT.attributeInputLabel}</p>
          <div className={styles.attributeGrid}>
            {Object.entries(value.attributes).map(([key, score]) => {
              const attrKey = key as AttributeKey
              return (
                <div key={key} className={styles.attributeCard}>
                  <span className={styles.attributeLabel}>
                    {ATTRIBUTE_NAMES[attrKey] || key.toUpperCase()}
                    <AttributeTooltip attribute={attrKey} />
                  </span>
                  <input
                    className={styles.attributeInput}
                    type="number"
                    min={ATTRIBUTE_RULES.min}
                    max={ATTRIBUTE_RULES.max}
                    step={ATTRIBUTE_RULES.step}
                    value={score}
                    onChange={(event) =>
                      handleAttributeChange(attrKey, Number(event.target.value) || ATTRIBUTE_RULES.min)
                    }
                    onBlur={(event) => {
                      // 失焦时自动校正到有效值
                      const corrected = validateAttribute(Number(event.target.value) || ATTRIBUTE_RULES.min)
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

