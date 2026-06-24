import { useState } from 'react'
import { Character, User } from '../../../types'
import { Badge } from '../../ui'
import styles from './OwnedToggleBadge.module.scss'

interface OwnedToggleBadgeProps {
  character: Character
  user?: User | null
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
  const stateClass = isOwned && styles.ownedBadge;
  const className = `${styles.base} ${stateClass}`

  return (
    <Badge
      onClick={handleOwnershipToggle}
      className={className}
    >
      <span className={styles.toggleIcon}>{isOwned ? '✔' : '+'}</span>
      {isOwned ? 'Owned' : 'Not Owned'}
    </Badge>
  )
}
