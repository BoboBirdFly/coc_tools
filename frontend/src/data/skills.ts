import type { SkillDefinition } from '@schema/character'

export const SKILLS: SkillDefinition[] = [
  {
    id: 'accounting',
    name: '会计',
    category: '学识',
    base: 5,
    description: '处理账目、辨识资金流动',
  },
  {
    id: 'anthropology',
    name: '人类学',
    category: '学识',
    base: 1,
    description: '研究部落文化、语言与风俗',
  },
  {
    id: 'appraise',
    name: '估价',
    category: '社交',
    base: 5,
    description: '鉴定物品真伪与价值',
  },
  {
    id: 'history',
    name: '历史',
    category: '学识',
    base: 5,
    description: '辨识历史事件与背景',
  },
  {
    id: 'library-use',
    name: '图书馆使用',
    category: '调查',
    base: 20,
    description: '高效检索资料、档案',
  },
  {
    id: 'psychology',
    name: '心理学',
    category: '社交',
    base: 10,
    description: '解读他人言行，辨别谎言',
  },
  {
    id: 'spot-hidden',
    name: '侦查',
    category: '调查',
    base: 25,
    description: '发现隐藏物品或细节',
  },
  {
    id: 'stealth',
    name: '潜行',
    category: '生存',
    base: 20,
    description: '无声移动，避免被发现',
  },
  {
    id: 'firearms',
    name: '射击（手枪）',
    category: '战斗',
    base: 20,
    description: '短管火器操作与战斗反应',
  },
  {
    id: 'first-aid',
    name: '急救',
    category: '医疗',
    base: 30,
    description: '止血、包扎，稳定伤势',
  },
]

