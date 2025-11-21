import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './Tooltip.module.css'

type TooltipProps = {
  content: ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  trigger?: 'click' | 'hover'
  showCloseButton?: boolean
}

/**
 * 通用工具提示组件
 * 支持点击和悬停触发，可自定义位置
 */
const Tooltip = ({
  content,
  children,
  position = 'bottom',
  trigger = 'click',
  showCloseButton = true,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen || trigger !== 'click') return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, trigger])

  const handleToggle = () => {
    if (trigger === 'click') {
      setIsOpen(!isOpen)
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsOpen(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsOpen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onClick={handleToggle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`${styles.tooltip} ${styles[position]}`}
        >
          <div className={styles.content}>
            {showCloseButton && trigger === 'click' && (
              <button
                className={styles.closeButton}
                onClick={(e) => {
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                aria-label="关闭"
              >
                ×
              </button>
            )}
            {content}
          </div>
        </div>
      )}
    </div>
  )
}

export default Tooltip

