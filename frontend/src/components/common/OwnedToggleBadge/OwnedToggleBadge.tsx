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

    const apiBase = import.meta.env.VITE_API_BASE || ''
    const nextIsOwned = !isOwned

    const response = await fetch(`${apiBase}/api/users/${user.uid}/characters/${character.uid}`, {
      method: isOwned ? 'DELETE' : 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      return
    }

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
