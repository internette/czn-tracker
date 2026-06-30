import { CSSProperties, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTeam, getMyDecks } from '../../api'
import { Team, Deck, User } from '../../types'
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
        deckIds: team.decks ?? [],
      },
    })
  }

  function getDeckForCharacter(character: { uid: string; id: string }): Deck | undefined {
    return decks.find(
      (d) => team.decks?.includes(d.uid) && d.characterUid === character.uid,
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
        <div className={styles.characterGrid}>
          {team.characters.map((character) => {
            const deck = getDeckForCharacter(character)
            return (
              <div key={character.id} className={styles.characterCard}>
                <div
                  className={`${styles.characterImage} ${styles[character.attribute.toLowerCase()]}`}
                  style={{ '--img': `url(${character.imageUrl})` } as CSSProperties}
                />
                <div className={styles.characterInfo}>
                  <Link to={`/characters/${character.id}`} className={styles.characterName}>
                    {character.name}
                  </Link>
                  <span className={`${styles.badge} ${styles[character.attribute.toLowerCase()]}`}>
                    {character.attribute}
                  </span>
                  <div className={styles.characterDetails}>
                    <span>Tier: {character.tier}</span>
                    <span>Type: {character.type}</span>
                    <span>Faction: {character.faction}</span>
                    <span>Rarity: {character.rarity}</span>
                  </div>
                  {deck && (
                    <div className={styles.deckInfo}>
                      <span className={styles.deckLabel}>Deck:</span>
                      <span className={styles.deckName}>{deck.name}</span>
                      <span className={styles.deckCardCount}>{deck.cardIds.length} card{deck.cardIds.length !== 1 ? 's' : ''}</span>
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
