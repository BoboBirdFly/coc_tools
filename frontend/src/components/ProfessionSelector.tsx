import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import type { AttributeMap } from '@schema/character'
import type { FullProfession } from '@data/professions-full'
import { InfoPopup } from './ui'
import styles from './ProfessionSelector.module.css'

type TabType = 'recommended' | 'all'

type ProfessionSelectorProps = {
  professions: FullProfession[]
  value: string // 当前选中的职业ID
  onChange: (professionId: string) => void
  attributes?: AttributeMap // 可选：用于推荐职业计算
  renderHelpButton?: (props: { onClick: () => void; showInfo: boolean }) => React.ReactNode
}

/**
 * 计算职业的技能点数
 * 支持"或"的情况：取较大值
 */
const calculateProfessionSkillPoints = (
  attributes: AttributeMap,
  profession: FullProfession,
): number => {
  return profession.skillFormulas.reduce((sum, part) => {
    // 如果有可选属性，取所有属性（包括主属性和可选属性）中的最大值
    if (part.alternativeAttributes && part.alternativeAttributes.length > 0) {
      const allAttributes = [part.attribute, ...part.alternativeAttributes]
      const maxValue = Math.max(...allAttributes.map(attr => attributes[attr] || 0))
      return sum + maxValue * part.multiplier
    }
    // 没有可选属性，直接使用主属性
    const attributeValue = attributes[part.attribute] || 0
    return sum + attributeValue * part.multiplier
  }, 0)
}

/**
 * 职业选择器组件
 * - 移动端优化：支持搜索、过滤
 * - 显示完整职业信息
 * - 支持推荐职业 tab
 */
