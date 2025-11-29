import { useEffect, useState } from 'react'
import type { AttributeMap, AttributeKey } from '@schema/character'
import { ATTRIBUTE_NAMES } from '@data/i18n'
import { ATTRIBUTE_RULES, STORAGE_KEYS } from '@data/constants'
import { roll3d6x5, roll2d6Plus6x5 } from '@utils/dice'
import { getLocalStorageItem, setLocalStorageItem } from '@utils/storage'
import { Button, PageHeader, StatCard, Card } from '@components/ui'
import AttributeTooltip from '@components/AttributeTooltip'
import styles from './CharacterCreation.module.css'

type CreationMode = 'default' | 'larry'

type FateCreationProps = {
  onComplete: (attributes: AttributeMap) => void
  onBack: () => void
  initialAttributes?: AttributeMap // 初始属性（用于恢复已保存的数据）
}

// Larry版属性分组配置
const LARRY_GROUP1_ATTRIBUTES: AttributeKey[] = ['str', 'dex', 'app', 'pow', 'con']
const LARRY_GROUP2_ATTRIBUTES: AttributeKey[] = ['siz', 'int', 'edu']
const LARRY_GROUP1_COUNT = 5
const LARRY_GROUP2_COUNT = 3
const MIN_ATTRIBUTE_VALUE = 30
const MAX_LUCK_VALUE = 90

/**
 * 天命车卡组件
 * 随机生成属性值
 */
