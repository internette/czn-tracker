import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCharacters, getTeams, createTeam, deleteTeam } from '../api'
import { Character, Team, User } from '../types'

interface TeamsPageProps {
  user: User | null
}

const teamPageStyles = {
  selectedCharacterStyle: {
    textAlign: 'left',
    border: '2px solid #38bdf8',
    backgroundColor: '#0f172a',
  } as CSSProperties,
  unselectedCharacterStyle: {
    textAlign: 'left',
    border: '1px solid #334155',
    backgroundColor: '#111827',
  } as CSSProperties,
  errorStyle: {
    color: '#fb7185',
  } as CSSProperties,
  characterStyles: {
    width: "9rem",
    height: "9rem",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    padding: '0',
    position: 'relative'
  } as CSSProperties,
  characterName: {
    color: "white",
    background: 'linear-gradient(to top, #0f172a 70%, transparent 100%)',
    display: 'block',
    padding: '1rem 0.5rem 0.5rem',
    position: 'absolute',
    bottom: '0',
    margin: '0',
    width: '100%'
  } as CSSProperties,
  characterInTeam: {
    width: '5rem',
    height: '6rem',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    display: 'inline-block'
  } as CSSProperties,
  team: {
    display: 'block'
  } as CSSProperties
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

  function toggleCharacter(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  return (
    <div>
      <section className="card">
        <Link to="/">← Back to characters</Link>
        <h2 className="section-title">Team Builder</h2>
        {!user ? <p>Please log in to save teams.</p> : <p>Select characters and save your team setup.</p>}
      </section>
      <section className="card">
        <h3 className="section-title">Create Team</h3>
        <form onSubmit={handleSubmit} className="grid">
          <div className="input-group">
            <label>Team Name</label>
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="My team name" />
          </div>
          {error && <p style={teamPageStyles.errorStyle}>{error}</p>}
          <div className="grid">
            {characters.map((character) => { 
              const characterToggleStyles = selectedIds.includes(character.id) ? teamPageStyles.selectedCharacterStyle : teamPageStyles.unselectedCharacterStyle;
              return (
              <button
                key={character.id}
                type="button"
                onClick={() => {
                  const maxTeamLength = selectedIds.length < 3;
                  const isSelectedCharacter = selectedIds.indexOf(character.id) >= 0;
                  if((!error && maxTeamLength) || isSelectedCharacter){
                    toggleCharacter(character.id)
                  }
                }}
                style={{
                  ...characterToggleStyles,
                  ...teamPageStyles.characterStyles,
                  backgroundImage: `url(${character.imageUrl})`
                }}
              >
                <p style={{...teamPageStyles.characterName}}>{character.name}</p>
              </button>
            )})}
          </div>
          <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save team'}</button>
        </form>
      </section>

      <section className="card">
        <h3 className="section-title">Saved Teams</h3>
        {teams.length === 0 ? (
          <p>No saved teams yet.</p>
        ) : (
          <div className="grid">
            {teams.map((team) => { 
              const createdDate = new Date(team.createdDate);
              const friendlyDate = `created on: ${createdDate.toLocaleString('default', { 
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}`
              return (
                <div key={team.uid} className="card" style={teamPageStyles.team}>
                  <h4>
                    {team.name}
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team.uid)}
                    >
                      x
                    </button>
                  </h4>
                  <p>
                    <small>{friendlyDate}</small>
                  </p>
                  {team.characters.map((character) => {
                    return (<div style={{
                      ...teamPageStyles.characterInTeam,
                      backgroundImage: `url(${character.imageUrl})`
                    }}/>)
                  })}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
