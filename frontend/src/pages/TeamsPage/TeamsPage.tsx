import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeams, createTeam, deleteTeam } from '../../api'
import { Character, Team, User } from '../../types'
import { Grid } from '../../components/ui'

import styles from './TeamsPage.module.scss'

interface TeamsPageProps {
  user: User | null
}


export default function TeamsPage({ user }: TeamsPageProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [teamName, setTeamName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(()=> {
    if(user && user.charactersOwned.length > 0){
      setCharacters(user.charactersOwned);
    }

  }, [user?.charactersOwned])

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
      const team = await createTeam(teamName, selectedIds)
      setTeams((current) => [...current, team])
      setTeamName('')
      setSelectedIds([])
    } catch (err) {
      setError('Failed to create team. Ensure you are logged in.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteTeam(teamUid: string) {
    try {
      await deleteTeam(teamUid)

      setTeams((current) => current.filter((team) => team.uid !== teamUid))
    } catch (err) {
      console.error('Failed to delete team', err)
    }
  }

  function handleEditTeam(team: Team) {
    setTeamName(team.name)
    setSelectedIds(team.characters.map((c) => c.id))

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleCharacter(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const getUniqueAttr = (arr: [], attr: string) => {
    const seen = new Set();
    return arr.filter((item) => {
      if (seen.has(item[attr])) return false;
      seen.add(item[attr]);
      return true;
    });
  };

  const attributeTypes = ["passion", "order", "justice", "void", "instinct"];

  return (
    <div>
      <div className={styles.container}>
        <section className={styles.pageHeader}>
          <Link to="/" className={styles.backLink}>← Back to characters</Link>
          <h2 className={styles.sectionTitle}>Team Builder</h2>
          {!user ? <p className={styles.subtitle}>Please log in to save teams.</p> : <p className={styles.subtitle}>Select up to three characters and save your team setup.</p>}
        </section>
        <section className={styles.panel}>
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
            {error && <p className={styles.errorStyle}>{error}</p>}
            <div className={styles.teamBuilder}>
              <div className={styles.characterGrid}>
                <Grid minItemWidth={120}>
                  {characters.map((character) => { 
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
                      style={{
                        backgroundImage: `url(${character.imageUrl})`
                      }}
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
                  const selectedCharacter = characters.filter(character => character.id === selectedId)[0]
                  return (
                    <div className={styles.slotRow}>
                      <span
                        className={styles.characterInTeam}
                        style={{ backgroundImage: `url(${selectedCharacter.imageUrl})` }}
                      />
                      <p className={styles.selectedCharacterDetails}>
                        <span className={styles.teamBuilderCharacterName}>{selectedCharacter.name}</span>
                        <span className={styles.attributeName}>
                          {selectedCharacter.attribute}
                        </span>
                      </p>
                      <button type="button" onClick={()=> toggleCharacter(selectedCharacter.id)} className={styles.removeSelectedCharacter}>&times;</button>
                    </div>
                  )
                })}
                <div className={styles.attributesContainer}>{attributeTypes.map(attrType => {
                  const imgUrl = `/images/elements/${attrType}.webp`;
                  const characterWithAttr = characters.filter(character => selectedIds.indexOf(character.uid) > -1 && character.attribute.toLowerCase() === attrType);
                  const isPresent = characterWithAttr.length > 0;
                  return (<img src={imgUrl} className={`${styles.attributeIcon}${isPresent ? ' ' + styles['attributeIcon--active'] : ''}`}/>)
                })}</div>
                {
                <button className={styles.saveButton} type="submit" disabled={saving || selectedIds.length < 3}>{saving ? 'Saving...' : 'Save team'}</button>
                }
              </aside>
            </div>
          </form>
        </section>

        <section className={styles.savedTeamsSection}>
          <h3 className="section-title">Saved Teams</h3>
          {teams.length === 0 ? (
            <p>No saved teams yet.</p>
          ) : (
            <Grid minItemWidth={320}>
              {teams.map((team) => {
                const createdDate = new Date(team.createdDate);
                const friendlyDate = `Created on: ${createdDate.toLocaleString('default', { 
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}`
                return (
                  <div key={team.uid} className={`${styles.panel} ${styles.team}`}>
                    <div className={styles.teamHeader}>
                      <div>
                        <h4 style={{ margin: 0 }}>{team.name}</h4>
                        <small style={{ color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>{friendlyDate}</small>
                      </div>
                      <button
                        type="button"
                        className={styles.deleteButton}
                        onClick={() => handleDeleteTeam(team.uid)}
                      >
                        &times;
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {team.characters.map((character) => {
                        return (
                          <div
                            key={team.uid + '-' + character.id}
                            className={styles.characterInTeam}
                            style={{
                              backgroundImage: `url(${character.imageUrl})`
                            }}
                          />
                        )
                      })}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row',  marginTop: '1rem', alignItems: 'flex-end'}}>
                      <div className={styles.attributesContainer}>{
                        Array.from(new Set(team.characters.map((c) => c.attribute))).map(attr => <img src={ `/images/elements/${attr.toLowerCase()}.webp`} className={`${styles.attributeIcon} ${styles['attributeIcon--active']}`} />)}</div>
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => handleEditTeam(team)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </Grid>
          )}
        </section>
      </div>
    </div>
  )
}