const ProfessionSelector = ({
  professions,
  value,
  onChange,
  attributes,
  renderHelpButton
}: ProfessionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [eraFilter, setEraFilter] = useState<'all' | 'classic' | 'modern' | 'any'>('all')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [showInfo, setShowInfo] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 当前选中的职业
  const selectedProfession = professions.find((p) => p.id === value)

  // 检查是否有属性用于推荐
  const hasAttributes = attributes && Object.keys(attributes).length > 0 &&
    Object.values(attributes).every((val) => typeof val === 'number' && val > 0)

  // 计算推荐职业（仅在 activeTab === 'recommended' 且有属性时计算）
  const recommendedProfessions = useMemo(() => {
    if (!hasAttributes || !attributes || activeTab !== 'recommended') {
      return []
    }

    const professionScores = professions.map((profession) => {
      const skillPoints = calculateProfessionSkillPoints(attributes, profession)
      return {
        profession,
        skillPoints,
      }
    })

    // 按技能点数降序排序
    const sorted = professionScores.sort((a, b) => b.skillPoints - a.skillPoints)

    if (sorted.length === 0) {
      return []
    }

    // 获取最高职业点数
    const maxSkillPoints = sorted[0].skillPoints
    const maxScoreProfessions = sorted.filter((item) => item.skillPoints === maxSkillPoints)

    // 如果最大职业点数的职业已经达到或超过6个，返回所有最大职业点数的职业
    if (maxScoreProfessions.length >= 6) {
      return maxScoreProfessions
    }

    // 如果最大职业点数的职业少于6个，继续按顺序添加，直到够6个
    const result: typeof sorted = [...maxScoreProfessions]
    let currentIndex = maxScoreProfessions.length

    while (result.length < 6 && currentIndex < sorted.length) {
      const currentScore = sorted[currentIndex].skillPoints
      const sameScoreGroup: typeof sorted = []

      for (let i = currentIndex; i < sorted.length; i++) {
        if (sorted[i].skillPoints === currentScore) {
          sameScoreGroup.push(sorted[i])
        } else {
          break
        }
      }

      result.push(...sameScoreGroup)
      currentIndex += sameScoreGroup.length

      if (result.length >= 6) {
        break
      }
    }

    return result.slice(0, 6)
  }, [professions, attributes, hasAttributes, activeTab])

  // 获取当前显示的职业列表
  const currentProfessions = useMemo(() => {
    if (activeTab === 'recommended' && hasAttributes) {
      return recommendedProfessions.map(item => item.profession)
    }
    return professions
  }, [activeTab, recommendedProfessions, hasAttributes, professions])

  // 过滤职业列表
  const filteredProfessions = useMemo(() => {
    let result = currentProfessions

    // 时代过滤
    if (eraFilter !== 'all') {
      result = result.filter(
        (p) => p.era === eraFilter || p.era === 'any',
      )
    }

    // 搜索过滤（支持中文名称和英文名称）
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.englishName.toLowerCase().includes(term),
      )
    }

    return result
  }, [currentProfessions, searchTerm, eraFilter])

  const handleSelect = useCallback((professionId: string) => {
    onChange(professionId)
    setIsOpen(false)
    setSearchTerm('')
  }, [onChange])

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // 聚焦搜索框
      setTimeout(() => inputRef.current?.focus(), 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // 处理回车键选择（当只有一个 item 时）
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && filteredProfessions.length === 1) {
        // 检查搜索框是否有焦点
        if (document.activeElement === inputRef.current) {
          event.preventDefault()
          handleSelect(filteredProfessions[0].id)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, filteredProfessions, handleSelect])

  const getEraLabel = (era?: string) => {
    switch (era) {
      case 'classic':
        return '古典'
      case 'modern':
        return '现代'
      default:
        return ''
    }
  }

  // 获取推荐职业的技能点数
  const getRecommendedSkillPoints = (professionId: string): number | undefined => {
    if (activeTab !== 'recommended' || !hasAttributes || !attributes) {
      return undefined
    }
    const item = recommendedProfessions.find(item => item.profession.id === professionId)
    return item?.skillPoints
  }

  return (
    <div className={styles.container} ref={dropdownRef}>
      {/* 如果提供了外部渲染帮助按钮的回调，则调用 */}
      {renderHelpButton && selectedProfession && renderHelpButton({ onClick: () => setShowInfo(!showInfo), showInfo })}

      {/* 输入框触发器 */}
      <div
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen)
          }
        }}
      >
        <span className={styles.triggerText}>
          {selectedProfession ? (
            <>
              {selectedProfession.name}
              {selectedProfession.variant && (
                <span className={styles.variant}> · {selectedProfession.variant}</span>
              )}
            </>
          ) : (
            '请选择职业'
          )}
        </span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* 下拉面板 */}
      {isOpen && (
        <div className={styles.dropdown}>
          {/* Tab 切换 */}
          {hasAttributes && (
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'recommended' ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab('recommended')
                  setSearchTerm('')
                  setEraFilter('all')
                }}
              >
                推荐职业
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
                onClick={() => {
                  setActiveTab('all')
                  setSearchTerm('')
                  setEraFilter('all')
                }}
              >
                全部职业
              </button>
            </div>
          )}

          {/* 搜索框 */}
          <div className={styles.searchBox}>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="搜索职业（中文/英文）..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* 时代过滤器 */}
          {activeTab === 'all' && (
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${eraFilter === 'all' ? styles.active : ''}`}
                onClick={() => setEraFilter('all')}
              >
                全部
              </button>
              <button
                className={`${styles.filterBtn} ${eraFilter === 'classic' ? styles.active : ''}`}
                onClick={() => setEraFilter('classic')}
              >
                古典
              </button>
              <button
                className={`${styles.filterBtn} ${eraFilter === 'modern' ? styles.active : ''}`}
                onClick={() => setEraFilter('modern')}
              >
                现代
              </button>
            </div>
          )}

          {/* 职业列表 */}
          <div className={styles.list}>
            {filteredProfessions.length === 0 ? (
              <div className={styles.empty}>未找到匹配的职业</div>
            ) : (
                filteredProfessions.map((profession) => {
                  const skillPoints = getRecommendedSkillPoints(profession.id)
                  return (
                    <div
                      key={profession.id}
                      className={`${styles.item} ${profession.id === value ? styles.selected : ''}`}
                      onClick={() => handleSelect(profession.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleSelect(profession.id)
                        }
                      }}
                    >
                      <div className={styles.itemHeader}>
                        <span className={styles.itemName}>{profession.name}</span>
                        {profession.era && profession.era !== 'any' && (
                          <span className={styles.eraTag}>{getEraLabel(profession.era)}</span>
                        )}
                      </div>
                      {profession.variant && (
                        <div className={styles.itemVariant}>{profession.variant}</div>
                      )}
                      {skillPoints !== undefined && (
                        <div className={styles.skillPoints}>
                          <span className={styles.skillPointsLabel}>职业技能点：</span>
                          <span className={styles.skillPointsValue}>{skillPoints}</span>
                        </div>
                      )}
                    </div>
                  )
                })
            )}
          </div>
        </div>
      )}

      {/* 职业详情弹窗 */}
      {selectedProfession && (
        <InfoPopup
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
          title={selectedProfession.name}
        >
          <p className={styles.description}>{selectedProfession.description}</p>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              信用范围：{selectedProfession.creditRange.min}-{selectedProfession.creditRange.max}
            </span>
            {selectedProfession.recommendedContacts.length > 0 && (
              <span className={styles.metaItem}>
                推荐关系人：{selectedProfession.recommendedContacts.join('、')}
              </span>
            )}
          </div>
        </InfoPopup>
      )}
    </div>
  )
}

export default ProfessionSelector
