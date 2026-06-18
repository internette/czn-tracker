import { Link } from 'react-router-dom'
import { CSSProperties } from 'react'
import { Character, User } from '../../../types'
import { Card } from '../../ui'
import OwnedToggleBadge from '../OwnedToggleBadge/OwnedToggleBadge'

interface CharacterCardProps {
  character: Character
  user?: User | null
}

const characterCardStyles = {
  header: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'start',
    marginBottom: '12px',
  } as CSSProperties,
  title: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#e2e8f0',
  } as CSSProperties,
  property: {
    margin: '8px 0',
    fontSize: '0.95rem',
  } as CSSProperties,
  propertyLabel: {
    fontWeight: 600,
    color: '#cbd5e1',
  } as CSSProperties,
  propertyValue: {
    color: '#94a3b8',
  } as CSSProperties,
  link: {
    display: 'inline-block',
    marginTop: '12px',
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  } as CSSProperties,
}

export default function CharacterCard({ character, user }: CharacterCardProps) {
  return (
    <Card style={{ transition: 'all 0.3s ease', backgroundImage: `url(${character.imageUrl})` }}>
      <div style={characterCardStyles.header}>
        <h3 style={characterCardStyles.title}>{character.name}</h3>
        <OwnedToggleBadge character={character} user={user} />
      </div>

      <Link
        to={`/characters/${character.id}`}
        style={characterCardStyles.link}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#7dd3fc'
          e.currentTarget.style.transform = 'translateX(4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#38bdf8'
          e.currentTarget.style.transform = 'none'
        }}
      >
        View Details →
      </Link>
    </Card>
  )
}
