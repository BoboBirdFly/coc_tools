export type Skill = {
  id: string
  name: string
  base: number
}

export const SKILLS: Skill[] = [
  { id: 'accounting', name: '会计', base: 5 },
  { id: 'anthropology', name: '人类学', base: 1 },
  { id: 'appraise', name: '估价', base: 5 },
  { id: 'history', name: '历史', base: 5 },
  { id: 'library-use', name: '图书馆使用', base: 20 },
  { id: 'psychology', name: '心理学', base: 10 },
  { id: 'spot-hidden', name: '侦查', base: 25 },
]

