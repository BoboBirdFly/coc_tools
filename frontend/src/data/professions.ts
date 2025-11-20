import type { Profession } from '@schema/character'

export const PROFESSIONS: Profession[] = [
  {
    id: 'antique-dealer',
    name: '古董商',
    description: '熟悉文物与鉴定，擅长谈判和历史知识。',
    signatureSkills: ['会计', '估价', '历史', '说服'],
    attributeFocus: { app: 5, int: 5 },
    hpModifier: 0,
  },
  {
    id: 'detective',
    name: '私家侦探',
    description: '调查与潜伏专家，强调敏捷与洞察。',
    signatureSkills: ['侦查', '巧手', '图书馆使用', '心理学'],
    attributeFocus: { dex: 10, int: 5 },
    hpModifier: 5,
  },
  {
    id: 'professor',
    name: '大学教授',
    description: '知识渊博，依赖教育与智力进行推理。',
    signatureSkills: ['母语', '图书馆使用', '历史', '人类学'],
    attributeFocus: { edu: 10, int: 5 },
    hpModifier: -5,
  },
]

