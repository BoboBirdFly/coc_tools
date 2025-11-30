import { useState, useRef } from 'react'
import type { AttributeMap } from '@schema/character'
import CreationMethodSelector from './CreationMethodSelector'
import FateCreation from './FateCreation'
import PointBuyCreation from './PointBuyCreation'
import StepIndicator from '@components/StepIndicator'
import { STORAGE_KEYS } from '@data/constants'
import { setLocalStorageItem } from '@utils/storage'
import { Button } from '@components/ui'
import styles from './CharacterCreation.module.css'

type CreationMethod = 'fate' | 'point-buy' | null
type CreationStep = 'method' | 'attributes'

type CharacterCreationProps = {
  onComplete: (attributes: AttributeMap) => void
  onCancel: () => void
}

/**
 * 车卡页面主组件（简化版）
 * 管理车卡流程：选择方式 → 生成属性
 * 属性生成完成后，返回到主页面进行职业选择和技能分配
 */
const CharacterCreation = ({ onComplete, onCancel }: CharacterCreationProps) => {
  const [step, setStep] = useState<CreationStep>('method')
  const [method, setMethod] = useState<CreationMethod>(null)
  const [attributes, setAttributes] = useState<AttributeMap | null>(null)

  // 跟踪上一个步骤，用于判断来源
  const previousStepRef = useRef<CreationStep>('method')

  // 选择车卡方式
  const handleMethodSelect = (selectedMethod: CreationMethod) => {
    setMethod(selectedMethod)
    previousStepRef.current = step
    setStep('attributes')
  }

  // 属性生成完成
  const handleAttributesComplete = (generatedAttributes: AttributeMap, _luck?: number) => {
    setAttributes(generatedAttributes)
    // 清除临时数据
    setLocalStorageItem(STORAGE_KEYS.creationTempData, null)
    // 返回属性，让父组件处理保存和跳转
    onComplete(generatedAttributes)
  }

  // 返回上一步
  const handleBack = () => {
    if (step === 'attributes') {
      previousStepRef.current = step
      setStep('method')
      setMethod(null)
      setAttributes(null)
      // 清除临时数据
      setLocalStorageItem(STORAGE_KEYS.creationTempData, null)
    }
  }

  // 步骤配置
  const stepConfig = {
    method: { number: 1, label: '选择方式' },
    attributes: { number: 2, label: '生成属性' },
  }

  const currentStepNumber = stepConfig[step].number
  const stepLabels = [
    stepConfig.method.label,
    stepConfig.attributes.label,
  ]

  return (
    <div className={styles.characterCreation}>
      {/* 步骤指示器 */}
      <StepIndicator
        currentStep={currentStepNumber}
        totalSteps={2}
        stepLabels={stepLabels}
      />

      {step === 'method' && (
        <CreationMethodSelector onSelect={handleMethodSelect} />
      )}

      {step === 'attributes' && method === 'fate' && (
        <FateCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
          initialAttributes={attributes || undefined}
        />
      )}

      {step === 'attributes' && method === 'point-buy' && (
        <PointBuyCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
          initialAttributes={attributes || undefined}
        />
      )}

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default CharacterCreation

