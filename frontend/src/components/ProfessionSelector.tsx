import { useState, useMemo, useRef, useEffect } from 'react'
import type { FullProfession } from '@data/professions-full'
import styles from './ProfessionSelector.module.css'

type ProfessionSelectorProps = {
  professions: FullProfession[]
  value: string // 当前选中的职业ID
  onChange: (professionId: string) => void
}

/**
 * 职业选择器组件
 * - 移动端优化：支持搜索、过滤
 * - 显示完整职业信息
 */
const ProfessionSelector = ({ professions, value, onChange }: ProfessionSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [eraFilter, setEraFilter] = useState<'all' | 'classic' | 'modern' | 'any'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 当前选中的职业
  const selectedProfession = professions.find((p) => p.id === value)

  // 过滤职业列表
  const filteredProfessions = useMemo(() => {
    let result = professions

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
  }, [professions, searchTerm, eraFilter])

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

  const handleSelect = (professionId: string) => {
    onChange(professionId)
    setIsOpen(false)
    setSearchTerm('')
  }

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

  return (
    <div className={styles.container} ref={dropdownRef}>
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

          {/* 职业列表 */}
          <div className={styles.list}>
            {filteredProfessions.length === 0 ? (
              <div className={styles.empty}>未找到匹配的职业</div>
            ) : (
              filteredProfessions.map((profession) => (
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
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 职业信息卡片（选择后显示） */}
      {selectedProfession && !isOpen && (
        <div className={styles.infoCard}>
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
        </div>
      )}
    </div>
  )
}

export default ProfessionSelector

