import styles from './Pill.module.scss'

interface PillProps {
  children: React.ReactNode
  variant?: string
  className?: string
}

export default function Pill({ children, variant, className }: PillProps) {
  return (
    <span className={`${styles.pill} ${variant ? styles[variant] ?? '' : ''} ${className ?? ''}`}>
      {children}
    </span>
  )
}
