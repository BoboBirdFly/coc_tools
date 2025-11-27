import CharacterForm from '@features/character-form/CharacterForm'
import SummaryPanel from '@features/summary-panel/SummaryPanel'
import { FULL_PROFESSIONS } from '@data/professions-full'
import type { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import { calculateSkillCurrentValue } from '@services/skillAllocation'

type CharacterSheetPageProps = {
  characterBuilder: ReturnType<typeof useCharacterBuilder>
}

/**
 * 角色卡页面
 * 显示和编辑已创建的角色
 */
const CharacterSheetPage = ({ characterBuilder }: CharacterSheetPageProps) => {
  const { form, calculated, profession, actions } = characterBuilder

  // 获取信用评级当前值
  const creditRating = calculateSkillCurrentValue('credit-rating', form.attributes, form.skills || {})

  return (
    <>
      <div className="two-column">
        <CharacterForm
          value={form}
          professions={FULL_PROFESSIONS}
          onChange={actions.updateForm}
          creditRating={creditRating}
        />
        <SummaryPanel
          character={calculated}
          profession={profession}
          attributes={form.attributes}
          skillAllocation={form.skills}
        />
      </div>
    </>
  )
}

export default CharacterSheetPage

