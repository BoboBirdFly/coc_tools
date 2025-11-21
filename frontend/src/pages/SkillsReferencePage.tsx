import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { SkillCategory, SkillDefinition } from '@schema/character'
import { SKILLS } from '@data/skills'
import { SKILL_CATEGORY_NAMES } from '@data/i18n'
import { PageHeader, Card, Button } from '@components/ui'
import styles from './SkillsReferencePage.module.css'

/**
 * 技能说明页面
 * 提供技能搜索、筛选和详情查看功能
 */
const SkillsReferencePage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all')
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null)

  // 所有技能分类
  const categories: (SkillCategory | 'all')[] = ['all', ...Object.keys(SKILL_CATEGORY_NAMES) as SkillCategory[]]

  // 过滤技能
  const filteredSkills = useMemo(() => {
    let result = SKILLS

    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter((skill) => skill.category === selectedCategory)
    }

    // 搜索筛选
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (skill) =>
          skill.name.toLowerCase().includes(term) ||
          skill.description?.toLowerCase().includes(term) ||
          skill.id.toLowerCase().includes(term),
      )
    }

    return result
  }, [searchTerm, selectedCategory])

  // 切换分类
  const handleCategoryChange = (category: SkillCategory | 'all') => {
    setSelectedCategory(category)
    setExpandedSkillId(null) // 切换分类时收起详情
  }

  // 切换技能详情
  const toggleSkillDetail = (skillId: string) => {
    setExpandedSkillId(expandedSkillId === skillId ? null : skillId)
  }

  // 清空搜索
  const handleClearSearch = () => {
    setSearchTerm('')
  }

  return (
    <div className={styles.container}>
      <PageHeader
        title="技能说明"
        subtitle="查找和了解 COC7th 技能详情"
      />

      {/* 搜索栏 */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="搜索技能名称或描述..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className={styles.clearButton}
              onClick={handleClearSearch}
              aria-label="清空搜索"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className={styles.searchResultCount}>
            找到 {filteredSkills.length} 个技能
          </div>
        )}
      </div>

      {/* 分类筛选 */}
      <div className={styles.filterSection}>
        <div className={styles.filterLabel}>分类：</div>
        <div className={styles.filterButtons}>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange(category)}
            >
              {category === 'all' ? '全部' : SKILL_CATEGORY_NAMES[category]}
            </Button>
          ))}
        </div>
      </div>

      {/* 技能列表 */}
      <div className={styles.skillsList}>
        {filteredSkills.length === 0 ? (
          <Card variant="outlined" padding="md" className={styles.emptyState}>
            <p className={styles.emptyText}>
              {searchTerm
                ? `未找到包含"${searchTerm}"的技能`
                : '暂无技能数据'}
            </p>
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                清空搜索
              </Button>
            )}
          </Card>
        ) : (
          filteredSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isExpanded={expandedSkillId === skill.id}
              onToggle={() => toggleSkillDetail(skill.id)}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>
    </div>
  )
}

type SkillCardProps = {
  skill: SkillDefinition
  isExpanded: boolean
  onToggle: () => void
  searchTerm: string
}

/**
 * 技能卡片组件
 */
const SkillCard = ({ skill, isExpanded, onToggle, searchTerm }: SkillCardProps) => {
  // 高亮搜索词
  const highlightText = (text: string, term: string): ReactNode => {
    if (!term.trim()) return text

    const parts = text.split(new RegExp(`(${term})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={index} className={styles.highlight}>
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <Card
      variant="default"
      padding="md"
      className={`${styles.skillCard} ${isExpanded ? styles.expanded : ''}`}
    >
      <div className={styles.skillHeader} onClick={onToggle}>
        <div className={styles.skillInfo}>
          <h3 className={styles.skillName}>
            {highlightText(skill.name, searchTerm)}
          </h3>
          <div className={styles.skillMeta}>
            <span className={styles.skillCategory}>{SKILL_CATEGORY_NAMES[skill.category]}</span>
            <span className={styles.skillBase}>基础值：{skill.base}%</span>
          </div>
        </div>
        <button
          className={styles.expandButton}
          aria-label={isExpanded ? '收起' : '展开'}
          aria-expanded={isExpanded}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {skill.description && (
        <div className={styles.skillDescription}>
          {highlightText(skill.description, searchTerm)}
        </div>
      )}

      {isExpanded && (
        <div className={styles.skillDetail}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>技能ID：</span>
            <span className={styles.detailValue}>{skill.id}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>分类：</span>
            <span className={styles.detailValue}>{SKILL_CATEGORY_NAMES[skill.category]}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>基础值：</span>
            <span className={styles.detailValue}>{skill.base}%</span>
          </div>
          {skill.description && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>说明：</span>
              <span className={styles.detailValue}>{skill.description}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default SkillsReferencePage

