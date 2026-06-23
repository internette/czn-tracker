import { CSSProperties } from 'react'

interface CardProps {
  children: React.ReactNode
  style?: CSSProperties
  className?: string
  interactive?: boolean
}

const cardStyles = {
  base: {
    background: 'linear-gradient(180deg, rgba(16,24,40,0.95) 0%, rgba(11,18,32,0.98) 100%)',
    border: '1px solid #24314f',
    borderRadius: '24px',
    padding: '24px',
    overflow: 'hidden',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'contain',
    backgroundPosition: 'right center',
    boxShadow: '0 12px 40px rgba(0,0,0,0.35)'
  } as CSSProperties,
  interactive: {
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  } as CSSProperties,
}

export default function Card({ children, style, className, interactive = false }: CardProps) {
  const baseStyle = {
    ...cardStyles.base,
    ...(interactive && cardStyles.interactive),
    ...style,
  }

  return (
    <div
      className={className}
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
          el.style.borderColor = '#24314f'
          el.style.boxShadow = '0 12px 40px rgba(0,0,0,0.35)'
          el.style.transform = 'none'
        }
      }}
    >
      {children}
    </div>
  )
}
