import { CSSProperties, useState } from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'info' | 'warning' | 'error'
  style?: CSSProperties
  onClick?: () => void
}

const badgeStyles = {
  base: {
    display: 'inline-block',
    border: '1px solid white',
    padding: '0.2rem 0.5rem',
    fontSize: '0.8rem',
    transition: '0.15s all',
  } as CSSProperties
}

export default function Badge({ children, style, onClick }: BadgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const badgeStyle = {
    ...badgeStyles.base,
    ...style,
  }

  return (
    <span
      style={{
        ...badgeStyle,
        cursor: isHovered ? 'pointer' : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </span>
  )
}
