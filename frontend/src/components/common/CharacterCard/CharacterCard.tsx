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
  title: {
    margin: 0,
    fontSize: '1rem',
    textTransform: 'uppercase',
    color: '#e2e8f0',
    flexGrow: '2'
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
    display: 'block',
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
  } as CSSProperties,
  img: {
    justifySelf: 'stretch',
    width: '100%',
    padding: '50%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
    mask: 'linear-gradient(black 70%, transparent 100%)'
  } as CSSProperties,
  details: {
    padding: '0.8rem'
  } as CSSProperties,
  titleBar: {
    display: 'flex',
    flexGrow: '1',
    alignItems: 'baseline',
    marginBottom: '1.5rem'
  } as CSSProperties
}

export default function CharacterCard({ character, user }: CharacterCardProps) {
  return (
    <Card style={{ transition: 'all 0.3s ease', border: '1px solid #334155', marginBottom: '18px', }}>
      <div style={{ ...characterCardStyles.img, backgroundImage: `url(${character.imageUrl})` }}></div>
      <div style={characterCardStyles.details}>
        <div style={characterCardStyles.titleBar}>
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
      </div>
    </Card>
  )
}
