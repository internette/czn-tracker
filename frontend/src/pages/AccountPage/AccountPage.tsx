
import { useEffect, useMemo, useState } from 'react'
import { Team, User } from '../../types'
import { getTeams, deleteTeam } from '../../api'
import { Grid } from '../../components/ui'
import SavedTeamCard from '../../components/SavedTeamCard/SavedTeamCard'

interface AccountPageProps {
  user: User
}

export default function AccountPage({ user }: AccountPageProps) {
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await getTeams()
        setTeams(response)
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }
    if(user){
        loadTeams()
    }
  }, [user])
  const mostUsedCharacters = useMemo(() => {
    const counts: Record<string, number> = {}

    teams.forEach((team: any) => {
      team.characters?.forEach((character: any) => {
        counts[character.name] = (counts[character.name] ?? 0) + 1
      })
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [teams]);

  async function handleDeleteTeam(teamUid: string) {
      try {
        await deleteTeam(teamUid)
  
        setTeams((current) => current.filter((team) => team.uid !== teamUid))
      } catch (err) {
        console.error('Failed to delete team', err)
      }
    }
    async function handleEditTeam(){
        
    }

  return (
    <div>
      <h1>Account</h1>
      <section>
        <h2>Most Used Character</h2>
        {mostUsedCharacters.length > 0 ? (
          <ol>
            {mostUsedCharacters.map(([name, count]) => (
              <li key={name}>
                {name} used in {count} team{count === 1 ? '' : 's'}
              </li>
            ))}
          </ol>
        ) : (
          <p>No team data available.</p>
        )}
      </section>
      <section>
        <h2>Saved Teams</h2>

        {teams.length === 0 ? (
          <p>No saved teams.</p>
        ) : (
          <Grid minItemWidth={300}>
            {teams.map((team: any) => (
              <SavedTeamCard key={team.uid}
                  team={team}
                  onDelete={handleDeleteTeam}
                  onEdit={handleEditTeam}/>
            ))}
          </Grid>
        )}
      </section>
    </div>
  )
}