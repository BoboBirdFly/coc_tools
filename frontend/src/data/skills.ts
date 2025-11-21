import type { SkillDefinition } from '@schema/character'

// 参考 docs/coc7th调查员手册.md 的技能基础值
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
    id: 'credit-rating',
    name: '信用评级',
    category: '社交',
    base: 0,
    description: '社会地位与资源调动能力',
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
    id: 'sleight-of-hand',
    name: '巧手',
    category: '技艺',
    base: 10,
    description: '扒窃、藏匿小物件',
  },
  {
    id: 'persuade',
    name: '说服',
    category: '社交',
    base: 10,
    description: '通过逻辑与事实影响他人',
  },
  {
    id: 'art-craft-shorthand',
    name: '技艺：速记',
    category: '技艺',
    base: 5,
    description: '快速记录访谈或会议内容',
  },
  {
    id: 'occult',
    name: '神秘学',
    category: '学识',
    base: 5,
    description: '了解各种超自然传说',
  },
  {
    id: 'cthulhu-mythos',
    name: '克苏鲁神话',
    category: '学识',
    base: 0,
    description: '有关 Mythos 的禁忌知识',
  },
  {
    id: 'medicine',
    name: '医学',
    category: '医疗',
    base: 1,
    description: '系统性诊疗与手术能力',
  },
  {
    id: 'first-aid',
    name: '急救',
    category: '医疗',
    base: 30,
    description: '止血、包扎，稳定伤势',
  },
  {
    id: 'handgun',
    name: '射击（手枪）',
    category: '战斗',
    base: 20,
    description: '短管火器操作与战斗反应',
  },
  {
    id: 'language-native',
    name: '母语',
    category: '学识',
    base: 0,
    description: '等同 EDU，代表受教育语言的掌握',
  },
]

export const SKILL_MAP = SKILLS.reduce<Record<string, SkillDefinition>>((acc, skill) => {
  acc[skill.id] = skill
  return acc
}, {})

export const getSkillById = (id: string) => SKILL_MAP[id]

