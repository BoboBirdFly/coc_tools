import styles from './StepIndicator.module.css'

type StepIndicatorProps = {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

/**
 * 步骤指示器组件
 * 显示当前步骤和总步骤数
 */
const StepIndicator = ({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep

          return (
            <div key={stepNumber} className={styles.step}>
              <div
                className={`${styles.stepCircle} ${
                  isActive ? styles.active : isCompleted ? styles.completed : ''
                }`}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <span
                className={`${styles.stepLabel} ${
                  isActive ? styles.active : isCompleted ? styles.completed : ''
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  )
}

export default StepIndicator

