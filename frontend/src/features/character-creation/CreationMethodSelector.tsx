import { Card } from '@components/ui'
import styles from './CharacterCreation.module.css'

type CreationMethod = 'fate' | 'point-buy' | null

type CreationMethodSelectorProps = {
  onSelect: (method: CreationMethod) => void
}

/**
 * 车卡方式选择组件
 * 展示两种车卡方式：天命、购点
 */
const CreationMethodSelector = ({ onSelect }: CreationMethodSelectorProps) => {
  return (
    <Card variant="default" padding="md" className={styles.methodSelector}>
      <h2 className={styles.title}>选择车卡方式</h2>
      <p className={styles.subtitle}>请选择一种方式创建角色属性</p>
      
      <div className={styles.methodGrid}>
        {/* 天命车卡 */}
        <button
          className={styles.methodCard}
          onClick={() => onSelect('fate')}
        >
          <div className={styles.methodIcon}>🎲</div>
          <h3 className={styles.methodTitle}>天命</h3>
          <p className={styles.methodDescription}>
            随机生成属性值
          </p>
          <div className={styles.methodDetails}>
            <div className={styles.detailItem}>
              <strong>力量、外貌、体质、敏捷、意志：</strong>
              <span>3d6 × 5</span>
            </div>
            <div className={styles.detailItem}>
              <strong>体型、智力、教育：</strong>
              <span>(2d6 + 6) × 5</span>
            </div>
          </div>
        </button>

        {/* 购点车卡 */}
        <button
          className={styles.methodCard}
          onClick={() => onSelect('point-buy')}
        >
          <div className={styles.methodIcon}>⚖️</div>
          <h3 className={styles.methodTitle}>购点</h3>
          <p className={styles.methodDescription}>
            手动分配属性点
          </p>
          <div className={styles.methodDetails}>
            <div className={styles.detailItem}>
              <strong>总点数：</strong>
              <span>480 点</span>
            </div>
            <div className={styles.detailItem}>
              <strong>范围：</strong>
              <span>15-90（每次调整 5）</span>
            </div>
          </div>
        </button>
      </div>
    </Card>
  )
}

export default CreationMethodSelector

