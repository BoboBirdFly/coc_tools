import type { AttributeKey } from '@schema/character'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { ATTRIBUTE_RULES } from '@data/constants'
import styles from './AttributeInput.module.css'

type AttributeInputProps = {
  attribute: AttributeKey
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}

/**
 * 属性输入组件（可复用）
 * 用于 COC7th 角色属性输入，自动校验范围
 */
const AttributeInput = ({
  attribute,
  value,
  onChange,
  min = ATTRIBUTE_RULES.min,
  max = ATTRIBUTE_RULES.max,
  step = ATTRIBUTE_RULES.step,
}: AttributeInputProps) => {
  const validate = (rawValue: number): number => {
    if (rawValue < min) return min
    if (rawValue > max) return max
    return Math.round(rawValue / step) * step
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = Number(event.target.value) || min
    onChange(validate(rawValue))
  }

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const corrected = validate(Number(event.target.value) || min)
    if (corrected !== value) {
      onChange(corrected)
    }
  }

  return (
    <div className={styles.container}>
      <label className={styles.label} htmlFor={`attr-${attribute}`}>
        {ATTRIBUTE_NAMES[attribute]}
      </label>
      <input
        id={`attr-${attribute}`}
        className={styles.input}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  )
}

export default AttributeInput

