import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './InfoPopup.module.css'

type InfoPopupProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * 通用信息弹窗组件
 * - 桌面端：浮层显示
 * - 移动端：居中弹窗
 */
const InfoPopup = ({ isOpen, onClose, title, children }: InfoPopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div ref={popupRef} className={styles.popup}>
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </>
  )
}

export default InfoPopup

