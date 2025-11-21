import { useState } from 'react'
import type { AttributeMap } from '@schema/character'
import CharacterSheetPage from '@pages/CharacterSheetPage'
import CharacterCreation from '@features/character-creation/CharacterCreation'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import './App.css'

type Page = 'sheet' | 'creation'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('sheet')
  const { actions } = useCharacterBuilder()

  // 车卡完成，跳转到角色卡页面
  const handleCreationComplete = (attributes: AttributeMap, professionId: string) => {
    actions.updateForm({
      attributes,
      professionId,
    })
    setCurrentPage('sheet')
  }

  // 取消车卡，返回角色卡页面
  const handleCreationCancel = () => {
    setCurrentPage('sheet')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-content">
          <div>
            <h1 className="app-title">COC Tools</h1>
            <p className="app-description">纯前端离线工具 · 即开即用</p>
          </div>
          {currentPage === 'sheet' && (
            <button
              className="app-create-button"
              onClick={() => setCurrentPage('creation')}
            >
              ➕ 创建角色
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'sheet' && <CharacterSheetPage />}
        {currentPage === 'creation' && (
          <CharacterCreation
            onComplete={handleCreationComplete}
            onCancel={handleCreationCancel}
          />
        )}
      </main>
    </div>
  )
}

export default App
