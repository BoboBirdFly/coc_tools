import type { HTMLAttributes, ReactNode } from 'react'
import styles from './StatCard.module.css'

type StatCardProps = HTMLAttributes<HTMLDivElement> & {
  label: string
  value: ReactNode
  note?: string
  variant?: 'default' | 'highlight'
}

/**
 * 统计卡片组件
 * 用于显示数值统计信息（属性、技能点等）
 */
const StatCard = ({
  label,
  value,
  note,
  variant = 'default',
  className = '',
  ...props
}: StatCardProps) => {
  return (
    <div
      className={`${styles.statCard} ${styles[variant]} ${className}`}
      {...props}
    >
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{value}</strong>
      {note && <span className={styles.note}>{note}</span>}
    </div>
  )
}

export default StatCard

