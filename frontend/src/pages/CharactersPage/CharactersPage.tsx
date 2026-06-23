import { useEffect, useState } from 'react'
import { getCharacters } from '../../api'
import { Character, User } from '../../types'
import { Card, Grid, LoadingState, EmptyState } from '../../components/ui'
import { CharacterCard } from '../../components/common'
import styles from './CharactersPage.module.scss'

interface CharactersPageProps {
  user: User | null
}

export default function CharactersPage({ user }: CharactersPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOwned, setFilterOwned] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const response = await getCharacters();
        setCharacters(response);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  const filteredCharacters = characters.filter((character) =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className={styles['characters-page']}>
      <div className={styles['characters-page__header']}>
        <div>
          <h2 className={styles['characters-page__title']}>Characters</h2>
          <div className={styles['characters-page__meta']}>
            Your roster — tracking ownership, levels, and team slots
          </div>
        </div>

        <a href="/add-character" className={styles['characters-page__add-link']}>
          Add Character
        </a>
      </div>

      <div className={styles['characters-page__stats']}>
        <div className={styles['characters-page__stat-chip']}>
          <strong>{characters.length}</strong>
          <div className={styles['characters-page__meta']}>Total Characters</div>
        </div>

        <div className={styles['characters-page__stat-chip']}>
          <strong>{filterOwned ? characters.length : 'All'}</strong>
          <div className={styles['characters-page__meta']}>Filter</div>
        </div>
      </div>
      <div className={styles['charactersPage__controls']}>
      <div className={styles.charactersPage__searchWrap}>
        <i className={`${styles.charactersPage__searchIcon} ti ti-search`} />
        <input
          className={styles.charactersPage__searchInput}
          placeholder="Search characters…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>

      {loading ? (
        <LoadingState message="Loading characters..." />
      ) : <Grid cols={4} gap={12}>
          {filteredCharacters.map((character) => (
            <CharacterCard
              character={character}
              user={user}
            />
          ))}
        </Grid>
      }
    </Card>
  )
}
