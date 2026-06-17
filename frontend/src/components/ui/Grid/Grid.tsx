import { CSSProperties } from 'react'

interface GridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: number
  style?: CSSProperties
}

const gridStyles = {
  container: (cols: number, gap: number) => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: `${gap}px`,
  } as CSSProperties),
}

export default function Grid({ children, cols = 1, gap = 16, style }: GridProps) {
  return (
    <div style={{ ...gridStyles.container(cols, gap), ...style }}>
      {children}
    </div>
  )
}
