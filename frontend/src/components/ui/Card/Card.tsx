import styles from './Card.module.scss'

interface CardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
}

export default function Card({ children, className, interactive = false }: CardProps) {
  return (
    <div
      className={[
        styles.card,
        interactive ? styles.interactive : '',
        className ?? ''
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
