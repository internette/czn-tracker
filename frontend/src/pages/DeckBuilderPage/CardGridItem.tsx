import { CSSProperties } from 'react'
import { Card } from '../../types'
import { Button } from '../../components/ui'
import styles from './CardGridItem.module.scss'

interface CardGridItemProps {
  card: Card
  count: number
  affinityColors: Record<string, string>
  onIncrement: (uid: string) => void
  onDecrement: (uid: string) => void
}

export default function CardGridItem({ card, count, affinityColors, onIncrement, onDecrement }: CardGridItemProps) {
  return (
    <div
      className={`${styles.cardItem}${count > 0 ? ` ${styles.cardItemSelected}` : ''}`}
    >
      {card.imageUrl && (
        <div
          className={styles.cardImage}
          style={{ '--img': `url(${card.imageUrl})` } as CSSProperties}
        />
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardName}>{card.name}</h3>
          <span
            className={styles.cardAffinity}
            style={{ '--affinity-color': affinityColors[card.affinity?.toLowerCase()] || '#555' } as CSSProperties}
          >
            {card.affinity}
          </span>
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.cardType}>{card.type}</span>
          {card.subType && <span className={styles.cardSubType}>{card.subType}</span>}
          <span className={styles.cardApCost}>AP {card.apCost}</span>
        </div>
        {card.effect.length > 0 && (
          <ul className={styles.cardEffects}>
            {card.effect.map((eff, i) => (
              <li key={i} className={styles.cardEffect}>
                {eff}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className={styles.counter}>
        <Button variant="secondary" size="sm" ariaLabel="Decrement" onClick={() => onDecrement(card.uid)}>
          &minus;
        </Button>
        <span className={styles.counterValue}>{count}</span>
        <Button variant="secondary" size="sm" ariaLabel="Increment" onClick={() => onIncrement(card.uid)}>
          +
        </Button>
      </div>
    </div>
  )
}
