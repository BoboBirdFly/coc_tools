import type { AttributeKey } from '@schema/character'
import { ATTRIBUTE_NAMES, SECONDARY_NAMES } from '@data/i18n'
import { Tooltip } from './ui'
import styles from './AttributeTooltip.module.css'

type AttributeTooltipProps = {
  attribute: AttributeKey
}

/**
 * 属性说明文案（根据 COC7th 规则）
 */
const getAttributeDescription = (attribute: AttributeKey): string => {
  const descriptions: Record<AttributeKey, string> = {
    str: `力量(STR): 角色的物理力量。影响近战伤害和负重能力。`,
    con: `体质(CON): 角色的身体耐力和健康程度。影响生命值（HP = (体质 + 体型) / 10）。`,
    dex: `敏捷(DEX): 角色的灵活性和反应速度。影响移动力计算（与力量、体型共同决定）。`,
    int: `智力(INT): 角色的学习能力和逻辑思维。影响兴趣技能点数（INT × 2）。`,
    pow: `意志(POW): 角色的精神力量和意志力。影响理智值（SAN = 意志）、幸运（幸运 = 意志）和魔法值（MP = 意志 / 5）。`,
    siz: `体型(SIZ): 角色的身体大小。影响生命值（HP = (体质 + 体型) / 10）和移动力计算。`,
    app: `外貌(APP): 角色的外表魅力。影响社交互动和某些技能检定。`,
    edu: `教育(EDU): 角色的教育背景和知识水平。影响职业技能点数（通常为 EDU × 2 或 EDU × 4）。`,
  }
  return descriptions[attribute]
}

/**
 * 获取属性影响的二级属性列表
 */
const getAffectedSecondaries = (attribute: AttributeKey): string[] => {
  const affected: Record<AttributeKey, string[]> = {
    str: [],
    con: [SECONDARY_NAMES.hp],
    dex: [SECONDARY_NAMES.mov],
    int: [],
    pow: [SECONDARY_NAMES.san, SECONDARY_NAMES.luck, SECONDARY_NAMES.mp],
    siz: [SECONDARY_NAMES.hp, SECONDARY_NAMES.mov],
    app: [],
    edu: [],
  }
  return affected[attribute]
}

/**
 * 属性说明浮层组件
 * 基于通用 Tooltip 组件实现
 */
const AttributeTooltip = ({ attribute }: AttributeTooltipProps) => {
  const description = getAttributeDescription(attribute)
  const affectedSecondaries = getAffectedSecondaries(attribute)

  return (
    <Tooltip
      content={
        <div className={styles.tooltipContent}>
          <div className={styles.header}>
            <strong>{ATTRIBUTE_NAMES[attribute]}</strong>
          </div>
          <div className={styles.content}>
            <p className={styles.description}>{description}</p>
            {affectedSecondaries.length > 0 && (
              <div className={styles.affected}>
                <span className={styles.affectedLabel}>影响的二级属性：</span>
                <span className={styles.affectedList}>
                  {affectedSecondaries.join('、')}
                </span>
              </div>
            )}
          </div>
        </div>
      }
      position="bottom"
      trigger="click"
    >
      <button
        type="button"
        className={styles.icon}
        aria-label={`${ATTRIBUTE_NAMES[attribute]}说明`}
        title={`${ATTRIBUTE_NAMES[attribute]}说明`}
      >
        ?
      </button>
    </Tooltip>
  )
}

export default AttributeTooltip

