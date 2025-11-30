import { useEffect, useRef, useMemo } from 'react'
import CharacterForm from '@features/character-form/CharacterForm'
import SummaryPanel from '@features/summary-panel/SummaryPanel'
import OptionalSkillSelector from '@components/OptionalSkillSelector'
import { FULL_PROFESSIONS } from '@data/professions-full'
import type { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import { calculateSkillCurrentValue } from '@services/skillAllocation'
import { Card } from '@components/ui'

type CharacterSheetPageProps = {
  characterBuilder: ReturnType<typeof useCharacterBuilder>
}

/**
 * 角色卡页面
 * 显示和编辑已创建的角色
 * 用户可以在此页面中自由选择职业和分配技能
 */
const CharacterSheetPage = ({ characterBuilder }: CharacterSheetPageProps) => {
  const { form, calculated, profession, actions } = characterBuilder
  const previousProfessionIdRef = useRef<string | undefined>(form.professionId)

  // 从 form 中获取可选技能选择，如果没有则初始化为空对象
  const selectedOptionalSkills = form.optionalSkills || {}

  // 检测职业变化
  useEffect(() => {
    const currentProfessionId = form.professionId
    const previousProfessionId = previousProfessionIdRef.current

    // 如果职业发生变化
    if (currentProfessionId && currentProfessionId !== previousProfessionId && previousProfessionId !== undefined) {
      // 清除所有技能分配和可选技能选择
      actions.updateForm({
        skills: {},
        optionalSkills: undefined
      })
    }

    // 更新引用
    previousProfessionIdRef.current = currentProfessionId
  }, [form.professionId, actions])

  // 检查是否需要显示可选技能选择器
  const needsOptionalSkillSelection = useMemo(() => {
    if (!profession) return false
    if (!profession.optionalSkillGroups || profession.optionalSkillGroups.length === 0) {
      return false
    }
    // 检查是否所有可选技能组都已选择完成
    return !profession.optionalSkillGroups.every((group, index) => {
      const selected = selectedOptionalSkills[index] || []
      return selected.length === group.count
    })
  }, [profession, selectedOptionalSkills])

  // 处理可选技能选择完成
  const handleOptionalSkillsComplete = (selected: Record<number, string[]>) => {
    actions.updateForm({ optionalSkills: selected })
  }

  // 获取信用评级当前值
  const creditRating = calculateSkillCurrentValue('credit-rating', form.attributes || {}, form.skills || {})

  // 如果需要选择可选技能，显示选择界面
  if (profession && needsOptionalSkillSelection) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <Card variant="default" padding="md">
          <OptionalSkillSelector
            profession={profession}
            onComplete={handleOptionalSkillsComplete}
            initialSelection={selectedOptionalSkills}
          />
        </Card>
      </div>
    )
  }

  // 正常显示角色卡
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
          attributes={form.attributes || {}}
          skillAllocation={form.skills}
          onSkillAllocationChange={(allocation) => actions.updateForm({ skills: allocation })}
        />
      </div>
    </>
  )
}

export default CharacterSheetPage

