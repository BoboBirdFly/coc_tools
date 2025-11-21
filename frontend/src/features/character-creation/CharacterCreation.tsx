import { useState } from 'react'
import type { AttributeMap } from '@schema/character'
import CreationMethodSelector from './CreationMethodSelector'
import FateCreation from './FateCreation'
import PointBuyCreation from './PointBuyCreation'
import ProfessionSelector from '@components/ProfessionSelector'
import { FULL_PROFESSIONS } from '@data/professions-full'
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

  return (
    <div className={styles.characterCreation}>
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
        <div className={styles.professionStep}>
          <div className={styles.header}>
            <button className={styles.backButton} onClick={handleBack}>
              ← 返回
            </button>
            <h2 className={styles.title}>选择职业</h2>
          </div>
          <div className={styles.content}>
            <p className={styles.hint}>
              属性已生成，请选择角色的职业
            </p>
            <div className={styles.professionSelector}>
              <ProfessionSelector
                professions={FULL_PROFESSIONS}
                value={selectedProfessionId}
                onChange={handleProfessionSelect}
              />
            </div>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <button className={styles.cancelButton} onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  )
}

export default CharacterCreation

