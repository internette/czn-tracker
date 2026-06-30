import { CSSProperties, useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getTeam } from '../../api'
import { Team, User } from '../../types'
import { LoadingState, Button } from '../../components/ui'
import styles from './TeamsDetailsPage.module.scss'

interface TeamsDetailsPageProps {
  user: User | null
}

export default function TeamsDetailsPage({ user }: TeamsDetailsPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [team, setTeam] = useState<Team | null>(null)

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
      },
    })
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
          {team.characters.map((character) => (
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
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
