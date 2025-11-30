import { useState, useEffect } from 'react'
import type { AttributeMap, Character, BaseCharacterInput } from '@schema/character'
import CharacterSheetPage from '@pages/CharacterSheetPage'
import CharacterListPage from '@pages/CharacterListPage'
import CharacterCreation from '@features/character-creation/CharacterCreation'
import SkillsReferencePage from '@pages/SkillsReferencePage'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import { STORAGE_KEYS } from '@data/constants'
import {
  saveCharacter,
  updateCharacter,
  hasCharacterList,
} from '@services/characterList'
import { setLocalStorageItem, clearAllStorage } from '@utils/storage'
import { Button, ConfirmDialog } from '@components/ui'
import './App.css'

type Page = 'list' | 'sheet' | 'creation' | 'skills'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('list')
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null)
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false)
  const characterBuilder = useCharacterBuilder()
  const { actions, form } = characterBuilder

  // 初始化：检查是否有角色列表
  useEffect(() => {
    // 无论是否有角色列表，都显示列表页面
    // 如果列表为空，用户可以在列表页面点击"创建角色"按钮
    setCurrentPage('list')
    setIsInitialized(true)
  }, [])

  // 从列表选择角色
  const handleSelectCharacter = (character: Character) => {
    // 移除 id 和时间戳，只保留 BaseCharacterInput 数据
    const { id, createdAt, updatedAt, ...characterData } = character
    setCurrentCharacterId(id)
    actions.loadCharacter(characterData)
    setCurrentPage('sheet')
  }

  // 创建新角色
  const handleCreateNew = () => {
    // 重置当前角色ID
    setCurrentCharacterId(null)
    // 清除Larry版临时数据
    setLocalStorageItem(STORAGE_KEYS.creationTempData, null)
    // 重置表单为空值，不设置默认值，让组件从空白状态开始
    actions.updateForm({
      name: '',
      professionId: '',
      attributes: {} as AttributeMap,
      skills: {},
    })
    setCurrentPage('creation')
  }

  // 属性生成完成，保存属性并跳转到角色卡页面
  const handleCreationComplete = (attributes: AttributeMap) => {
  // 保存属性到 characterBuilder
    const characterData: BaseCharacterInput = {
      ...form,
      attributes,
      // 如果没有名称，使用默认名称
      name: form.name || `角色 ${new Date().toLocaleString('zh-CN')}`,
    }

    // 保存到角色列表
    const savedCharacter = saveCharacter(characterData)
    setCurrentCharacterId(savedCharacter.id)
    actions.updateForm(characterData)

    // 跳转到角色卡页面，在主页面完成职业选择和技能分配
    setCurrentPage('sheet')
  }

  // 监听表单变化，自动保存到列表（如果当前角色在列表中）
  useEffect(() => {
    if (currentCharacterId && currentPage === 'sheet' && form.name) {
      // 延迟保存，避免频繁更新
      const timer = setTimeout(() => {
        updateCharacter(currentCharacterId, form)
      }, 500) // 500ms 防抖

      return () => clearTimeout(timer)
    }
  }, [form, currentCharacterId, currentPage])

  // 取消车卡
  const handleCreationCancel = () => {
    if (hasCharacterList()) {
      setCurrentPage('list')
    } else {
      // 如果没有角色列表，重新进入创建流程
      setCurrentPage('creation')
    }
  }

  // 返回角色列表
  const handleBackToList = () => {
    setCurrentPage('list')
  }

  // 处理清除所有缓存
  const handleClearCache = () => {
    // 获取所有存储键
    const allStorageKeys = Object.values(STORAGE_KEYS)
    // 清除所有缓存
    clearAllStorage(allStorageKeys)

    // 重置表单和状态
    actions.updateForm({
      name: '',
      professionId: '',
      attributes: {} as AttributeMap,
      skills: {},
    })
    setCurrentCharacterId(null)
    setShowClearCacheDialog(false)

    // 跳转到列表页面（如果没有角色列表，会自动显示空状态）
    setCurrentPage('list')

    // 刷新页面以完全重置状态
    window.location.reload()
  }

  // 等待初始化完成
  if (!isInitialized) {
    return <div className="app-shell">加载中...</div>
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <h1 className="app-title">COC Tools</h1>
            <p className="app-description">纯前端离线工具 · 即开即用</p>
          </div>
          <div className="app-header-actions">
            {/* 设置按钮（在所有页面都显示） */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearCacheDialog(true)}
              title="清除所有缓存"
              style={{ fontSize: '20px', padding: '6px 10px', minWidth: 'auto' }}
            >
              ⚙️
            </Button>
            {currentPage === 'list' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateNew}
              >
                创建角色
              </Button>
            )}
            {currentPage === 'sheet' && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleBackToList}
                >
                  角色列表
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setCurrentPage('skills')}
                >
                  技能说明
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateNew}
                >
                  创建角色
                </Button>
              </>
            )}
            {currentPage === 'skills' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentPage('sheet')}
              >
                返回角色卡
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'list' && (
          <CharacterListPage
            onSelectCharacter={handleSelectCharacter}
            onCreateNew={handleCreateNew}
          />
        )}
        {currentPage === 'sheet' && <CharacterSheetPage characterBuilder={characterBuilder} />}
        {currentPage === 'creation' && (
          <CharacterCreation
            onComplete={handleCreationComplete}
            onCancel={handleCreationCancel}
          />
        )}
        {currentPage === 'skills' && <SkillsReferencePage />}
      </main>

      {/* 清除缓存确认对话框 */}
      <ConfirmDialog
        isOpen={showClearCacheDialog}
        onClose={() => setShowClearCacheDialog(false)}
        onConfirm={handleClearCache}
        title="清除所有缓存"
        message={
          <div>
            <p style={{ marginBottom: '10px' }}>
              确定要清除所有缓存数据吗？此操作将删除：
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '10px' }}>
              <li>所有已保存的角色</li>
              <li>当前编辑的角色数据</li>
              <li>车卡过程中的临时数据</li>
            </ul>
            <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              此操作不可恢复，请谨慎操作！
            </p>
          </div>
        }
        confirmText="确定清除"
        cancelText="取消"
        confirmVariant="primary"
      />
    </div>
  )
}

export default App
