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
  const [sortMode, setSortMode] = useState('owned')
  const [attributeFilter, setAttributeFilter] = useState<string | null>(null)

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

  const filteredCharacters = characters.filter((character) => {
    const matchesSearch = character.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAttribute = attributeFilter
      ? (character.attribute?.toLowerCase?.() === attributeFilter.toLowerCase())
      : true
    return matchesSearch && matchesAttribute
  })

  const rarityRank: Record<string, number> = {
    SSR: 3,
    SR: 2,
    R: 1,
  }
  const attributeTypes = ["passion", "order", "justice", "void", "instinct"];

  const sortedCharacters = [...filteredCharacters].sort((a: any, b: any) => {
    switch (sortMode) {
      case 'level':
        return (b.level ?? 0) - (a.level ?? 0)

      case 'rarity':
        return (rarityRank[b.rarity ?? 'R'] ?? 0) - (rarityRank[a.rarity ?? 'R'] ?? 0)

      case 'name':
        return a.name.localeCompare(b.name)

      case 'owned':
      default:
        return Number(b.owned ?? false) - Number(a.owned ?? false)
    }
  })

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
      <div className={styles['characters-page__controls']}>
        <div className={styles['characters-page__search-wrap']}>
          <i className={`${styles['characters-page__search-icon']} ti ti-search`} />
          <input
            className={styles['characters-page__search-input']}
            placeholder="Search characters…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles['characters-page__sort-sel']}
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
        >
          <option value="owned">Sort: Owned first</option>
          <option value="level">Sort: Level</option>
          <option value="rarity">Sort: Rarity</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>
      <div className={styles['characters-page__attribute-filters']}>
        {attributeTypes.map((attr) => (
          <button
            key={attr}
            type="button"
            className={styles['characters-page__attribute-filter']}
            onClick={() =>
              setAttributeFilter((prev) => (prev === attr ? null : attr))
            }
          >
            <img src={`/images/elements/${attr}.webp`}/>
          </button>
        ))}
        <button
            type="button"
            className={styles['characters-page__attribute-filter']}
            onClick={() =>
              setAttributeFilter(null)
            }
          >
            All
          </button>
      </div>

      {loading ? (
        <LoadingState message="Loading characters..." />
      ) : <Grid cols={4} gap={12}>
          {sortedCharacters.map((character) => (
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
