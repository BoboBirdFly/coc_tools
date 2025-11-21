import CharacterForm from '@features/character-form/CharacterForm'
import SummaryPanel from '@features/summary-panel/SummaryPanel'
import { FULL_PROFESSIONS } from '@data/professions-full'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'

/**
 * 角色卡页面
 * 显示和编辑已创建的角色
 */
const CharacterSheetPage = () => {
  const { form, calculated, profession, actions } = useCharacterBuilder()

  return (
    <>
      <div className="two-column">
        <CharacterForm
          value={form}
          professions={FULL_PROFESSIONS}
          onChange={actions.updateForm}
          onAttributeChange={actions.updateAttribute}
        />
        <SummaryPanel character={calculated} profession={profession} />
      </div>
    </>
  )
}

export default CharacterSheetPage

