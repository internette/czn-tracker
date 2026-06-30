import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTeams, deleteTeam } from '../../api'
import { Team, User } from '../../types'
import { Grid } from '../../components/ui'
import SavedTeamCard from '../../components/SavedTeamCard/SavedTeamCard'

import styles from './TeamsPage.module.scss'

interface TeamsPageProps {
  user: User | null
}

export default function TeamsPage({ user }: TeamsPageProps) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    async function load() {
      try {
        const teams = await getTeams()
        setTeams(teams)
      } catch (err) {
        console.error('Failed to load teams', err)
      }
    }
    load()
  }, [user?.uid])

  async function handleDeleteTeam(teamUid: string) {
    try {
      await deleteTeam(teamUid)

      setTeams((current) => current.filter((team) => team.uid !== teamUid))
    } catch (err) {
      console.error('Failed to delete team', err)
    }
  }

  function handleEditTeam(team: Team) {
    navigate('/teams/build', {
      state: {
        selectedIds: team.characters.map((c) => c.id),
        teamName: team.name,
        editingTeamId: team.uid,
      },
    })
  }

  return (
    <div>
      <div className={styles.container}>
        <section className={styles.pageHeader}>
          <h2 className={styles.sectionTitle}>Teams</h2>
          <p>Go to the <Link to="/teams/build">Team Builder</Link> to create your own team.</p>
        </section>
        <section className={styles.savedTeamsSection}>
          {teams.length === 0 ? (
            <p>No saved teams yet.</p>
          ) : (
            <Grid minItemWidth={320}>
              {teams.map((team) => (
                <SavedTeamCard
                  key={team.uid}
                  team={team}
                  onDelete={handleDeleteTeam}
                  onEdit={handleEditTeam}
                />
              ))}
            </Grid>
          )}
        </section>
      </div>
    </div>
  )
}
