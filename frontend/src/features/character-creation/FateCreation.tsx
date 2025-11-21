import { useState } from 'react'
import type { AttributeMap } from '@schema/character'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { ATTRIBUTE_RULES } from '@data/constants'
import { roll3d6x5, roll2d6Plus6x5 } from '@utils/dice'
import styles from './CharacterCreation.module.css'

type FateCreationProps = {
  onComplete: (attributes: AttributeMap) => void
  onBack: () => void
}

/**
 * 天命车卡组件
 * 随机生成属性值
 */
const FateCreation = ({ onComplete, onBack }: FateCreationProps) => {
  const [attributes, setAttributes] = useState<AttributeMap | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 生成所有属性
  const generateAttributes = () => {
    setIsGenerating(true)
    
    // 模拟骰子动画延迟
    setTimeout(() => {
      const newAttributes: AttributeMap = {
        str: roll3d6x5(),
        con: roll3d6x5(),
        dex: roll3d6x5(),
        app: roll3d6x5(),
        pow: roll3d6x5(),
        siz: roll2d6Plus6x5(),
        int: roll2d6Plus6x5(),
        edu: roll2d6Plus6x5(),
      }
      
      // 确保属性值在有效范围内
      Object.keys(newAttributes).forEach((key) => {
        const attrKey = key as keyof AttributeMap
        const value = newAttributes[attrKey]
        if (value < ATTRIBUTE_RULES.min) {
          newAttributes[attrKey] = ATTRIBUTE_RULES.min
        } else if (value > ATTRIBUTE_RULES.max) {
          newAttributes[attrKey] = ATTRIBUTE_RULES.max
        }
      })
      
      setAttributes(newAttributes)
      setIsGenerating(false)
    }, 300)
  }

  const handleConfirm = () => {
    if (attributes) {
      onComplete(attributes)
    }
  }

  return (
    <div className={styles.fateCreation}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 返回
        </button>
        <h2 className={styles.title}>天命车卡</h2>
      </div>

      <div className={styles.content}>
        {!attributes && !isGenerating && (
          <div className={styles.initialState}>
            <p className={styles.hint}>
              点击下方按钮随机生成角色属性
            </p>
            <button
              className={styles.generateButton}
              onClick={generateAttributes}
            >
              🎲 生成属性
            </button>
          </div>
        )}

        {isGenerating && (
          <div className={styles.generating}>
            <div className={styles.diceAnimation}>🎲</div>
            <p>正在投掷骰子...</p>
          </div>
        )}

        {attributes && !isGenerating && (
          <>
            <div className={styles.attributesGrid}>
              {Object.entries(attributes).map(([key, value]) => {
                const attrKey = key as keyof AttributeMap
                return (
                  <div key={key} className={styles.attributeCard}>
                    <span className={styles.attributeName}>
                      {ATTRIBUTE_NAMES[attrKey]}
                    </span>
                    <span className={styles.attributeValue}>{value}</span>
                  </div>
                )
              })}
            </div>

            <div className={styles.actions}>
              <button
                className={styles.regenerateButton}
                onClick={generateAttributes}
              >
                🔄 重新生成
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirm}
              >
                确认属性 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FateCreation

