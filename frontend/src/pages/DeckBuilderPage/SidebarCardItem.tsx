import { CSSProperties } from 'react'
import { Card } from '../../types'
import styles from './SidebarCardItem.module.scss'

interface SidebarCardItemProps {
  card: Card
  affinityColors: Record<string, string>
}

export default function SidebarCardItem({ card, affinityColors }: SidebarCardItemProps) {
  return (
    <>
      {card.imageUrl && (
        <div
          className={styles.sidebarItemImage}
          style={{ '--img': `url(${card.imageUrl})` } as CSSProperties}
        />
      )}
      <div className={styles.sidebarItemBody}>
        <span className={styles.sidebarItemName}>{card.name}</span>
        <span
          className={styles.sidebarItemAffinity}
          style={{ '--affinity-color': affinityColors[card.affinity?.toLowerCase()] || '#555' } as CSSProperties}
        >
          {card.affinity}
        </span>
      </div>
    </>
  )
}
