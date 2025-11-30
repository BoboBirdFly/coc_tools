import { useMemo } from 'react'
import type { BaseCharacterInput, CharacterBackground, CharacterAssets } from '@schema/character'
import type { FullProfession } from '@data/professions-full'
import ProfessionSelector from '@components/ProfessionSelector'
import { EditableField, Card } from '@components/ui'
import styles from './CharacterForm.module.css'

type CharacterFormProps = {
  value: BaseCharacterInput
  professions: FullProfession[]
  onChange: (payload: Partial<BaseCharacterInput>) => void
  creditRating?: number // 信用评级值
}

/**
 * 根据信用评级计算资产信息（COC7th规则）
 */
const calculateAssetsByCredit = (credit: number): CharacterAssets => {
  // 消费水平对应表
  let spendingLevel = ''
  let cash = ''
  let assets = ''

  if (credit === 0) {
    spendingLevel = '贫困'
    cash = '0.5美元'
    assets = '无'
  } else if (credit <= 9) {
    spendingLevel = '贫穷'
    cash = `${credit}美元`
    assets = `${credit * 10}美元`
  } else if (credit <= 49) {
    spendingLevel = '普通'
    cash = `${credit * 2}美元`
    assets = `${credit * 50}美元`
  } else if (credit <= 89) {
    spendingLevel = '富裕'
    cash = `${credit * 5}美元`
    assets = `${credit * 500}美元`
  } else if (credit <= 98) {
    spendingLevel = '富豪'
    cash = `${credit * 20}美元`
    assets = `${credit * 2000}美元`
  } else {
    spendingLevel = '超级富豪'
    cash = '50000美元'
    assets = '5000000美元+'
  }

  return { spendingLevel, cash, assets }
}

// 背景信息字段配置
const BACKGROUND_FIELDS: { key: keyof CharacterBackground; label: string }[] = [
  { key: 'appearance', label: '形象描述' },
  { key: 'ideology', label: '思想与信念' },
  { key: 'significantPeople', label: '重要之人' },
  { key: 'treasuredPossessions', label: '宝贵之物' },
  { key: 'significantLocations', label: '意义非凡之地' },
  { key: 'traits', label: '特质' },
  { key: 'phobiasAndManias', label: '恐惧症与躁狂症' },
  { key: 'thirdKindEncounters', label: '第三类接触' },
  { key: 'mythosKnowledge', label: '典籍、法术和神话造物' },
  { key: 'inventory', label: '携带物品' },
]

// 资产字段配置
const ASSET_FIELDS: { key: keyof CharacterAssets; label: string }[] = [
  { key: 'spendingLevel', label: '消费水平' },
  { key: 'cash', label: '现金' },
  { key: 'assets', label: '资产' },
]

// 默认背景信息
const DEFAULT_BACKGROUND: CharacterBackground = {
  appearance: '',
  ideology: '',
  significantPeople: '',
  treasuredPossessions: '',
  significantLocations: '',
  traits: '',
  phobiasAndManias: '',
  thirdKindEncounters: '',
  mythosKnowledge: '',
  inventory: '',
}

const CharacterForm = ({
  value,
  professions,
  onChange,
  creditRating = 0,
}: CharacterFormProps) => {
  const background = value.background || DEFAULT_BACKGROUND

  // 根据信用评级自动计算资产
  const calculatedAssets = useMemo(() => calculateAssetsByCredit(creditRating), [creditRating])
  const assets = value.assets || calculatedAssets

  const handleBackgroundChange = (key: keyof CharacterBackground, fieldValue: string) => {
    onChange({
      background: { ...background, [key]: fieldValue },
    })
  }

  const handleAssetChange = (key: keyof CharacterAssets, fieldValue: string) => {
    onChange({
      assets: { ...assets, [key]: fieldValue },
    })
  }

  return (
    <section className="panel">
      <h2>角色信息</h2>
      <div className={styles.section}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            名称
          </label>
          <input
            id="name"
            className={styles.input}
            type="text"
            placeholder="如：调查员 A"
            value={value.name}
            onChange={(event) => onChange({ name: event.target.value })}
          />
        </div>

        <div className={styles.field}>
          <ProfessionSelector
            professions={professions}
            value={value.professionId}
            onChange={(professionId) => onChange({ professionId })}
            attributes={value.attributes}
            renderHelpButton={({ onClick }) => (
              <div className={styles.labelRow}>
                <label className={styles.label} htmlFor="profession">职业</label>
                <button
                  type="button"
                  className={styles.helpBtn}
                  onClick={onClick}
                  title="查看职业详情"
                >
                  ?
                </button>
              </div>
            )}
          />
        </div>
      </div>

      {/* 背景信息 */}
      <Card variant="default" padding="sm" className={styles.backgroundCard}>
        <p className={styles.sectionTitle}>背景信息</p>
        <div className={styles.backgroundGrid}>
          {BACKGROUND_FIELDS.map(({ key, label }) => (
            <EditableField
              key={key}
              label={label}
              value={background[key]}
              onChange={(v) => handleBackgroundChange(key, v)}
            />
          ))}
        </div>
      </Card>

      {/* 资产信息 */}
      <Card variant="default" padding="sm" className={styles.backgroundCard}>
        <p className={styles.sectionTitle}>资产</p>
        <div className={styles.backgroundGrid}>
          {ASSET_FIELDS.map(({ key, label }) => (
            <EditableField
              key={key}
              label={label}
              value={assets[key]}
              multiline={false}
              onChange={(v) => handleAssetChange(key, v)}
            />
          ))}
        </div>
      </Card>
    </section>
  )
}

export default CharacterForm

