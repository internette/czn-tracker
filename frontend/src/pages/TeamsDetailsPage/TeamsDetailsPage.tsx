import { CSSProperties, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTeam, getMyDecks, getCardsByCharacter } from '../../api'
import { Card, Character, Deck, Team, User } from '../../types'
import { LoadingState, Button } from '../../components/ui'
import styles from './TeamsDetailsPage.module.scss'

interface TeamsDetailsPageProps {
  user: User | null
}

export default function TeamsDetailsPage({ user }: TeamsDetailsPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [cardsMap, setCardsMap] = useState<Record<string, Card>>({})

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const data = await getTeam(id)
        setTeam(data)
      } catch (err) {
        console.error('Failed to load team', err)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    if (!user) return
    async function loadDecksAndCards() {
      try {
        const myDecks = await getMyDecks()
        setDecks(myDecks)
      } catch (err) {
        console.error('Failed to load decks', err)
      }
    }
    loadDecksAndCards()
  }, [user])

  useEffect(() => {
    if (!team) return
    async function loadCards() {
      const cardMap: Record<string, Card> = {}
      await Promise.all(
        team.characters.map(async (character) => {
          try {
            const result = await getCardsByCharacter(character.id)
            for (const card of result.cards) {
              cardMap[card.uid] = card
            }
          } catch {}
        }),
      )
      setCardsMap(cardMap)
    }
    loadCards()
  }, [team])

  if (!team) {
    return <LoadingState />
  }

  const createdDate = new Date(team.createdDate)
  const friendlyDate = createdDate.toLocaleString('default', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  function handleEdit() {
    navigate('/teams/build', {
      state: {
        selectedIds: team.characters.map((c) => c.id),
        teamName: team.name,
        editingTeamId: team.uid,
        deckIds: (team.decks ?? []).map((d) => d.uid),
      },
    })
  }

  function getDeckForCharacter(character: Character): Deck | undefined {
    const teamDeckUids = new Set((team.decks ?? []).map((d) => d.uid))
    return decks.find(
      (d) => teamDeckUids.has(d.uid) && d.characterUid === character.uid,
    )
  }

  return (
    <div className={styles.container}>
      <Link to="/teams" className={styles.backLink}>← Back to Teams</Link>

      <section className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.teamTitle}>{team.name}</h2>
          {user && (
            <Button variant="secondary" size="sm" onClick={handleEdit}>
              Edit Team
            </Button>
          )}
        </div>
        <small className={styles.teamMeta}>
          By: {team.createdBy || 'anonymous'} &middot; {friendlyDate}
        </small>
      </section>

      <section>
        <h3 className={styles.sectionTitle}>Characters</h3>
        <div className={styles.characterColumn}>
          {team.characters.map((character) => {
            const deck = getDeckForCharacter(character)
            return (
              <div key={character.id} className={styles.characterCard}>
                <div
                  className={`${styles.characterImage} ${styles[character.attribute.toLowerCase()]}`}
                  style={{ '--img': `url(${character.imageUrl})` } as CSSProperties}
                />
                <div className={styles.rightCol}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link to={`/characters/${character.id}`} className={styles.characterName}>
                      {character.name}
                    </Link>
                    <span className={`${styles.badge} ${styles[character.attribute.toLowerCase()]}`}>
                      {character.attribute}
                    </span>
                  </div>
                  <div className={styles.statsRow}>
                    <span>Tier: {character.tier}</span>
                    <span>Type: {character.type}</span>
                    <span>Faction: {character.faction}</span>
                    <span>Rarity: {character.rarity}</span>
                  </div>
                  {deck && (
                    <div className={styles.deckSection}>
                      <div className={styles.deckHeader}>
                        <span className={styles.deckLabel}>Deck:</span>
                        <span className={styles.deckName}>{deck.name}</span>
                      </div>
                      <div className={styles.cardGrid}>
                        {deck.cardIds.map((cardUid) => {
                          const card = cardsMap[cardUid]
                          return (
                            <div key={cardUid} className={styles.cardItem}>
                              {card?.imageUrl ? (
                                <div
                                  className={styles.cardImage}
                                  style={{ '--img': `url(${card.imageUrl})` } as CSSProperties}
                                />
                              ) : (
                                <div className={styles.cardImage} />
                              )}
                              <div className={styles.cardBody}>
                                <span className={styles.cardName}>{card?.name || cardUid.slice(0, 8)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
