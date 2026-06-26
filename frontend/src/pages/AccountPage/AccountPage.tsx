
import { useEffect, useMemo, useState } from 'react'
import { Team, User } from '../../types'
import { getTeams, deleteTeam } from '../../api'
import { Grid } from '../../components/ui'
import SavedTeamCard from '../../components/SavedTeamCard/SavedTeamCard'
import styles from './AccountPage.module.scss'

interface AccountPageProps {
  user: User | null
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
    const usageMap: Record<string, { character: any; count: number }> = {}

    teams.forEach((team: any) => {
      team.characters?.forEach((character: any) => {
        if (!usageMap[character.uid]) {
          usageMap[character.uid] = {
            character,
            count: 0,
          }
        }

        usageMap[character.uid].count += 1
      })
    })

    return Object.values(usageMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [teams])

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
        <h2>Most Used Characters</h2>
        {mostUsedCharacters.length > 0 ? (
            <div className={styles.mostUsedCharacters}>
                <ol className={styles.topCharactersList}>
                    {mostUsedCharacters.map(({ character, count }) => {
                        const percentageFull = Math.floor((count * 100) / teams.length);
                        return (<li className={`${styles.topCharacterListItem} ${styles[character.attribute.toLowerCase()]}`} key={character.uid}>
                            <div className={styles.topCharacterListItem__icon} style={{backgroundImage: `url(${character.imageUrl})`}}/> 
                            <div className={styles.topCharacterListItem__details}>
                                <span>{character.name}</span>
                                <small className={`${styles.topCharacterListItem__attribute} ${styles[character.attribute.toLowerCase()]}`}>{character.attribute}</small>
                            </div>
                            <div className={styles.topCharacterListItem__countDetails}>
                                <div className={`${styles.topCharacterListItem__percentageBar} ${styles[character.attribute.toLowerCase()]}`} style={{ backgroundImage: `linear-gradient(to right, transparent ${percentageFull}%, #24314f ${percentageFull}%, #24314f ${percentageFull}% 100%)`}}/>
                                <div className={styles.topCharacterListItem__teamCount}>
                                    <small>
                                        <span>{count}</span>&nbsp;team{count > 1 && 's'}
                                    </small>
                                </div>
                            </div>
                        </li>)
                    })}
                </ol>
            </div>
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