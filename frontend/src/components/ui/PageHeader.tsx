import type { HTMLAttributes, ReactNode } from 'react'
import Button from './Button'
import styles from './PageHeader.module.css'

type PageHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
  actions?: ReactNode
}

/**
 * 页面头部组件
 * 统一页面头部布局，包含标题、返回按钮、操作按钮等
 */
const PageHeader = ({
  title,
  subtitle,
  onBack,
  backLabel = '← 返回',
  actions,
  className = '',
  ...props
}: PageHeaderProps) => {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      <div className={styles.left}>
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}

export default PageHeader