const FateCreation = ({ onComplete, onBack, initialAttributes }: FateCreationProps) => {
  const [mode, setMode] = useState<CreationMode>('default')
  const [attributes, setAttributes] = useState<AttributeMap | null>(initialAttributes || null)
  const [luck, setLuck] = useState<number | null>(null) // 幸运值
  const [isGenerating, setIsGenerating] = useState(false)

  // larry版相关状态
  const [larryGroup1, setLarryGroup1] = useState<number[]>([]) // str、dex、app、pow、con 的5个值
  const [larryGroup2, setLarryGroup2] = useState<number[]>([]) // siz、int、edu 的3个值
  const [larryAllocations, setLarryAllocations] = useState<Partial<AttributeMap>>({})

  // 限制值在有效范围内
  const clampValue = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value))
  }

  // 生成幸运值
  const generateLuck = (): number => {
    const luck = roll3d6x5(MIN_ATTRIBUTE_VALUE)
    return clampValue(luck, MIN_ATTRIBUTE_VALUE, MAX_LUCK_VALUE)
  }

  // 生成所有属性（默认随机模式）
  const generateAttributes = () => {
    setIsGenerating(true)
    
    // 模拟骰子动画延迟
    setTimeout(() => {
      const newAttributes: AttributeMap = {
        str: roll3d6x5(MIN_ATTRIBUTE_VALUE),
        con: roll3d6x5(MIN_ATTRIBUTE_VALUE),
        dex: roll3d6x5(MIN_ATTRIBUTE_VALUE),
        app: roll3d6x5(MIN_ATTRIBUTE_VALUE),
        pow: roll3d6x5(MIN_ATTRIBUTE_VALUE),
        siz: roll2d6Plus6x5(MIN_ATTRIBUTE_VALUE),
        int: roll2d6Plus6x5(MIN_ATTRIBUTE_VALUE),
        edu: roll2d6Plus6x5(MIN_ATTRIBUTE_VALUE),
      }
      
      // 确保属性值在有效范围内
      Object.keys(newAttributes).forEach((key) => {
        const attrKey = key as keyof AttributeMap
        newAttributes[attrKey] = clampValue(
          newAttributes[attrKey],
          ATTRIBUTE_RULES.min,
          ATTRIBUTE_RULES.max,
        )
      })

      setAttributes(newAttributes)
      setLuck(generateLuck())
      setIsGenerating(false)
    }, 300)
  }

  // 生成一组属性值
  const generateAttributeGroup = (
    count: number,
    rollFn: () => number,
  ): number[] => {
    const values: number[] = []
    for (let i = 0; i < count; i++) {
      const value = clampValue(rollFn(), ATTRIBUTE_RULES.min, ATTRIBUTE_RULES.max)
      values.push(value)
    }
    return values.sort((a, b) => b - a) // 降序排列
  }

  // 生成larry版属性池
  const generateLarryAttributes = () => {
    setIsGenerating(true)

    setTimeout(() => {
      // 生成第一组属性值（3d6×5）
      const group1 = generateAttributeGroup(
        LARRY_GROUP1_COUNT,
        () => roll3d6x5(MIN_ATTRIBUTE_VALUE),
      )

      // 生成第二组属性值（(2d6+6)×5）
      const group2 = generateAttributeGroup(
        LARRY_GROUP2_COUNT,
        () => roll2d6Plus6x5(MIN_ATTRIBUTE_VALUE),
      )

      setLarryGroup1(group1)
      setLarryGroup2(group2)
      setLarryAllocations({})
      setLuck(generateLuck())
      // 保存状态
      setTimeout(() => {
        saveLarryState()
      }, 0)
      setIsGenerating(false)
    }, 300)
  }

  // larry版：分配属性值
  const handleLarryAllocate = (attribute: AttributeKey, value: number) => {
    setLarryAllocations((prev) => {
      const newAllocations = {
        ...prev,
        [attribute]: value,
      }
      // 实时保存状态
      setTimeout(() => {
        if (mode === 'larry' && larryGroup1.length > 0 && larryGroup2.length > 0) {
          setLocalStorageItem(STORAGE_KEYS.creationTempData, {
            mode: 'larry',
            larryGroup1,
            larryGroup2,
            larryAllocations: newAllocations,
            luck,
          })
        }
      }, 0)
      return newAllocations
    })
  }

  // 随机分配一组属性值
  const randomAllocateGroup = (
    attributes: AttributeKey[],
    availableValues: number[],
  ): Partial<AttributeMap> => {
    const allocations: Partial<AttributeMap> = {}
    const available = [...availableValues] // 复制数组，用于跟踪可用值

    attributes.forEach((attr) => {
      if (available.length === 0) return

      // 随机选择一个可用值
      const randomIndex = Math.floor(Math.random() * available.length)
      const selectedValue = available[randomIndex]
      allocations[attr] = selectedValue

      // 移除已选择的值（只移除一个，因为可能有重复值）
      available.splice(randomIndex, 1)
    })

    return allocations
  }

  // larry版：随机分配属性值
  const handleRandomAllocate = () => {
    if (larryGroup1.length === 0 || larryGroup2.length === 0) {
      return
    }

    // 随机分配第一组和第二组属性
    const group1Allocations = randomAllocateGroup(LARRY_GROUP1_ATTRIBUTES, larryGroup1)
    const group2Allocations = randomAllocateGroup(LARRY_GROUP2_ATTRIBUTES, larryGroup2)

    const newAllocations = {
      ...group1Allocations,
      ...group2Allocations,
    }

    setLarryAllocations(newAllocations)

    // 保存状态
    setTimeout(() => {
      if (mode === 'larry' && larryGroup1.length > 0 && larryGroup2.length > 0) {
        setLocalStorageItem(STORAGE_KEYS.creationTempData, {
          mode: 'larry',
          larryGroup1,
          larryGroup2,
          larryAllocations: newAllocations,
          luck,
        })
      }
    }, 0)
  }

  // 检查一组属性是否已全部分配
  const isGroupComplete = (attributes: AttributeKey[]): boolean => {
    return attributes.every((attr) => larryAllocations[attr] !== undefined)
  }

  // 检查larry版是否已分配完成
  const isLarryComplete = (): boolean => {
    if (mode !== 'larry' || larryGroup1.length === 0 || larryGroup2.length === 0) {
      return false
    }

    return (
      isGroupComplete(LARRY_GROUP1_ATTRIBUTES) &&
      isGroupComplete(LARRY_GROUP2_ATTRIBUTES)
    )
  }

  // 统计数组中每个值出现的次数
  const countOccurrences = (arr: number[], value: number): number => {
    return arr.filter((v) => v === value).length
  }

  // 统计值被使用的次数（排除指定属性）
  const countUsedOccurrences = (value: number, excludeAttribute?: AttributeKey): number => {
    let count = 0
    Object.entries(larryAllocations).forEach(([key, allocatedValue]) => {
      if (allocatedValue === value && key !== excludeAttribute) {
        count++
      }
    })
    return count
  }

  // 检查值是否已被完全使用（排除指定属性）
  // 只有当"被使用次数 >= 出现次数"时才返回true
  // 如果当前属性已经选择了这个值，则始终返回false（允许继续使用）
  const isValueFullyUsed = (
    value: number,
    group: number[],
    excludeAttribute?: AttributeKey,
  ): boolean => {
    // 如果当前属性已经选择了这个值，则不应该显示"已使用"
    if (excludeAttribute && larryAllocations[excludeAttribute] === value) {
      return false
    }

    const occurrences = countOccurrences(group, value)
    const usedCount = countUsedOccurrences(value, excludeAttribute)
    return usedCount >= occurrences
  }

  // 保存larry版状态到临时存储
  const saveLarryState = () => {
    if (mode === 'larry' && larryGroup1.length > 0 && larryGroup2.length > 0) {
      setLocalStorageItem(STORAGE_KEYS.creationTempData, {
        mode: 'larry',
        larryGroup1,
        larryGroup2,
        larryAllocations,
        luck,
      })
    }
  }


  const handleConfirm = () => {
    if (mode === 'default' && attributes) {
      // 清除临时数据
      setLocalStorageItem(STORAGE_KEYS.creationTempData, null)
      onComplete(attributes)
    } else if (mode === 'larry' && isLarryComplete()) {
      const finalAttributes: AttributeMap = {
        str: larryAllocations.str || ATTRIBUTE_RULES.min,
        dex: larryAllocations.dex || ATTRIBUTE_RULES.min,
        app: larryAllocations.app || ATTRIBUTE_RULES.min,
        pow: larryAllocations.pow || ATTRIBUTE_RULES.min,
        con: larryAllocations.con || ATTRIBUTE_RULES.min,
        siz: larryAllocations.siz || ATTRIBUTE_RULES.min,
        int: larryAllocations.int || ATTRIBUTE_RULES.min,
        edu: larryAllocations.edu || ATTRIBUTE_RULES.min,
      }
      // 保存larry版状态
      saveLarryState()
      onComplete(finalAttributes)
    }
  }

  // 切换模式时重置状态
  const handleModeChange = (newMode: CreationMode) => {
    setMode(newMode)
    // 切换模式时，如果有初始属性则保留，否则清空
    if (!initialAttributes) {
      setAttributes(null)
    }
    setLuck(null)
    setLarryGroup1([])
    setLarryGroup2([])
    setLarryAllocations({})
    setIsGenerating(false)

    // 如果切换到非larry模式，清除临时数据
    if (newMode !== 'larry') {
      setLocalStorageItem(STORAGE_KEYS.creationTempData, null)
    }
  }

  // 组件挂载时和initialAttributes变化时，恢复larry版状态
  useEffect(() => {
    const tempData = getLocalStorageItem<{
      mode: CreationMode
      larryGroup1: number[]
      larryGroup2: number[]
      larryAllocations: Partial<AttributeMap>
      luck: number | null
    }>(STORAGE_KEYS.creationTempData)

    if (tempData && tempData.mode === 'larry') {
      // 恢复larry版状态
      setMode('larry')
      setLarryGroup1(tempData.larryGroup1 || [])
      setLarryGroup2(tempData.larryGroup2 || [])
      setLarryAllocations(tempData.larryAllocations || {})
      setLuck(tempData.luck || null)

      // 如果有分配，设置attributes为分配后的结果
      if (Object.keys(tempData.larryAllocations || {}).length > 0) {
        const restoredAttributes: AttributeMap = {
          str: tempData.larryAllocations.str || ATTRIBUTE_RULES.min,
          dex: tempData.larryAllocations.dex || ATTRIBUTE_RULES.min,
          app: tempData.larryAllocations.app || ATTRIBUTE_RULES.min,
          pow: tempData.larryAllocations.pow || ATTRIBUTE_RULES.min,
          con: tempData.larryAllocations.con || ATTRIBUTE_RULES.min,
          siz: tempData.larryAllocations.siz || ATTRIBUTE_RULES.min,
          int: tempData.larryAllocations.int || ATTRIBUTE_RULES.min,
          edu: tempData.larryAllocations.edu || ATTRIBUTE_RULES.min,
        }
        setAttributes(restoredAttributes)
      }
    } else if (initialAttributes && !tempData) {
      // 如果没有larry版状态，但有初始属性，则使用初始属性（默认模式）
      setAttributes(initialAttributes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAttributes]) // 当initialAttributes变化时也执行

  const showDefaultResult = mode === 'default' && attributes && !isGenerating
  const showLarryResult = mode === 'larry' && larryGroup1.length > 0 && larryGroup2.length > 0 && !isGenerating
  const showInitialState = !showDefaultResult && !showLarryResult && !isGenerating

  return (
    <Card variant="default" padding="md" className={styles.fateCreation}>
      <PageHeader title="天命车卡" onBack={onBack} />

      <div className={styles.content}>
        {/* 模式选择下拉框 */}
        <div className={styles.modeSelector}>
          <label htmlFor="creation-mode" className={styles.modeLabel}>
            生成模式：
          </label>
          <select
            id="creation-mode"
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as CreationMode)}
            className={styles.modeSelect}
          >
            <option value="default">默认随机</option>
            <option value="larry">Larry版</option>
          </select>
        </div>

        {/* 初始状态 */}
        {showInitialState && (
          <div className={styles.initialState}>
            <p className={styles.hint}>
              {mode === 'default'
                ? '点击下方按钮随机生成角色属性'
                : '点击下方按钮生成属性池，然后自由分配'}
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={mode === 'default' ? generateAttributes : generateLarryAttributes}
            >
              🎲 生成属性
            </Button>
          </div>
        )}

        {/* 生成中状态 */}
        {isGenerating && (
          <div className={styles.generating}>
            <div className={styles.diceAnimation}>🎲</div>
            <p>正在投掷骰子...</p>
          </div>
        )}

        {/* 默认随机模式结果 */}
        {showDefaultResult && (
          <>
            <div className={styles.attributesGrid}>
              {Object.entries(attributes).map(([key, value]) => {
                const attrKey = key as AttributeKey
                return (
                  <StatCard
                    key={key}
                    label={
                      <span>
                        {ATTRIBUTE_NAMES[attrKey]}
                        <AttributeTooltip attribute={attrKey} />
                      </span>
                    }
                    value={value}
                  />
                )
              })}
              {luck !== null && (
                <StatCard
                  label="幸运"
                  value={luck}
                />
              )}
            </div>

            <div className={styles.actions}>
              <Button variant="secondary" onClick={generateAttributes}>
                🔄 重新生成
              </Button>
              <Button variant="primary" onClick={handleConfirm}>
                确认属性 →
              </Button>
            </div>
          </>
        )}

        {/* Larry版分配界面 */}
        {showLarryResult && (
          <>
            {/* 随机分配按钮 */}
            <div className={styles.larryRandomButton}>
              <Button variant="secondary" onClick={handleRandomAllocate}>
                🎲 随机分配
              </Button>
            </div>

            {/* 第一组：str、dex、app、pow、con */}
            <div className={styles.larrySection}>
              <h3 className={styles.larrySectionTitle}>
                第一组属性（5个3d6×5结果，分配给：力量、敏捷、外貌、意志、体质）
              </h3>
              <div className={styles.larryValues}>
                {larryGroup1.map((value, index) => {
                  const used = isValueFullyUsed(value, larryGroup1)
                  return (
                    <div
                      key={index}
                      className={`${styles.larryValue} ${used ? styles.used : ''}`}
                    >
                      {value}
                    </div>
                  )
                })}
              </div>
              <div className={styles.larryAttributes}>
                {LARRY_GROUP1_ATTRIBUTES.map((attr) => (
                  <div key={attr} className={styles.larryAttributeRow}>
                    <label className={styles.larryAttributeLabel}>
                      {ATTRIBUTE_NAMES[attr]}
                      <AttributeTooltip attribute={attr} />
                      ：
                    </label>
                    <select
                      value={larryAllocations[attr] || ''}
                      onChange={(e) =>
                        handleLarryAllocate(attr, Number(e.target.value))
                      }
                      className={styles.larrySelect}
                    >
                      <option value="">请选择</option>
                      {larryGroup1.map((value, idx) => {
                        const used = isValueFullyUsed(value, larryGroup1, attr)
                        return (
                          <option
                            key={`${attr}-${value}-${idx}`}
                            value={value}
                            disabled={used}
                          >
                            {value}
                            {used ? ' (已使用)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 第二组：siz、int、edu */}
            <div className={styles.larrySection}>
              <h3 className={styles.larrySectionTitle}>
                第二组属性（3个(2d6+6)×5结果，分配给：体型、智力、教育）
              </h3>
              <div className={styles.larryValues}>
                {larryGroup2.map((value, index) => {
                  const used = isValueFullyUsed(value, larryGroup2)
                  return (
                    <div
                      key={index}
                      className={`${styles.larryValue} ${used ? styles.used : ''}`}
                    >
                      {value}
                    </div>
                  )
                })}
              </div>
              <div className={styles.larryAttributes}>
                {LARRY_GROUP2_ATTRIBUTES.map((attr) => (
                  <div key={attr} className={styles.larryAttributeRow}>
                    <label className={styles.larryAttributeLabel}>
                      {ATTRIBUTE_NAMES[attr]}
                      <AttributeTooltip attribute={attr} />
                      ：
                    </label>
                    <select
                      value={larryAllocations[attr] || ''}
                      onChange={(e) =>
                        handleLarryAllocate(attr, Number(e.target.value))
                      }
                      className={styles.larrySelect}
                    >
                      <option value="">请选择</option>
                      {larryGroup2.map((value, idx) => {
                        const used = isValueFullyUsed(value, larryGroup2, attr)
                        return (
                          <option
                            key={`${attr}-${value}-${idx}`}
                            value={value}
                            disabled={used}
                          >
                            {value}
                            {used ? ' (已使用)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 幸运值显示 */}
            {luck !== null && (
              <div className={styles.larrySection}>
                <h3 className={styles.larrySectionTitle}>幸运值</h3>
                <div className={styles.larryValues}>
                  <div className={styles.larryValue}>{luck}</div>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <Button variant="secondary" onClick={generateLarryAttributes}>
                🔄 重新生成
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!isLarryComplete()}
              >
                确认属性 →
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

export default FateCreation

