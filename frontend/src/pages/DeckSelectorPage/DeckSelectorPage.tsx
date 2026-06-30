import { CSSProperties, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCharacters, getMyDecks, getCardsByCharacter } from '../../api'
import { Card as CardType, Character, Deck, User } from '../../types'
import { Button, LoadingState } from '../../components/ui'
import styles from './DeckSelectorPage.module.scss'

interface DeckSelectorPageProps {
  user: User | null
}

export default function DeckSelectorPage({ user }: DeckSelectorPageProps) {
  const navigate = useNavigate()
  const location = useLocation()

  const [characters, setCharacters] = useState<Character[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [cardsByCharacter, setCardsByCharacter] = useState<Record<string, CardType[]>>({})
  const [selectedDecks, setSelectedDecks] = useState<Record<string, string>>({})
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [teamName, setTeamName] = useState('')
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

  useEffect(() => {
    const state = location.state as {
      selectedIds?: string[]
      selectedDecks?: Record<string, string>
      teamName?: string
      editingTeamId?: string | null
    } | null

    if (state?.selectedIds) setSelectedIds(state.selectedIds)
    if (state?.selectedDecks) setSelectedDecks(state.selectedDecks)
    if (state?.teamName) setTeamName(state.teamName)
    if (state?.editingTeamId !== undefined) setEditingTeamId(state.editingTeamId)
  }, [location.state])

  useEffect(() => {
    async function load() {
      try {
        const [allChars, myDecks] = await Promise.all([
          getCharacters(),
          user ? getMyDecks() : Promise.resolve([]),
        ])
        setCharacters(allChars)
        setDecks(myDecks)

        const charactersInTeam = user
          ? allChars.filter((c) => location.state && (location.state as Record<string, unknown>).selectedIds
            ? (location.state as { selectedIds: string[] }).selectedIds.includes(c.id)
            : false)
          : []

        const cardMap: Record<string, CardType[]> = {}
        await Promise.all(
          charactersInTeam.map(async (c) => {
            try {
              const result = await getCardsByCharacter(c.id)
              cardMap[c.id] = result.cards
            } catch {
              cardMap[c.id] = []
            }
          }),
        )
        setCardsByCharacter(cardMap)
      } catch (err) {
        console.error('Failed to load data', err)
      }
    }
    load()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelectDeck(characterId: string, deckId: string) {
    setSelectedDecks((prev) => {
      const next = { ...prev }
      if (next[characterId] === deckId) {
        delete next[characterId]
      } else {
        next[characterId] = deckId
      }
      return next
    })
  }

  function handleDone() {
    navigate('/teams/build', {
      state: {
        selectedIds,
        selectedDecks,
        teamName,
        editingTeamId,
        fromDeckSelector: true,
      },
    })
  }

  function getDecksForCharacter(characterId: string): Deck[] {
    return decks.filter((d) => d.characterUid === characterId)
  }

  function getDeckCards(deck: Deck): CardType[] {
    const charCards = cardsByCharacter[deck.characterUid] ?? []
    return charCards.filter((c) => deck.cardIds.includes(c.uid))
  }

  const selectedCharacters = characters.filter((c) => selectedIds.includes(c.id))

  return (
    <div className={styles.container}>
      <section className={styles.pageHeader}>
        <h2 className={styles.title}>Select Decks</h2>
        <p className={styles.subtitle}>Choose a deck for each character in your team.</p>
      </section>

      {selectedCharacters.length === 0 ? (
        <LoadingState message="No characters selected..." />
      ) : (
        <div className={styles.characterList}>
          {selectedCharacters.map((character) => {
            const charDecks = getDecksForCharacter(character.uid)
            const selectedDeckId = selectedDecks[character.id]
            const selectedDeck = selectedDeckId ? decks.find((d) => d.uid === selectedDeckId) : null
            const deckCards = selectedDeck ? getDeckCards(selectedDeck) : []

            return (
              <div key={character.id} className={styles.characterSection}>
                <div className={styles.characterHeader}>
                  <div
                    className={`${styles.characterAvatar} ${styles[character.attribute.toLowerCase()]}`}
                    style={{ '--img': `url(${character.imageUrl})` } as CSSProperties}
                  />
                  <div className={styles.characterMeta}>
                    <span className={styles.characterName}>{character.name}</span>
                    <span className={`${styles.attributeBadge} ${styles[character.attribute.toLowerCase()]}`}>
                      {character.attribute}
                    </span>
                  </div>
                </div>

                <div className={styles.deckList}>
                  <button
                    type="button"
                    className={`${styles.deckOption} ${!selectedDeckId ? styles.deckOptionSelected : ''}`}
                    onClick={() => handleSelectDeck(character.id, '')}
                  >
                    <span className={styles.deckOptionName}>No deck</span>
                  </button>
                  {charDecks.length === 0 && (
                    <p className={styles.emptyDecks}>No decks saved for this character.</p>
                  )}
                  {charDecks.map((deck) => (
                    <button
                      key={deck.uid}
                      type="button"
                      className={`${styles.deckOption} ${selectedDeckId === deck.uid ? styles.deckOptionSelected : ''}`}
                      onClick={() => handleSelectDeck(character.id, deck.uid)}
                    >
                      <span className={styles.deckOptionName}>{deck.name}</span>
                      <span className={styles.deckOptionMeta}>
                        {deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedDeck && deckCards.length > 0 && (
                  <div className={styles.cardsSection}>
                    <h4 className={styles.cardsTitle}>Cards in {selectedDeck.name}</h4>
                    <div className={styles.cardsGrid}>
                      {deckCards.map((card) => (
                        <div key={card.uid} className={styles.cardItem}>
                          {card.imageUrl ? (
                            <div
                              className={styles.cardImage}
                              style={{ '--img': `url(${card.imageUrl})` } as CSSProperties}
                            />
                          ) : (
                            <div className={styles.cardImagePlaceholder}>?</div>
                          )}
                          <div className={styles.cardInfo}>
                            <span className={styles.cardName}>{card.name}</span>
                            <span className={styles.cardMeta}>{card.type} &middot; AP {card.apCost}</span>
                            {card.tags && card.tags.length > 0 && (
                              <span className={styles.cardTag}>{card.tags[0].tagName}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="secondary" onClick={() => navigate('/teams/build')}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
