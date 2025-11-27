import { useState } from 'react'
import { InfoPopup } from './index'
import styles from './EditableField.module.css'

type EditableFieldProps = {
  label: string
  value: string
  placeholder?: string
  multiline?: boolean
  onChange: (value: string) => void
}

/**
 * 可编辑字段组件
 * 点击显示编辑弹窗
 */
const EditableField = ({
  label,
  value,
  placeholder = '点击编辑...',
  multiline = true,
  onChange,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleOpen = () => {
    setDraft(value)
    setIsEditing(true)
  }

  const handleSave = () => {
    onChange(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  const displayValue = value || placeholder

  return (
    <div className={styles.container}>
      <div className={styles.field} onClick={handleOpen}>
        <span className={styles.label}>{label}</span>
        <span className={`${styles.value} ${!value ? styles.placeholder : ''}`}>
          {displayValue}
        </span>
        <span className={styles.editIcon}>✎</span>
      </div>

      <InfoPopup
        isOpen={isEditing}
        onClose={handleCancel}
        title={`编辑${label}`}
      >
        <div className={styles.editor}>
          {multiline ? (
            <textarea
              className={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`请输入${label}...`}
              rows={4}
              autoFocus
            />
          ) : (
            <input
              className={styles.input}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`请输入${label}...`}
              autoFocus
            />
          )}
          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              取消
            </button>
            <button className={styles.saveBtn} onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      </InfoPopup>
    </div>
  )
}

export default EditableField

