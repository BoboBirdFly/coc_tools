import { useState, useMemo, useEffect } from 'react'
import type { AttributeMap, SkillAllocation } from '@schema/character'
import CreationMethodSelector from './CreationMethodSelector'
import FateCreation from './FateCreation'
import PointBuyCreation from './PointBuyCreation'
import ProfessionSelector from '@components/ProfessionSelector'
import SkillAllocationComponent from './SkillAllocation'
import StepIndicator from '@components/StepIndicator'
import ProfessionRecommendations from '@components/ProfessionRecommendations'
import { FULL_PROFESSIONS } from '@data/professions-full'
import { calculateSkillBudgets } from '@services/calculator'
import { useCharacterBuilder } from '@hooks/useCharacterBuilder'
import { Button, PageHeader, Card } from '@components/ui'
import styles from './CharacterCreation.module.css'

type CreationMethod = 'fate' | 'point-buy' | null
type CreationStep = 'method' | 'attributes' | 'profession' | 'skills'

type CharacterCreationProps = {
  onComplete: (attributes: AttributeMap, professionId: string, skills?: SkillAllocation) => void
  onCancel: () => void
}

/**
 * 车卡页面主组件
 * 管理车卡流程：选择方式 → 生成属性 → 选择职业 → 分配技能
 */
