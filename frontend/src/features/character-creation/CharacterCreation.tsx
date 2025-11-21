import { useState } from 'react'
import type { AttributeMap } from '@schema/character'
import CreationMethodSelector from './CreationMethodSelector'
import FateCreation from './FateCreation'
import PointBuyCreation from './PointBuyCreation'
import ProfessionSelector from '@components/ProfessionSelector'
import StepIndicator from '@components/StepIndicator'
import ProfessionRecommendations from '@components/ProfessionRecommendations'
import { FULL_PROFESSIONS } from '@data/professions-full'
import { Button, PageHeader, Card } from '@components/ui'
import styles from './CharacterCreation.module.css'

type CreationMethod = 'fate' | 'point-buy' | null
type CreationStep = 'method' | 'attributes' | 'profession'

type CharacterCreationProps = {
  onComplete: (attributes: AttributeMap, professionId: string) => void
  onCancel: () => void
}

/**
 * 车卡页面主组件
 * 管理车卡流程：选择方式 → 生成属性 → 选择职业
 */
const CharacterCreation = ({ onComplete, onCancel }: CharacterCreationProps) => {
  const [step, setStep] = useState<CreationStep>('method')
  const [method, setMethod] = useState<CreationMethod>(null)
  const [attributes, setAttributes] = useState<AttributeMap | null>(null)
  const [selectedProfessionId, setSelectedProfessionId] = useState<string>('')

  // 选择车卡方式
  const handleMethodSelect = (selectedMethod: CreationMethod) => {
    setMethod(selectedMethod)
    setStep('attributes')
  }

  // 属性生成完成
  const handleAttributesComplete = (generatedAttributes: AttributeMap) => {
    setAttributes(generatedAttributes)
    setStep('profession')
  }

  // 选择职业
  const handleProfessionSelect = (professionId: string) => {
    setSelectedProfessionId(professionId)
    if (attributes && professionId) {
      onComplete(attributes, professionId)
    }
  }

  // 返回上一步
  const handleBack = () => {
    if (step === 'profession') {
      setStep('attributes')
    } else if (step === 'attributes') {
      setStep('method')
      setMethod(null)
      setAttributes(null)
    }
  }

  // 步骤配置
  const stepConfig = {
    method: { number: 1, label: '选择方式' },
    attributes: { number: 2, label: '生成属性' },
    profession: { number: 3, label: '选择职业' },
  }

  const currentStepNumber = stepConfig[step].number
  const stepLabels = [
    stepConfig.method.label,
    stepConfig.attributes.label,
    stepConfig.profession.label,
  ]

  return (
    <div className={styles.characterCreation}>
      {/* 步骤指示器 */}
      <StepIndicator
        currentStep={currentStepNumber}
        totalSteps={3}
        stepLabels={stepLabels}
      />

      {step === 'method' && (
        <CreationMethodSelector onSelect={handleMethodSelect} />
      )}

      {step === 'attributes' && method === 'fate' && (
        <FateCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
        />
      )}

      {step === 'attributes' && method === 'point-buy' && (
        <PointBuyCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
        />
      )}

      {step === 'profession' && attributes && (
        <div className={styles.professionStepContainer}>
          <Card variant="default" padding="md" className={styles.professionStep}>
            <PageHeader title="选择职业" onBack={handleBack} />
            <div className={styles.content}>
              <p className={styles.hint}>
                属性已生成，请选择角色的职业
              </p>

              {/* 职业推荐 */}
              <ProfessionRecommendations
                attributes={attributes}
                professions={FULL_PROFESSIONS}
                onSelect={handleProfessionSelect}
              />

              {/* 职业选择器 */}
              <div className={styles.professionSelector}>
                <h3 className={styles.selectorTitle}>所有职业</h3>
                <ProfessionSelector
                  professions={FULL_PROFESSIONS}
                  value={selectedProfessionId}
                  onChange={handleProfessionSelect}
                />
              </div>
            </div>
          </Card>
        </div>
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

