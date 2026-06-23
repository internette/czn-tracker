import { CSSProperties } from 'react'

interface GridProps {
  children: React.ReactNode
  cols?: number
  minItemWidth?: number
  gap?: number
  style?: CSSProperties
}

const gridStyles = {
  container: (cols: number | undefined, gap: number, minItemWidth?: number) => ({
    display: 'grid',
    gridTemplateColumns: minItemWidth
      ? `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`
      : `repeat(${cols ?? 1}, 1fr)`,
    gap: `${gap}px`,
  } as CSSProperties),
}

export default function Grid({ children, cols = 1, gap = 16, minItemWidth, style }: GridProps) {
  return (
    <div style={{ ...gridStyles.container(cols, gap, minItemWidth), ...style }}>
      {children}
    </div>
  )
}
