import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import Button from './Button'
import styles from './NumberInput.module.css'

type NumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  onIncrement?: () => void
  onDecrement?: () => void
  canIncrement?: boolean
  canDecrement?: boolean
  showControls?: boolean
}

/**
 * 数字输入组件（带增减按钮）
 * 用于需要精确控制的数字输入场景
 */
const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      onIncrement,
      onDecrement,
      canIncrement = true,
      canDecrement = true,
      showControls = true,
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <div className={styles.container}>
        {showControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDecrement}
            disabled={!canDecrement}
            className={styles.controlButton}
            aria-label="减少"
          >
            −
          </Button>
        )}
        <input
          ref={ref}
          type="number"
          className={`${styles.input} ${className}`}
          {...props}
        />
        {showControls && (
          <Button
            variant="outline"
            size="sm"
            onClick={onIncrement}
            disabled={!canIncrement}
            className={styles.controlButton}
            aria-label="增加"
          >
            +
          </Button>
        )}
      </div>
    )
  },
)

NumberInput.displayName = 'NumberInput'

export default NumberInput

