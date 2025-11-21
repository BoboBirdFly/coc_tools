import type { Profession } from '@schema/character'

export const PROFESSIONS: Profession[] = [
  {
    id: 'antique-dealer',
    name: '古董商',
    description: '熟悉文物与鉴定，擅长谈判和历史知识。',
    signatureSkills: ['accounting', 'appraise', 'history', 'persuade'],
    attributeFocus: { app: 5, int: 5 },
    hpModifier: 0,
    skillFormulas: [
      { attribute: 'edu', multiplier: 2 },
      { attribute: 'app', multiplier: 2 },
    ],
  },
  {
    id: 'detective',
    name: '私家侦探',
    description: '调查与潜伏专家，强调敏捷与洞察。',
    signatureSkills: ['spot-hidden', 'sleight-of-hand', 'library-use', 'psychology'],
    attributeFocus: { dex: 10, int: 5 },
    hpModifier: 5,
    skillFormulas: [
      { attribute: 'edu', multiplier: 2 },
      { attribute: 'dex', multiplier: 2 },
    ],
  },
  {
    id: 'professor',
    name: '大学教授',
    description: '知识渊博，依赖教育与智力进行推理。',
    signatureSkills: ['language-native', 'library-use', 'history', 'anthropology'],
    attributeFocus: { edu: 10, int: 5 },
    hpModifier: -5,
    skillFormulas: [{ attribute: 'edu', multiplier: 4 }],
  },
  {
    id: 'doctor',
    name: '医生',
    description: '受过专业训练的医疗人员，擅长急救与医学。',
    signatureSkills: ['medicine', 'first-aid', 'psychology', 'credit-rating'],
    attributeFocus: { int: 10, edu: 5 },
    hpModifier: 0,
    skillFormulas: [{ attribute: 'edu', multiplier: 4 }],
  },
  {
    id: 'journalist',
    name: '记者',
    description: '善于调查与采访，掌握大量人脉。',
    signatureSkills: ['art-craft-shorthand', 'stealth', 'library-use', 'persuade'],
    attributeFocus: { app: 5, int: 5, dex: 5 },
    hpModifier: 0,
    skillFormulas: [
      { attribute: 'edu', multiplier: 2 },
      { attribute: 'app', multiplier: 2 },
    ],
  },
  {
    id: 'occultist',
    name: '神秘学家',
    description: '研究超自然现象，对 Mythos 有基础认知。',
    signatureSkills: ['cthulhu-mythos', 'occult', 'history', 'psychology'],
    attributeFocus: { pow: 10, int: 5 },
    hpModifier: -5,
    skillFormulas: [
      { attribute: 'edu', multiplier: 2 },
      { attribute: 'pow', multiplier: 2 },
    ],
  },
]

