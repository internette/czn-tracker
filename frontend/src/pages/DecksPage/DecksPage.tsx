import { useEffect, useState } from 'react'
import { getDecks, getCharacters } from '../../api'
import { Character, Deck } from '../../types'
import DeckCard from '../../components/DeckCard/DeckCard'
import styles from './DecksPage.module.scss'

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([])
  const [characters, setCharacters] = useState<Record<string, Character>>({})
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const limit = 20

  useEffect(() => {
    getCharacters().then((chars) => {
      const map: Record<string, Character> = {}
      for (const c of chars) {
        map[c.uid] = c
      }
      setCharacters(map)
    })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const response = await getDecks(page, limit)
        setDecks(response.decks)
        setTotal(response.total)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [page])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Decks</h2>
        <p className={styles.subtitle}>Browse all saved decks</p>
      </div>

      {loading && decks.length === 0 ? (
        <p className={styles.empty}>Loading...</p>
      ) : decks.length === 0 ? (
        <p className={styles.empty}>No decks found.</p>
      ) : (
        <>
          <div className={styles.grid}>
            {decks.map((deck) => (
              <DeckCard
                key={deck.uid}
                deck={deck}
                character={characters[deck.characterUid]}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
