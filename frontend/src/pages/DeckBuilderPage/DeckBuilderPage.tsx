import { useEffect, useState } from 'react'
import { getCharacters, getCardsByCharacter } from '../../api'
import { Card, Character, User } from '../../types'
import { LoadingState } from '../../components/ui'
import styles from './DeckBuilderPage.module.scss'

interface DeckBuilderPageProps {
  user: User | null
}

export default function DeckBuilderPage({ user }: DeckBuilderPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string>('')
  const [cards, setCards] = useState<Card[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(true)
  const [loadingCards, setLoadingCards] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [deckName, setDeckName] = useState('')

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoadingCharacters(true)
        const response = await getCharacters()
        setCharacters(response)
      } finally {
        setLoadingCharacters(false)
      }
    }
    fetchCharacters()
  }, [])

  useEffect(() => {
    if (!selectedCharacter) {
      setCards([])
      return
    }
    const fetchCards = async () => {
      try {
        setLoadingCards(true)
        const response = await getCardsByCharacter(selectedCharacter)
        setCards(response.cards)
        setCounts({})
      } finally {
        setLoadingCards(false)
      }
    }
    fetchCards()
  }, [selectedCharacter])

  function increment(uid: string) {
    setCounts((prev) => {
      const current = prev[uid] ?? 0
      if (current >= 4) return prev
      return { ...prev, [uid]: current + 1 }
    })
  }

  function decrement(uid: string) {
    setCounts((prev) => {
      const current = prev[uid] ?? 0
      if (current <= 1) {
        const { [uid]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [uid]: current - 1 }
    })
  }

  const affinityColors: Record<string, string> = {
    passion: '#e74c3c',
    order: '#3498db',
    justice: '#f1c40f',
    void: '#9b59b6',
    instinct: '#2ecc71',
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2 className={styles.title}>Deck Builder</h2>
        <p className={styles.subtitle}>Select a character to browse their cards</p>
      </div>

      <div className={styles.selector}>
        <label className={styles.label}>Character</label>
        <select
          className={styles.select}
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
        >
          <option value="">-- Select a character --</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </select>
      </div>

      {loadingCharacters && <LoadingState message="Loading characters..." />}

      {loadingCards && <LoadingState message="Loading cards..." />}

      <div className={styles.layout}>
        {!loadingCards && cards.length > 0 ? (
          <div className={styles.cardGridContainer}>
            <div className={styles.cardGrid}>
              {cards.map((card) => (
                <div key={card.uid} className={`${styles.cardItem}${(counts[card.uid] ?? 0) > 0 ? ` ${styles.cardItemSelected}` : ''}`}>
                  {card.imageUrl && (
                    <div
                      className={styles.cardImage}
                      style={{ backgroundImage: `url(${card.imageUrl})` }}
                    />
                  )}
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardName}>{card.name}</h3>
                      <span
                        className={styles.cardAffinity}
                        style={{
                          background: affinityColors[card.affinity?.toLowerCase()] || '#555',
                        }}
                      >
                        {card.affinity}
                      </span>
                    </div>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardType}>{card.type}</span>
                      {card.subType && <span className={styles.cardSubType}>{card.subType}</span>}
                      <span className={styles.cardApCost}>AP {card.apCost}</span>
                    </div>
                    {card.effect.length > 0 && (
                      <ul className={styles.cardEffects}>
                        {card.effect.map((eff, i) => (
                          <li key={i} className={styles.cardEffect}>
                            {eff}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={styles.counter}>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => decrement(card.uid)}
                    >
                      &minus;
                    </button>
                    <span className={styles.counterValue}>{counts[card.uid] ?? 0}</span>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => increment(card.uid)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          !loadingCards && <div className={styles.cardGridContainer} />
        )}

        <aside className={styles.sidebar}>
          <h3 className={styles.sidebarTitle}>Selected Cards</h3>
          <label className={styles.sidebarLabel}>Deck Name</label>
          <input
            className={styles.sidebarInput}
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
          />
          <div className={styles.sidebarList}>
            {cards.flatMap((card) => {
              const count = counts[card.uid] ?? 0
              return Array.from({ length: count }, (_, i) => (
                <div key={`${card.uid}-${i}`} className={styles.sidebarItem}>
                  {card.imageUrl && (
                    <div
                      className={styles.sidebarItemImage}
                      style={{ backgroundImage: `url(${card.imageUrl})` }}
                    />
                  )}
                  <div className={styles.sidebarItemBody}>
                    <span className={styles.sidebarItemName}>{card.name}</span>
                    <span
                      className={styles.sidebarItemAffinity}
                      style={{
                        background: affinityColors[card.affinity?.toLowerCase()] || '#555',
                      }}
                    >
                      {card.affinity}
                    </span>
                  </div>
                </div>
              ))
            })}
            {Object.keys(counts).length === 0 && (
              <p className={styles.sidebarEmpty}>No cards selected yet.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
