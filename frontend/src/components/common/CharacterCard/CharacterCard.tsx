import { Link } from 'react-router-dom'
import { CSSProperties, useState } from 'react'
import { Character, User } from '../../../types'
import { Card, Badge } from '../../ui'

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
  ownedBadge: {
    background: 'white',
    color: '#0f172a',
  } as CSSProperties,
  unownedBadge: {
    background: '#0f172a',
    color: 'white',
  } as CSSProperties,
  toggleIcon: {
    marginRight: '0.3rem'
  }
}

export default function CharacterCard({ character, user }: CharacterCardProps) {
  const [isOwned, setIsOwned] = useState(
    user?.charactersOwned?.some((ownedCharacter) => ownedCharacter.uid === character.uid) ?? false,
  )

  const handleOwnershipToggle = async () => {
    if (!user?.uid) {
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const endpoint = `${apiBaseUrl}/users/${user.uid}/characters/${character.uid}`

    if (isOwned) {
      await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      })
    } else {
      await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
      })
    }

    setIsOwned(!isOwned)
  }

  return (
    <Card interactive style={{ transition: 'all 0.3s ease', backgroundImage: `url(${character.imageUrl})` }}>
      <div style={characterCardStyles.header}>
        <h3 style={characterCardStyles.title}>{character.name}</h3>
        <Badge
          onClick={handleOwnershipToggle}
          style={isOwned ? characterCardStyles.ownedBadge : characterCardStyles.unownedBadge}
        >
          <span style={characterCardStyles.toggleIcon}>{ isOwned ? '✔' : '+'}</span>
          {isOwned ? 'Owned' : 'Not Owned'}
        </Badge>
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
