import { CSSProperties } from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'info' | 'warning' | 'error'
  style?: CSSProperties
}

const badgeStyles = {
  base: {
    display: 'inline-block',
    borderRadius: '999px',
    padding: '4px 12px',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginBottom: '12px',
  } as CSSProperties,
  success: {
    background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
  } as CSSProperties,
  info: {
    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
    color: '#0f172a',
  } as CSSProperties,
  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
  } as CSSProperties,
  error: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
  } as CSSProperties,
}

export default function Badge({ children, variant = 'info', style }: BadgeProps) {
  const badgeStyle = {
    ...badgeStyles.base,
    ...badgeStyles[variant],
    ...style,
  }

  return <span style={badgeStyle}>{children}</span>
}
