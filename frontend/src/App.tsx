import { useState } from 'react'
import type { AttributeMap } from '@schema/character'
import CharacterSheetPage from '@pages/CharacterSheetPage'
import CharacterCreation from '@features/character-creation/CharacterCreation'
import SkillsReferencePage from '@pages/SkillsReferencePage'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import { Button } from '@components/ui'
import './App.css'

type Page = 'sheet' | 'creation' | 'skills'

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
          <div className="app-header-actions">
            {currentPage === 'sheet' && (
              <>
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
                  onClick={() => setCurrentPage('creation')}
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
        {currentPage === 'sheet' && <CharacterSheetPage />}
        {currentPage === 'creation' && (
          <CharacterCreation
            onComplete={handleCreationComplete}
            onCancel={handleCreationCancel}
          />
        )}
        {currentPage === 'skills' && <SkillsReferencePage />}
      </main>
    </div>
  )
}

export default App
