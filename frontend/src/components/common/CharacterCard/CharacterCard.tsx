import { Link } from 'react-router-dom'
import { Character, User } from '../../../types'
import { Card } from '../../ui'
import OwnedToggleBadge from '../OwnedToggleBadge/OwnedToggleBadge'
import styles from './CharacterCard.module.scss'

interface CharacterCardProps {
  character: Character
  user?: User | null
}

export default function CharacterCard({ character, user }: CharacterCardProps) {
  return (
    <Card className={styles.card}>
      <div
        className={styles.img}
        style={{ backgroundImage: `url(${character.imageUrl})` }}
      />
      <div className={styles.details}>
        <div className={styles.titleBar}>
          <div className={styles.characterDetails}>
            <h3 className={styles.title}>{character.name}</h3>
            <small className={`${styles.attribute} ${styles[character.attribute.toLowerCase()]}`}>{character.attribute}</small>
          </div>
          <OwnedToggleBadge character={character} user={user} />
        </div>
        <Link
          to={`/characters/${character.id}`}
          className={styles.link}
        >
          View Details <i className="ti ti-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    </Card>
  )
}
