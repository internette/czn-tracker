import { FormEvent, useEffect, useState, CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCharacters, getMyDecks, createTeam, updateTeam } from '../../api'
import { Character, Deck, User } from '../../types'
import { Button, Grid } from '../../components/ui'

import styles from './TeamBuilderPage.module.scss'

interface TeamBuilderPageProps {
  user: User | null
}

export default function TeamBuilderPage({ user }: TeamBuilderPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [characters, setCharacters] = useState<Character[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [showOwnedOnly, setShowOwnedOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedDecks, setSelectedDecks] = useState<Record<string, string>>({})
  const [teamName, setTeamName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true)
        const response = await getCharacters()
        setCharacters(response)
      } finally {
        setLoading(false)
      }
    }
    fetchCharacters()
  }, [])

  useEffect(() => {
    if (!user) return
    async function fetchDecks() {
      try {
        const myDecks = await getMyDecks()
        setDecks(myDecks)
      } catch (err) {
        console.error('Failed to load decks', err)
      }
    }
    fetchDecks()
  }, [user])

  useEffect(() => {
    const state = location.state as Record<string, unknown> | null
    if (!state) return

    if (state.fromDeckSelector) {
      if (state.selectedDecks) setSelectedDecks(state.selectedDecks as Record<string, string>)
      if (state.selectedIds) setSelectedIds(state.selectedIds as string[])
      if (state.teamName) setTeamName(state.teamName as string)
      if (state.editingTeamId !== undefined) setEditingTeamId(state.editingTeamId as string | null)
      window.history.replaceState({}, document.title)
      return
    }

    const {
      selectedIds,
      teamName,
      editingTeamId,
      deckIds,
    } = state as {
      selectedIds?: string[]
      teamName?: string
      editingTeamId?: string | null
      deckIds?: string[]
    }

    if (selectedIds) setSelectedIds(selectedIds)
    if (teamName) setTeamName(teamName)
    if (editingTeamId !== undefined) setEditingTeamId(editingTeamId)
    if (deckIds && decks.length > 0) {
      const deckMap: Record<string, string> = {}
      for (const deckId of deckIds) {
        const deck = decks.find((d) => d.uid === deckId)
        if (deck) {
          deckMap[deck.characterUid] = deckId
        }
      }
      setSelectedDecks(deckMap)
    }
  }, [location.state, decks])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!user) {
      setError('Please log in to create teams.')
      return
    }
    if (!teamName || selectedIds.length === 0) {
      setError('Provide a team name and choose at least one character.')
      return
    }
    setSaving(true)
    try {
      const deckIds = Object.values(selectedDecks)
      if (editingTeamId) {
        await updateTeam(editingTeamId, {
          name: teamName,
          characterIds: selectedIds,
          deckIds,
        })
        setEditingTeamId(null)
      } else {
        await createTeam(teamName, selectedIds, deckIds)
      }

      setTeamName('')
      setSelectedIds([])
      setSelectedDecks({})
      setEditingTeamId(null)
      navigate('/teams')
    } catch (err) {
      setError('Failed to save team. Ensure you are logged in.')
    } finally {
      setSaving(false)
    }
  }

  function toggleCharacter(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function handleOpenDeckSelector() {
    navigate('/teams/build/decks', {
      state: {
        selectedIds,
        selectedDecks,
        teamName,
        editingTeamId,
      },
    })
  }

  const displayedCharacters = showOwnedOnly && user
    ? user.charactersOwned
    : characters

  const attributeTypes = ["passion", "order", "justice", "void", "instinct"]

  function getDeckName(deckId: string): string {
    const deck = decks.find((d) => d.uid === deckId)
    return deck?.name ?? ''
  }

  const deckCount = Object.keys(selectedDecks).length

  return (
    <div className={styles.container}>
      <section className={styles.pageHeader}>
        <h2 className={styles.sectionTitle}>Team Builder</h2>
        {!user ? <p className={styles.subtitle}>Please log in to save teams.</p> : <p className={styles.subtitle}>Select up to three characters and save your team setup.</p>}
      </section>
      <section>

        <form onSubmit={handleSubmit} className="grid">
          <div className={styles.teamNameRow}>
            <label className={styles.teamNameLabel}>Team name</label>
            <input
              className={styles.input}
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="e.g. Eternal Hunger Sword Rain"
            />
          </div>
          {user && 
            <div className={styles.teamFilterRow}>
              <label className={styles.teamFilterOwnedStatus__label}>
                <input
                  type="checkbox"
                  checked={showOwnedOnly}
                  className={styles.teamFilterOwnedStatus__input}
                  onChange={(e) => setShowOwnedOnly(!showOwnedOnly)}
                />{' '}
                Show owned characters only
              </label>
            </div>
          }
          {error && <p className={styles.errorStyle}>{error}</p>}
          <div className={styles.teamBuilder}>
            <div className={styles.characterGrid}>
              <Grid minItemWidth={120}>
                {displayedCharacters.map((character) => { 
                  const selected = selectedIds.includes(character.id)
                  return (
                  <button
                    key={'select-' + character.id}
                    type="button"
                    onClick={() => {
                      const maxTeamLength = selectedIds.length < 3;
                      const isSelectedCharacter = selectedIds.indexOf(character.id) >= 0;
                      if((!error && maxTeamLength) || isSelectedCharacter){
                        toggleCharacter(character.id)
                      }
                    }}
                    className={`${styles.characterCard} ${selected ? styles[`characterCard--${character.attribute.toLowerCase()}`] : ''} ${selected ? styles['characterCard--selected'] : styles['characterCard--unselected']}`}
                    style={{ '--img': `url(${character.imageUrl})` } as CSSProperties}
                  >
                    <img 
                      src={`/images/elements/${character.attribute.toLowerCase()}.webp`} 
                      alt="Character type element"
                      className={styles['attributeIcon--characterCard']}/>
                    <p className={styles.characterName}>{character.name}</p>
                  </button>
                )})}
              </Grid>
            </div>
            <aside className={styles.teamSidebar}>
              <h3 className={styles['teamSidebarHeader']}>Team Slots</h3>
              <p className={styles.teamBuilderCounter}>{selectedIds.length} / 3 selected</p>
              {selectedIds.map(selectedId => {
                const selectedCharacter = (characters.find(character => character.id === selectedId) ?? user?.charactersOwned.find(character => character.id === selectedId))!
                const selectedDeckId = selectedDecks[selectedCharacter.id]
                return (
                  <div className={styles.slotRow} key={selectedCharacter.id}>
                    <span
                      className={styles.characterInTeam}
                      style={{ '--img': `url(${selectedCharacter.imageUrl})` } as CSSProperties}
                    />
                    <div className={styles.slotContent}>
                      <div className={styles.selectedCharacterDetails}>
                        <span className={styles.teamBuilderCharacterName}>{selectedCharacter.name}</span>
                        <span className={`${styles.attributeName} ${styles[selectedCharacter.attribute.toLowerCase()]}`}>
                          {selectedCharacter.attribute}
                        </span>
                      </div>
                      {user && (
                        <>
                          {selectedDeckId && (
                            <span className={styles.selectedDeckName}>{getDeckName(selectedDeckId)}</span>
                          )}
                          <button
                            type="button"
                            className={styles.deckLink}
                            onClick={handleOpenDeckSelector}
                          >
                            {selectedDeckId ? 'Change deck' : '+ Select deck'}
                          </button>
                        </>
                      )}
                    </div>
                    <Button variant="danger" size="sm" ariaLabel="Remove character" onClick={() => toggleCharacter(selectedCharacter.id)}>&times;</Button>
                  </div>
                )
              })}
              {selectedIds.length > 0 && deckCount > 0 && (
                <p className={styles.deckSummary}>{deckCount} deck{deckCount !== 1 ? 's' : ''} selected</p>
              )}
              <div className={styles.attributesContainer}>{attributeTypes.map(attrType => {
                const imgUrl = `/images/elements/${attrType}.webp`;
                const characterWithAttr = displayedCharacters.filter(character => selectedIds.indexOf(character.uid) > -1 && character.attribute.toLowerCase() === attrType);
                const isPresent = characterWithAttr.length > 0;
                return (<img key={attrType} src={imgUrl} className={`${styles.attributeIcon}${isPresent ? ' ' + styles['attributeIcon--active'] : ''}`}/>)
              })}</div>
              {
              <Button variant="primary" type="submit" disabled={saving || selectedIds.length < 3}>
                {saving ? 'Saving...' : (editingTeamId ? 'Update team' : 'Create team')}
              </Button>
              }
            </aside>
          </div>
        </form>
      </section>
    </div>
  )
}
