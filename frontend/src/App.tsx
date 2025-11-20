import CharacterForm from '@features/character-form/CharacterForm'
import SummaryPanel from '@features/summary-panel/SummaryPanel'
import { PROFESSIONS } from '@data/professions'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import './App.css'

function App() {
  const { form, calculated, profession, actions } = useCharacterBuilder()

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">COC 角色工坊</h1>
        <p className="app-description">纯前端离线工具 · 即开即用</p>
      </header>

      <main className="app-main">
        <div className="two-column">
          <CharacterForm
            value={form}
            professions={PROFESSIONS}
            onChange={actions.updateForm}
            onAttributeChange={actions.updateAttribute}
          />
          <SummaryPanel character={calculated} profession={profession} />
        </div>
      </main>
    </div>
  )
}

export default App
