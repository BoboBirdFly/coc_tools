import type { EquipmentItem } from '@schema/character'

export const ITEMS: EquipmentItem[] = [
  {
    id: 'revolver',
    name: '左轮手枪',
    category: '武器',
    description: '六发手枪，射程近，常见于调查员。',
    weight: 1.2,
  },
  {
    id: 'notebook',
    name: '调查手册',
    category: '工具',
    description: '记录线索、绘制草图的笔记本与铅笔。',
    weight: 0.3,
  },
  {
    id: 'medkit',
    name: '基础医疗包',
    category: '医疗',
    description: '绷带、消毒剂、止血带，可配合急救技能使用。',
    weight: 1,
  },
  {
    id: 'occult-tome',
    name: '神秘学辑要',
    category: '书籍',
    description: '包含古老仪式与传说，可能带来 SAN 代价。',
    weight: 2.4,
  },
  {
    id: 'flashlight',
    name: '电筒',
    category: '工具',
    description: '探索暗处的必备品，续航约 4 小时。',
    weight: 0.6,
  },
  {
    id: 'lucky-charm',
    name: '幸运符',
    category: '其他',
    description: '无实际属性，但常被玩家视作精神寄托。',
  },
]