const CharacterCreation = ({ onComplete, onCancel }: CharacterCreationProps) => {
  const [step, setStep] = useState<CreationStep>('method')
  const [method, setMethod] = useState<CreationMethod>(null)
  const [attributes, setAttributes] = useState<AttributeMap | null>(null)
  const [selectedProfessionId, setSelectedProfessionId] = useState<string>('')
  const [skills, setSkills] = useState<SkillAllocation>({})
  const characterBuilder = useCharacterBuilder()
  const { actions, form } = characterBuilder

  // 从 characterBuilder 恢复已保存的数据（组件首次加载时）
  useEffect(() => {
    // 只在本地状态为空时恢复，避免覆盖用户输入
    if (form.attributes && Object.keys(form.attributes).length > 0 && !attributes) {
      setAttributes(form.attributes)
    }
    if (form.professionId && !selectedProfessionId) {
      setSelectedProfessionId(form.professionId)
    }
    if (form.skills && Object.keys(form.skills).length > 0 && Object.keys(skills).length === 0) {
      setSkills(form.skills)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 当步骤变化时，从 characterBuilder 恢复对应步骤的数据
  useEffect(() => {
    if (step === 'attributes') {
      // 返回到属性步骤时，恢复已保存的属性
      if (form.attributes && Object.keys(form.attributes).length > 0) {
        setAttributes(form.attributes)
      }
    }
    if (step === 'profession') {
      // 返回到职业步骤时，恢复已保存的职业
      if (form.professionId) {
        setSelectedProfessionId(form.professionId)
      }
      // 确保属性已恢复（因为职业步骤需要属性）
      if (form.attributes && Object.keys(form.attributes).length > 0 && !attributes) {
        setAttributes(form.attributes)
      }
    }
    if (step === 'skills') {
      // 返回到技能步骤时，恢复已保存的技能
      if (form.skills && Object.keys(form.skills).length > 0) {
        setSkills(form.skills)
      }
      // 确保属性和职业已恢复
      if (form.attributes && Object.keys(form.attributes).length > 0 && !attributes) {
        setAttributes(form.attributes)
      }
      if (form.professionId && !selectedProfessionId) {
        setSelectedProfessionId(form.professionId)
      }
    }
  }, [step, form, attributes, selectedProfessionId])

  // 获取当前职业
  const currentProfession = useMemo(() => {
    return FULL_PROFESSIONS.find((p) => p.id === selectedProfessionId)
  }, [selectedProfessionId])

  // 计算技能点预算
  const skillBudgets = useMemo(() => {
    if (!attributes) return { occupation: 0, personal: 0 }
    return calculateSkillBudgets(attributes, currentProfession)
  }, [attributes, currentProfession])

  // 选择车卡方式
  const handleMethodSelect = (selectedMethod: CreationMethod) => {
    setMethod(selectedMethod)
    setStep('attributes')
  }

  // 属性生成完成
  const handleAttributesComplete = (generatedAttributes: AttributeMap) => {
    setAttributes(generatedAttributes)
    // 保存属性到 characterBuilder
    actions.updateForm({ attributes: generatedAttributes })
    setStep('profession')
  }

  // 选择职业
  const handleProfessionSelect = (professionId: string) => {
    setSelectedProfessionId(professionId)
    // 保存职业到 characterBuilder
    if (attributes) {
      actions.updateForm({ professionId })
    }
    if (attributes && professionId) {
      setStep('skills')
    }
  }

  // 技能分配更新（实时保存）
  const handleSkillsChange = (newSkills: SkillAllocation) => {
    setSkills(newSkills)
    // 实时保存技能分配
    if (attributes && selectedProfessionId) {
      actions.updateForm({ skills: newSkills })
    }
  }

  // 技能分配完成
  const handleSkillsComplete = (completedSkills: SkillAllocation) => {
    setSkills(completedSkills)
    if (attributes && selectedProfessionId) {
      // 保存最终技能分配
      actions.updateForm({ skills: completedSkills })
      onComplete(attributes, selectedProfessionId, completedSkills)
    }
  }

  // 保存当前步骤的数据
  const saveCurrentStepData = () => {
    if (attributes) {
      const dataToSave: Partial<{ attributes: AttributeMap; professionId: string; skills: SkillAllocation }> = {
        attributes,
      }

      if (selectedProfessionId) {
        dataToSave.professionId = selectedProfessionId
      }

      if (Object.keys(skills).length > 0) {
        dataToSave.skills = skills
      }

      actions.updateForm(dataToSave)
    }
  }

  // 返回上一步
  const handleBack = () => {
    // 在返回前保存当前步骤的数据
    saveCurrentStepData()

    if (step === 'skills') {
      setStep('profession')
    } else if (step === 'profession') {
      setStep('attributes')
    } else if (step === 'attributes') {
      setStep('method')
      setMethod(null)
      setAttributes(null)
      setSelectedProfessionId('')
      setSkills({})
    }
  }

  // 步骤配置
  const stepConfig = {
    method: { number: 1, label: '选择方式' },
    attributes: { number: 2, label: '生成属性' },
    profession: { number: 3, label: '选择职业' },
    skills: { number: 4, label: '分配技能' },
  }

  const currentStepNumber = stepConfig[step].number
  const stepLabels = [
    stepConfig.method.label,
    stepConfig.attributes.label,
    stepConfig.profession.label,
    stepConfig.skills.label,
  ]

  return (
    <div className={styles.characterCreation}>
      {/* 步骤指示器 */}
      <StepIndicator
        currentStep={currentStepNumber}
        totalSteps={4}
        stepLabels={stepLabels}
      />

      {step === 'method' && (
        <CreationMethodSelector onSelect={handleMethodSelect} />
      )}

      {step === 'attributes' && method === 'fate' && (
        <FateCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
          initialAttributes={attributes || undefined}
        />
      )}

      {step === 'attributes' && method === 'point-buy' && (
        <PointBuyCreation
          onComplete={handleAttributesComplete}
          onBack={handleBack}
          initialAttributes={attributes || undefined}
        />
      )}

      {step === 'profession' && attributes && (
        <div className={styles.professionStepContainer}>
          <Card variant="default" padding="md" className={styles.professionStep}>
            <PageHeader title="选择职业" onBack={handleBack} />
            <div className={styles.content}>
              <p className={styles.hint}>
                属性已生成，请选择角色的职业
              </p>

              {/* 职业推荐 */}
              <ProfessionRecommendations
                attributes={attributes}
                professions={FULL_PROFESSIONS}
                onSelect={handleProfessionSelect}
              />

              {/* 职业选择器 */}
              <div className={styles.professionSelector}>
                <h3 className={styles.selectorTitle}>所有职业</h3>
                <ProfessionSelector
                  professions={FULL_PROFESSIONS}
                  value={selectedProfessionId}
                  onChange={handleProfessionSelect}
                />
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 'skills' && attributes && currentProfession && (
        <SkillAllocationComponent
          attributes={attributes}
          profession={currentProfession}
          skillBudgets={skillBudgets}
          onComplete={handleSkillsComplete}
          onBack={handleBack}
          onChange={handleSkillsChange}
          initialAllocation={skills}
        />
      )}

      <div className={styles.footer}>
        <Button variant="ghost" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}

export default CharacterCreation

