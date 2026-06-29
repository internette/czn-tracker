import { CSSProperties } from 'react'
import styles from './Grid.module.scss'

interface GridProps {
  children: React.ReactNode
  cols?: number
  minItemWidth?: number
  gap?: number
  style?: CSSProperties
}

export default function Grid({ children, cols = 1, gap = 16, minItemWidth, style }: GridProps) {
  const gridTemplate = minItemWidth
    ? `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`
    : `repeat(${cols}, 1fr)`

  return (
    <div
      className={styles.grid}
      style={{ '--grid-template': gridTemplate, '--gap': `${gap}px`, ...style } as CSSProperties}
    >
      {children}
    </div>
  )
}
