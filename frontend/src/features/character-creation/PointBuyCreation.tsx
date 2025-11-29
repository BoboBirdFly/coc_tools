import { useState, useMemo, useEffect } from 'react'
import type { AttributeMap, AttributeKey } from '@schema/character'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { ATTRIBUTE_RULES } from '@data/constants'
import { Button, PageHeader, StatCard, NumberInput, Card } from '@components/ui'
import styles from './CharacterCreation.module.css'

type PointBuyCreationProps = {
  onComplete: (attributes: AttributeMap, luck?: number) => void
  onBack: () => void
  initialAttributes?: AttributeMap // 初始属性（用于恢复已保存的数据）
  initialLuck?: number // 初始幸运值
}

const DEFAULT_TOTAL_POINTS = 480
const MAX_TOTAL_POINTS = 720
const MIN_LUCK = 30
const MAX_LUCK = 90

/**
 * 购点车卡组件
 * 手动分配 480 点属性
 */
const PointBuyCreation = ({ onComplete, onBack, initialAttributes, initialLuck }: PointBuyCreationProps) => {
  // 如果有初始属性，使用初始属性；否则平均分配 480 点
  const getInitialAttributes = (): AttributeMap => {
    if (initialAttributes) {
      return initialAttributes
    }
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
  }

  const [attributes, setAttributes] = useState<AttributeMap>(getInitialAttributes)

  // 总点数（可调整）
  const [totalPoints, setTotalPoints] = useState<number>(DEFAULT_TOTAL_POINTS)

  // 幸运值（不计入总点数）
  const [luck, setLuck] = useState<number | null>(initialLuck || null)

  // 每个属性的自定义最大值（默认为规则最大值）
  const [attributeMaxValues, setAttributeMaxValues] = useState<AttributeMap>(() => {
    const maxValues: AttributeMap = {} as AttributeMap
    Object.keys(attributes).forEach((key) => {
      maxValues[key as AttributeKey] = ATTRIBUTE_RULES.max
    })
    return maxValues
  })

  // 当初始属性变化时，更新本地状态
  useEffect(() => {
    if (initialAttributes) {
      setAttributes(initialAttributes)
    }
  }, [initialAttributes])

  // 当初始幸运值变化时，更新本地状态
  useEffect(() => {
    if (initialLuck !== undefined) {
      setLuck(initialLuck)
    }
  }, [initialLuck])

  // 计算已用点数
  const usedPoints = useMemo(() => {
    return Object.values(attributes).reduce((sum, value) => sum + value, 0)
  }, [attributes])

  // 剩余点数
  const remainingPoints = totalPoints - usedPoints

  // 调整属性值
  const adjustAttribute = (key: AttributeKey, delta: number) => {
    setAttributes((prev) => {
      const newValue = prev[key] + delta
      const maxValue = attributeMaxValues[key] // 使用自定义最大值
      const clampedValue = Math.max(
        ATTRIBUTE_RULES.min,
        Math.min(maxValue, newValue)
      )
      
      // 检查是否超过总点数限制
      const newAttributes = { ...prev, [key]: clampedValue }
      const newTotal = Object.values(newAttributes).reduce((sum, v) => sum + v, 0)
      
      if (newTotal > totalPoints && delta > 0) {
        // 如果增加后超过限制，不更新
        return prev
      }
      
      return newAttributes
    })
  }

  // 手动设置属性值
  const handleAttributeChange = (key: AttributeKey, value: number) => {
    setAttributes((prev) => {
      const maxValue = attributeMaxValues[key] // 使用自定义最大值
      const clampedValue = Math.max(
        ATTRIBUTE_RULES.min,
        Math.min(maxValue, value)
      )

      // 检查是否超过总点数限制
      const newAttributes = { ...prev, [key]: clampedValue }
      const newTotal = Object.values(newAttributes).reduce((sum, v) => sum + v, 0)

      if (newTotal > totalPoints) {
        // 如果超过限制，不更新
        return prev
      }

      return newAttributes
    })
  }

  // 设置属性的自定义最大值
  const handleMaxValueChange = (key: AttributeKey, value: number) => {
    setAttributeMaxValues((prev) => {
      // 不能超过规则最大值
      const clampedMax = Math.max(
        ATTRIBUTE_RULES.min,
        Math.min(ATTRIBUTE_RULES.max, value)
      )

      // 如果当前属性值超过新的最大值，需要调整属性值
      if (attributes[key] > clampedMax) {
        setAttributes((prevAttrs) => ({
          ...prevAttrs,
          [key]: clampedMax,
        }))
      }

      return { ...prev, [key]: clampedMax }
    })
  }

  // 处理总点数变化
  const handleTotalPointsChange = (value: number) => {
    const clampedValue = Math.max(
      DEFAULT_TOTAL_POINTS,
      Math.min(MAX_TOTAL_POINTS, value)
    )
    setTotalPoints(clampedValue)
  }

  // 处理幸运值变化
  const handleLuckChange = (value: number) => {
    const clampedValue = Math.max(
      MIN_LUCK,
      Math.min(MAX_LUCK, value)
    )
    setLuck(clampedValue)
  }

  const handleConfirm = () => {
    if (remainingPoints === 0 || remainingPoints < 0) {
      onComplete(attributes, luck || undefined)
    }
  }

  const canIncrease = (key: AttributeKey): boolean => {
    const maxValue = attributeMaxValues[key] // 使用自定义最大值
    if (attributes[key] >= maxValue) return false
    if (remainingPoints < ATTRIBUTE_RULES.step) return false
    return true
  }

  const canDecrease = (key: AttributeKey): boolean => {
    return attributes[key] > ATTRIBUTE_RULES.min
  }

  return (
    <Card variant="default" padding="md" className={styles.pointBuyCreation}>
      <PageHeader title="购点车卡" onBack={onBack} />

      <div className={styles.content}>
        {/* 点数统计 */}
        <div className={styles.pointsSummary}>
          <div className={styles.pointsItem}>
            <label className={styles.pointsLabel}>总点数：</label>
            <NumberInput
              value={totalPoints}
              min={DEFAULT_TOTAL_POINTS}
              max={MAX_TOTAL_POINTS}
              step={ATTRIBUTE_RULES.step}
              onChange={(e) => {
                const newValue = parseInt(e.target.value, 10) || DEFAULT_TOTAL_POINTS
                handleTotalPointsChange(newValue)
              }}
              onIncrement={() => handleTotalPointsChange(totalPoints + ATTRIBUTE_RULES.step)}
              onDecrement={() => handleTotalPointsChange(totalPoints - ATTRIBUTE_RULES.step)}
              canIncrement={totalPoints < MAX_TOTAL_POINTS}
              canDecrement={totalPoints > DEFAULT_TOTAL_POINTS}
            />
          </div>
          <StatCard label="已用点数" value={usedPoints} />
          <StatCard
            label="剩余点数"
            value={remainingPoints}
            variant={remainingPoints === 0 ? 'highlight' : remainingPoints < 0 ? 'default' : 'default'}
          />
        </div>

        {/* 幸运值 */}
        <div className={styles.luckSection}>
          <label className={styles.luckLabel}>幸运值（不计入总点数）：</label>
          <NumberInput
            value={luck || MIN_LUCK}
            min={MIN_LUCK}
            max={MAX_LUCK}
            step={ATTRIBUTE_RULES.step}
            onChange={(e) => {
              const newValue = parseInt(e.target.value, 10) || MIN_LUCK
              handleLuckChange(newValue)
            }}
            onIncrement={() => handleLuckChange((luck || MIN_LUCK) + ATTRIBUTE_RULES.step)}
            onDecrement={() => handleLuckChange((luck || MIN_LUCK) - ATTRIBUTE_RULES.step)}
            canIncrement={(luck || MIN_LUCK) < MAX_LUCK}
            canDecrement={(luck || MIN_LUCK) > MIN_LUCK}
          />
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
            const maxValue = attributeMaxValues[attrKey]
            return (
              <Card key={key} variant="outlined" padding="sm" className={styles.attributeCard}>
                <StatCard
                  label={ATTRIBUTE_NAMES[attrKey]}
                  value={value}
                />
                <div className={styles.attributeControls}>
                  <div className={styles.attributeInputGroup}>
                    <label className={styles.attributeLabel}>属性值：</label>
                    <NumberInput
                      value={value}
                      min={ATTRIBUTE_RULES.min}
                      max={maxValue}
                      step={ATTRIBUTE_RULES.step}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value, 10) || ATTRIBUTE_RULES.min
                        handleAttributeChange(attrKey, newValue)
                      }}
                      onIncrement={() => adjustAttribute(attrKey, ATTRIBUTE_RULES.step)}
                      onDecrement={() => adjustAttribute(attrKey, -ATTRIBUTE_RULES.step)}
                      canIncrement={canIncrease(attrKey)}
                      canDecrement={canDecrease(attrKey)}
                    />
                  </div>
                  <div className={styles.maxValueInputGroup}>
                    <label className={styles.maxValueLabel}>最大限制：</label>
                    <NumberInput
                      value={maxValue}
                      min={ATTRIBUTE_RULES.min}
                      max={ATTRIBUTE_RULES.max}
                      step={ATTRIBUTE_RULES.step}
                      onChange={(e) => {
                        const newMax = parseInt(e.target.value, 10) || ATTRIBUTE_RULES.min
                        handleMaxValueChange(attrKey, newMax)
                      }}
                      onIncrement={() => handleMaxValueChange(attrKey, maxValue + ATTRIBUTE_RULES.step)}
                      onDecrement={() => handleMaxValueChange(attrKey, maxValue - ATTRIBUTE_RULES.step)}
                      canIncrement={maxValue < ATTRIBUTE_RULES.max}
                      canDecrement={maxValue > ATTRIBUTE_RULES.min}
                    />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={remainingPoints !== 0}
            fullWidth
          >
            {remainingPoints === 0 ? '确认属性 →' : `还需分配 ${remainingPoints} 点`}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default PointBuyCreation

