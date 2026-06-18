import { CSSProperties, useState } from 'react'
import { Character, User } from '../../../types'
import { Badge } from '../../ui'

interface OwnedToggleBadgeProps {
  character: Character
  user?: User | null
}

const ownedToggleBadgeStyles = {
  base: {
    textTransform: "uppercase",
    fontSize: "0.75rem",
    marginTop: "0.5rem"
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
    marginRight: '0.3rem',
  } as CSSProperties,
}

export default function OwnedToggleBadge({ character, user }: OwnedToggleBadgeProps) {
  const [isOwned, setIsOwned] = useState(
    user?.charactersOwned?.some((ownedCharacter) => ownedCharacter.uid === character.uid) ?? false,
  )

  const handleOwnershipToggle = async () => {
    if (!user?.uid) {
      return
    }

    const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
    const endpoint = `${apiBaseUrl}/users/${user.uid}/characters/${character.uid}`
    const nextIsOwned = !isOwned

    await fetch(endpoint, {
      method: isOwned ? 'DELETE' : 'POST',
      credentials: 'include',
    })

    setIsOwned(nextIsOwned)
  }
  const toggleStyles = isOwned ? ownedToggleBadgeStyles.ownedBadge : ownedToggleBadgeStyles.unownedBadge;
  const styles = {
    ...toggleStyles, 
    ...ownedToggleBadgeStyles.base
  }

  return (
    <Badge
      onClick={handleOwnershipToggle}
      style={styles}
    >
      <span style={ownedToggleBadgeStyles.toggleIcon}>{isOwned ? '✔' : '+'}</span>
      {isOwned ? 'Owned' : 'Not Owned'}
    </Badge>
  )
}
