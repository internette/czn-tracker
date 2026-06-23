import { CSSProperties, FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeams, createTeam, deleteTeam } from '../../api'
import { Character, Team, User } from '../../types'
import { Grid } from '../../components/ui'

interface TeamsPageProps {
  user: User | null
}

const teamPageStyles = {
  selectedCharacterStyle: {
    textAlign: 'left',
    border: '2px solid #4f7cff',
    backgroundColor: '#0b1220',
  } as CSSProperties,
  unselectedCharacterStyle: {
    textAlign: 'left',
    border: '1px solid #24314f',
    backgroundColor: '#0b1220',
  } as CSSProperties,
  errorStyle: {
    color: '#fb7185',
  } as CSSProperties,
  characterStyles: {
    width: '100%',
    aspectRatio: '1 / 1',
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    padding: '0',
    position: 'relative',
    borderRadius: '18px',
    overflow: 'hidden',
    minHeight: '180px',
    transition: 'all 0.2s ease'
  } as CSSProperties,
  characterName: {
    color: 'white',
    background: 'linear-gradient(to top, rgba(11,18,32,0.98) 60%, transparent 100%)',
    display: 'block',
    padding: '2rem 0.75rem 0.75rem',
    position: 'absolute',
    bottom: '0',
    margin: '0',
    width: '100%',
    fontWeight: 600,
    fontSize: '0.95rem'
  } as CSSProperties,
  characterInTeam: {
    width: '64px',
    height: '64px',
    borderRadius: '12px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    flexShrink: 0,
    display: 'inline-block'
  } as CSSProperties,
  team: {
    display: 'block'
  } as CSSProperties,
  teamBuilder: {
    display: 'flex',
    gap: '20px'
  } as CSSProperties,
  pageHeader: {
    marginBottom: '24px'
  } as CSSProperties,
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: '8px'
  } as CSSProperties,
  subtitle: {
    color: '#94a3b8',
    marginTop: 0
  } as CSSProperties,
  backLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: '12px'
  } as CSSProperties,
  teamNameLabel: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: 0
  } as CSSProperties,
  teamNameRow: {
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px'
  } as CSSProperties,
  deleteButton: {
    marginLeft: 'auto',
    width: '32px',
    height: '32px',
    borderRadius: '7px',
    border: '1px solid #334155',
    background: 'transparent',
    color: '#94a3b8',
    cursor: 'pointer'
  } as CSSProperties,
  teamHeader: {
    display: 'flex',
    gap: '12px'
  } as CSSProperties,
  panel: {
    background: 'linear-gradient(180deg, rgba(16,24,40,0.95) 0%, rgba(11,18,32,0.98) 100%)',
    border: '1px solid #24314f',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)'
  } as CSSProperties,
  characterGrid: {
    width: '100%'
  } as CSSProperties,
  teamSidebar: {
    background: '#0b1220',
    border: '1px solid #24314f',
    borderRadius: '24px',
    padding: '20px',
    position: 'sticky',
    width: '25rem',
    top: '24px'
  } as CSSProperties,
  slotRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    border: '1px solid #24314f',
    borderRadius: '16px',
    marginBottom: '12px'
  } as CSSProperties,
  saveButton: {
    width: '100%',
    marginTop: '24px',
    borderRadius: '14px',
    padding: '14px',
    background: 'linear-gradient(135deg, #4f7cff 0%, #38bdf8 100%)',
    color: '#fff',
    border: 'none',
    fontWeight: 700
  } as CSSProperties,
  saveButtonDisabled: {
    width: '100%',
    marginTop: '24px',
    borderRadius: '14px',
    padding: '14px',
    background: 'linear-gradient(135deg, #4f7cff 0%, #38bdf8 100%)',
    color: '#fff',
    border: 'none',
    fontWeight: 700,
    cursor: 'pointer',
    opacity: '0.5'
  } as CSSProperties,
  input: {
    width: '100%',
    background: '#111827',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff'
  } as CSSProperties,
  characterSelectorAttribute: {
    width: '1.75rem',
    display: 'block',
    position: 'absolute',
    top: '0.5rem',
    left: '0.5rem'
  } as CSSProperties,
  selectedCharacterAttribute: {
    width: '1.5rem'
  } as CSSProperties,
  removeSelectedCharacter: {
    background: 'none',
    color: '#94a3b8',
    border: '1px solid #94a3b8',
    borderRadius: '5px',
    padding: '0.3rem 0.6rem',
    marginLeft: 'auto',
    fontSize: '1.1rem'
  } as CSSProperties,
  selectedCharactersAttributes: {
    width: '1.5rem',
    height: '1.5rem',
    display: 'inline-block',
    opacity: '0.4'
  } as CSSProperties,
  selectedCharactersAttributesPresent: {
    opacity: '1'
  } as CSSProperties,
  attributesContainer: {
    display: 'flex',
    gap: '5px'
  } as CSSProperties,
  selectedCharacterDetails: {
    display: 'flex',
    flexDirection: 'column'
  } as CSSProperties,
  attributeName: {
    color: '#94a3b8',
    fontSize: '0.8rem'
  } as CSSProperties,
  editButton: {
    color: '#94a3b8',
    background: 'none',
    border: '1px solid rgb(51, 65, 85)',
    borderRadius: '5px',
    display: 'inline-block',
    padding: '0.75rem',
    marginLeft: 'auto'
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
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px' }}>
      <section style={teamPageStyles.pageHeader}>
        <Link to="/" style={teamPageStyles.backLink}>← Back to characters</Link>
        <h2 style={teamPageStyles.sectionTitle}>Team Builder</h2>
        {!user ? <p style={teamPageStyles.subtitle}>Please log in to save teams.</p> : <p style={teamPageStyles.subtitle}>Select up to three characters and save your team setup.</p>}
      </section>
      <section style={teamPageStyles.panel}>
        <form onSubmit={handleSubmit} className="grid">
          <div style={teamPageStyles.teamNameRow}>
            <label style={teamPageStyles.teamNameLabel}>Team name</label>
            <input
              style={teamPageStyles.input}
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="e.g. Eternal Hunger Sword Rain"
            />
          </div>
          {error && <p style={teamPageStyles.errorStyle}>{error}</p>}
          <div style={teamPageStyles.teamBuilder}>
            <div style={teamPageStyles.characterGrid}>
              <Grid minItemWidth={120}>
                {characters.map((character) => { 
                  const characterToggleStyles = selectedIds.includes(character.id) ? teamPageStyles.selectedCharacterStyle : teamPageStyles.unselectedCharacterStyle;
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
                    style={{
                      ...characterToggleStyles,
                      ...teamPageStyles.characterStyles,
                      backgroundImage: `url(${character.imageUrl})`,
                      boxShadow: selectedIds.includes(character.id)
                        ? '0 0 0 2px #4f7cff, 0 8px 24px rgba(79,124,255,0.35)'
                        : 'none'
                    }}
                  >
                    <img 
                      src={`/images/elements/${character.attribute.toLowerCase()}.webp`} 
                      alt="Character type element"
                      style={teamPageStyles.characterSelectorAttribute}/>
                    <p style={{...teamPageStyles.characterName}}>{character.name}</p>
                  </button>
                )})}
              </Grid>
            </div>
            <aside style={teamPageStyles.teamSidebar}>
              <h3 style={{ marginTop: 0 }}>Team Slots</h3>
              <p style={{ color: '#94a3b8' }}>{selectedIds.length} / 3 selected</p>
              {selectedIds.map(selectedId => {
                const selectedCharacter = characters.filter(character => character.id === selectedId)[0]
                return (
                  <div style={teamPageStyles.slotRow}>
                    <img 
                      src={`/images/elements/${selectedCharacter.attribute.toLowerCase()}.webp`}
                      style={teamPageStyles.selectedCharacterAttribute} />
                    <div style={{
                      ...teamPageStyles.characterInTeam,
                      backgroundImage: `url(${selectedCharacter.imageUrl})`
                    }}/>
                    <p style={teamPageStyles.selectedCharacterDetails}>
                      <span style={{ fontWeight: 600}}>{selectedCharacter.name}</span>
                      <span style={teamPageStyles.attributeName}>{selectedCharacter.attribute}</span>
                    </p>
                    <button type="button" onClick={()=> toggleCharacter(selectedCharacter.id)} style={teamPageStyles.removeSelectedCharacter}>&times;</button>
                  </div>
                )
              })}
              <div style={teamPageStyles.attributesContainer}>{attributeTypes.map(attrType => {
                const imgUrl = `/images/elements/${attrType}.webp`;
                const characterWithAttr = characters.filter(character => selectedIds.indexOf(character.uid) > -1 && character.attribute.toLowerCase() === attrType);
                const isPresent = characterWithAttr.length > 0;
                let styles = teamPageStyles.selectedCharactersAttributes;
                if(isPresent){
                  styles = {...styles, ...teamPageStyles.selectedCharactersAttributesPresent}
                }
                return (<img src={imgUrl} style={styles}/>)
              })}</div>
              {

              <button style={(saving || selectedIds.length < 3) ? teamPageStyles.saveButtonDisabled : teamPageStyles.saveButton} type="submit" disabled={saving || selectedIds.length < 3}>{saving ? 'Saving...' : 'Save team'}</button>
              }
            </aside>
          </div>
        </form>
      </section>

      <section style={{ marginTop: '32px' }}>
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
                <div key={team.uid} style={{ ...teamPageStyles.panel, ...teamPageStyles.team }}>
                  <div style={teamPageStyles.teamHeader}>
                    <div>
                      <h4 style={{ margin: 0 }}>{team.name}</h4>
                      <small style={{ color: '#94a3b8', display: 'block', marginBottom: '1rem' }}>{friendlyDate}</small>
                    </div>
                    <button
                      type="button"
                      style={teamPageStyles.deleteButton}
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
                          style={{
                            ...teamPageStyles.characterInTeam,
                            backgroundImage: `url(${character.imageUrl})`
                          }}
                        />
                      )
                    })}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'row',  marginTop: '1rem', alignItems: 'flex-end'}}>
                    <div style={{...teamPageStyles.attributesContainer}}>{
                      Array.from(new Set(team.characters.map((c) => c.attribute))).map(attr => <img src={ `/images/elements/${attr.toLowerCase()}.webp`} style={{
                        ...teamPageStyles.selectedCharactersAttributes,
                        ...teamPageStyles.selectedCharactersAttributesPresent
                      }} />)}</div>
                    <button
                      type="button"
                      style={teamPageStyles.editButton}
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
