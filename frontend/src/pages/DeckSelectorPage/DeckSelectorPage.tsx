import { CSSProperties, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCharacters, getMyDecks } from '../../api'
import { Character, Deck, User } from '../../types'
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
      } catch (err) {
        console.error('Failed to load data', err)
      }
    }
    load()
  }, [user])

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
