import { CSSProperties } from 'react'
import { Card, Character, Deck } from '../../types'
import { Button } from '../ui'
import styles from './DeckCard.module.scss'

interface DeckCardProps {
  deck: Deck
  character: Character | undefined
  onDelete: (uid: string) => void
}

function CardImage({ card }: { card: Card }) {
  return card.imageUrl ? (
    <div
      className={styles.cardImage}
      style={{ '--img': `url(${card.imageUrl})` } as CSSProperties}
    />
  ) : (
    <div className={styles.cardImagePlaceholder}>?</div>
  )
}

export default function DeckCard({ deck, character, onDelete }: DeckCardProps) {
  const cards = deck.cards ?? []

  return (
    <div className={styles.deck}>
      <div className={styles.deckHeader}>
        <div
          className={styles.deckCharacterImage}
          style={{ '--img': `url(${character?.imageUrl || ''})` } as CSSProperties}
        />
        <div className={styles.deckInfo}>
          <h3 className={styles.deckName}>{deck.name}</h3>
          <p className={styles.deckMeta}>
            {character?.name || 'Unknown character'} &middot; {cards.length} card{cards.length !== 1 ? 's' : ''}
          </p>
          <p className={styles.deckMeta}>By: {deck.createdBy}</p>
          <p className={styles.deckMeta}>Created On: {deck.createdDate}</p>
        </div>
        <Button variant="secondary" size="sm" className={styles.deleteBtn} ariaLabel="Delete deck" onClick={() => onDelete(deck.uid)}>
          &times;
        </Button>
      </div>
      <div className={styles.cards}>
        {cards.length > 0 ? (
          cards.map((card) => <CardImage key={card.uid} card={card} />)
        ) : (
          <p className={styles.empty}>No cards</p>
        )}
      </div>
    </div>
  )
}
