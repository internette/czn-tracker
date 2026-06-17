import { CSSProperties } from 'react'

interface CardProps {
  children: React.ReactNode
  style?: CSSProperties
  className?: string
  interactive?: boolean
}

const cardStyles = {
  base: {
    border: '1px solid #334155',
    borderRadius: '18px',
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.8)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundPosition: 'right center',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.6)',
    marginBottom: '18px',
  } as CSSProperties,
  interactive: {
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  } as CSSProperties,
}

export default function Card({ children, style, interactive = false }: CardProps) {
  const baseStyle = {
    ...cardStyles.base,
    ...(interactive && cardStyles.interactive),
    ...style,
  }

  return (
    <div
      style={baseStyle}
      onMouseEnter={(e) => {
        if (interactive) {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = '#38bdf8'
          el.style.boxShadow = '0 8px 24px rgba(56, 189, 248, 0.2)'
          el.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = '#334155'
          el.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.6)'
          el.style.transform = 'none'
        }
      }}
    >
      {children}
    </div>
  )
}
