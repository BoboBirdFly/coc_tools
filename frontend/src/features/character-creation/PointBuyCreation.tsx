import { useState, useMemo } from 'react'
import type { AttributeMap, AttributeKey } from '@schema/character'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { ATTRIBUTE_RULES } from '@data/constants'
import styles from './CharacterCreation.module.css'

type PointBuyCreationProps = {
  onComplete: (attributes: AttributeMap) => void
  onBack: () => void
}

const TOTAL_POINTS = 480

/**
 * 购点车卡组件
 * 手动分配 480 点属性
 */
const PointBuyCreation = ({ onComplete, onBack }: PointBuyCreationProps) => {
  const [attributes, setAttributes] = useState<AttributeMap>(() => {
    // 初始分配：平均分配 480 点（每个属性 60 点）
    const initialValue = 60
    return {
      str: initialValue,
      con: initialValue,
      dex: initialValue,
      int: initialValue,
      pow: initialValue,
      siz: initialValue,
      app: initialValue,
      edu: initialValue,
    }
  })

  // 计算已用点数
  const usedPoints = useMemo(() => {
    return Object.values(attributes).reduce((sum, value) => sum + value, 0)
  }, [attributes])

  // 剩余点数
  const remainingPoints = TOTAL_POINTS - usedPoints

  // 调整属性值
  const adjustAttribute = (key: AttributeKey, delta: number) => {
    setAttributes((prev) => {
      const newValue = prev[key] + delta
      const clampedValue = Math.max(
        ATTRIBUTE_RULES.min,
        Math.min(ATTRIBUTE_RULES.max, newValue)
      )
      
      // 检查是否超过总点数限制
      const newAttributes = { ...prev, [key]: clampedValue }
      const newTotal = Object.values(newAttributes).reduce((sum, v) => sum + v, 0)
      
      if (newTotal > TOTAL_POINTS && delta > 0) {
        // 如果增加后超过限制，不更新
        return prev
      }
      
      return newAttributes
    })
  }

  const handleConfirm = () => {
    if (remainingPoints === 0 || remainingPoints < 0) {
      onComplete(attributes)
    }
  }

  const canIncrease = (key: AttributeKey): boolean => {
    if (attributes[key] >= ATTRIBUTE_RULES.max) return false
    if (remainingPoints < ATTRIBUTE_RULES.step) return false
    return true
  }

  const canDecrease = (key: AttributeKey): boolean => {
    return attributes[key] > ATTRIBUTE_RULES.min
  }

  return (
    <div className={styles.pointBuyCreation}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={onBack}>
          ← 返回
        </button>
        <h2 className={styles.title}>购点车卡</h2>
      </div>

      <div className={styles.content}>
        {/* 点数统计 */}
        <div className={styles.pointsSummary}>
          <div className={styles.pointsItem}>
            <span className={styles.pointsLabel}>总点数：</span>
            <span className={styles.pointsValue}>{TOTAL_POINTS}</span>
          </div>
          <div className={styles.pointsItem}>
            <span className={styles.pointsLabel}>已用点数：</span>
            <span className={styles.pointsValue}>{usedPoints}</span>
          </div>
          <div className={styles.pointsItem}>
            <span className={styles.pointsLabel}>剩余点数：</span>
            <span
              className={`${styles.pointsValue} ${
                remainingPoints < 0 ? styles.error : remainingPoints === 0 ? styles.success : ''
              }`}
            >
              {remainingPoints}
            </span>
          </div>
        </div>

        {remainingPoints < 0 && (
          <div className={styles.errorMessage}>
            ⚠️ 已超出总点数限制，请减少部分属性值
          </div>
        )}

        {/* 属性分配 */}
        <div className={styles.attributesGrid}>
          {Object.entries(attributes).map(([key, value]) => {
            const attrKey = key as AttributeKey
            return (
              <div key={key} className={styles.attributeCard}>
                <div className={styles.attributeHeader}>
                  <span className={styles.attributeName}>
                    {ATTRIBUTE_NAMES[attrKey]}
                  </span>
                  <span className={styles.attributeValue}>{value}</span>
                </div>
                <div className={styles.attributeControls}>
                  <button
                    className={styles.controlButton}
                    onClick={() => adjustAttribute(attrKey, -ATTRIBUTE_RULES.step)}
                    disabled={!canDecrease(attrKey)}
                    aria-label={`减少${ATTRIBUTE_NAMES[attrKey]}`}
                  >
                    −
                  </button>
                  <span className={styles.controlValue}>{value}</span>
                  <button
                    className={styles.controlButton}
                    onClick={() => adjustAttribute(attrKey, ATTRIBUTE_RULES.step)}
                    disabled={!canIncrease(attrKey)}
                    aria-label={`增加${ATTRIBUTE_NAMES[attrKey]}`}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <button
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={remainingPoints !== 0}
          >
            {remainingPoints === 0 ? '确认属性 →' : `还需分配 ${remainingPoints} 点`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PointBuyCreation

