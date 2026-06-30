import { CSSProperties } from 'react'
import { Team } from "../../types"
import { Button } from "../ui"
import styles from "./SavedTeamCard.module.scss"

interface SavedTeamCardProps {
  team: Team
  onDelete: (teamUid: string) => void
  onEdit: (team: Team) => void
}

export default function SavedTeamCard({ team, onDelete, onEdit }: SavedTeamCardProps) {
  const createdDate = new Date(team.createdDate)
  const friendlyDate = `Created on: ${createdDate.toLocaleString('default', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`

  return (
    <div className={`${styles.panel} ${styles.team}`}>
      <div className={styles.teamHeader}>
        <div className={styles.teamHeaderDetails}>
          <h4 className={styles.teamTitle}>{team.name}</h4>
          <small className={styles.teamCreator}>By: {team.createdBy.length > 0 ? team.createdBy : 'anonymous'}</small>
          <small className={styles.teamDate}>{friendlyDate}</small>
        </div>
        <Button variant="secondary" size="sm" className={styles.deleteBtn} ariaLabel="Delete team" onClick={() => onDelete(team.uid)}>
          &times;
        </Button>
      </div>

      <div className={styles.teamCharactersRow}>
        {team.characters.map((character) => (
          <div
            key={team.uid + '-' + character.id}
            className={`${styles.characterInTeam} ${styles[character.attribute.toLowerCase()]}`}
            style={{ '--img': `url(${character.imageUrl})` } as CSSProperties}
          />
        ))}
      </div>

      <div className={styles.teamFooter}>
        <div className={styles.attributesContainer}>
          {Array.from(new Set(team.characters.map((c) => c.attribute))).map((attr) => (
            <img
              key={attr}
              src={`/images/elements/${attr.toLowerCase()}.webp`}
              className={`${styles.attributeIcon} ${styles['attributeIcon--active']}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" className={styles.editButton} onClick={() => onEdit(team)}>
          Edit
        </Button>
      </div>
    </div>
  )
}