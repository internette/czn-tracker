import { useEffect, useState } from 'react'
import { getCharacters, getCardsByCharacter, createDeck } from '../../api'
import { Card, Character, User } from '../../types'
import { LoadingState } from '../../components/ui'
import { Dropdown, TextInput } from '../../components/ui'
import CardGridItem from './CardGridItem'
import SidebarCardItem from './SidebarCardItem'
import styles from './DeckBuilderPage.module.scss'

interface DeckBuilderPageProps {
  user: User | null
}

export default function DeckBuilderPage({ user }: DeckBuilderPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string>('')
  const [cards, setCards] = useState<Card[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingCharacters, setLoadingCharacters] = useState(true)
  const [loadingCards, setLoadingCards] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [deckName, setDeckName] = useState('')
  const [saving, setSaving] = useState(false)

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
    setCards([])
    setCounts({})
    const fetchCards = async () => {
      try {
        setLoadingCards(true)
        const response = await getCardsByCharacter(selectedCharacter)
        setCards(response.cards)
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

  async function handleSave() {
    if (!deckName || !selectedCharacter || Object.keys(counts).length === 0) return
    setSaving(true)
    try {
      const cardIds = cards.flatMap((card) =>
        Array.from({ length: counts[card.uid] ?? 0 }, () => card.uid),
      )
      await createDeck({ name: deckName, characterUid: selectedCharacter, cardIds })
      setDeckName('')
      setCounts({})
    } finally {
      setSaving(false)
    }
  }

  const filteredCards = cards.filter((card) =>
    card.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
        <Dropdown
          value={selectedCharacter}
          onChange={(e) => setSelectedCharacter(e.target.value)}
        >
          <option value="">-- Select a character --</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}
            </option>
          ))}
        </Dropdown>
      </div>

      {selectedCharacter && (
        <div className={styles.search}>
          <label className={styles.label}>Search</label>
          <TextInput
            type="text"
            placeholder="Search by card name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {loadingCharacters && <LoadingState message="Loading characters..." />}

      {loadingCards && <LoadingState message="Loading cards..." />}

      <div className={styles.layout}>
        {!loadingCards && filteredCards.length > 0 ? (
          <div className={styles.cardGridContainer}>
            <div className={styles.cardGrid}>
              {filteredCards.map((card) => (
                <CardGridItem
                  key={card.uid}
                  card={card}
                  count={counts[card.uid] ?? 0}
                  affinityColors={affinityColors}
                  onIncrement={increment}
                  onDecrement={decrement}
                />
              ))}
            </div>
          </div>
        ) : (
          !loadingCards && (
            <div className={styles.cardGridContainer}>
              {searchQuery && filteredCards.length === 0 && (
                <p className={styles.empty}>No cards match your search.</p>
              )}
            </div>
          )
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
                  <SidebarCardItem card={card} affinityColors={affinityColors} />
                </div>
              ))
            })}
            {Object.keys(counts).length === 0 && (
              <p className={styles.sidebarEmpty}>No cards selected yet.</p>
            )}
          </div>
          <button type="button" className={styles.saveDeckBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Deck'}
          </button>
        </aside>
      </div>
    </div>
  )
}
