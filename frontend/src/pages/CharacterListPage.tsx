import { useState, useEffect } from 'react'
import type { Character } from '@schema/character'
import { getCharacterList, deleteCharacter } from '@services/characterList'
import { FULL_PROFESSIONS } from '@data/professions-full'
import { Button, Card } from '@components/ui'
import styles from './CharacterListPage.module.css'

type CharacterListPageProps = {
  onSelectCharacter: (character: Character) => void
  onCreateNew: () => void
}

/**
 * 角色列表页面
 * 显示所有已保存的角色，支持选择、删除等操作
 */
const CharacterListPage = ({ onSelectCharacter, onCreateNew }: CharacterListPageProps) => {
  const [characters, setCharacters] = useState<Character[]>([])

  // 加载角色列表
  useEffect(() => {
    const list = getCharacterList()
    setCharacters(list)
  }, [])

  // 删除角色
  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (window.confirm('确定要删除这个角色吗？')) {
      if (deleteCharacter(id)) {
        // 重新加载列表
        const list = getCharacterList()
        setCharacters(list)
      }
    }
  }

  // 格式化时间
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取职业名称
  const getProfessionName = (professionId: string) => {
    const profession = FULL_PROFESSIONS.find((p) => p.id === professionId)
    return profession?.name || '未知职业'
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>角色列表</h2>
        <Button variant="primary" size="sm" onClick={onCreateNew}>
          创建新角色
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className={styles.empty}>
          <p>还没有创建任何角色</p>
          <Button variant="primary" onClick={onCreateNew}>
            创建第一个角色
          </Button>
        </div>
      ) : (
        <div className={styles.list}>
          {characters.map((character) => (
            <Card
              key={character.id}
              variant="default"
              padding="md"
              className={styles.card}
              onClick={() => onSelectCharacter(character)}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.characterName}>{character.name}</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => handleDelete(character.id, e)}
                    className={styles.deleteBtn}
                  >
                    删除
                  </Button>
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.profession}>{getProfessionName(character.professionId)}</span>
                  <span className={styles.date}>更新于 {formatDate(character.updatedAt)}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default CharacterListPage

