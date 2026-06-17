import { useEffect, useState, CSSProperties } from 'react'
import { getCharacters } from '../../api'
import { Character, User } from '../../types'
import { Card, Grid, LoadingState, EmptyState } from '../../components/ui'
import { CharacterCard } from '../../components/common'

interface CharactersPageProps {
  user: User | null
}

const charactersPageStyles = {
  title: {
    margin: '0 0 16px 0',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#e2e8f0',
  } as CSSProperties,
  warning: {
    color: '#fb7185',
    fontSize: '0.95rem',
  } as CSSProperties,
  filterContainer: {
    marginBottom: '20px',
  } as CSSProperties,
}

export default function CharactersPage({ user }: CharactersPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOwned, setFilterOwned] = useState(false)
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

  return (
    <Card>
      <h2 style={charactersPageStyles.title}>Characters</h2>

      {loading ? (
        <LoadingState message="Loading characters..." />
      ) : <Grid cols={2} gap={16}>
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </Grid>
      }
      <a href="/add-character">Add Character</a>
    </Card>
  )
}
