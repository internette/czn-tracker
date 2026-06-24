import { CSSProperties } from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  style?: CSSProperties
}

const buttonStyles = {
  base: {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 20px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block',
    fontFamily: 'inherit',
  } as CSSProperties,
  primary: {
    background: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
    color: '#0f172a',
  } as CSSProperties,
  secondary: {
    background: '#334155',
    color: '#e2e8f0',
  } as CSSProperties,
  danger: {
    background: '#ef4444',
    color: 'white',
  } as CSSProperties,
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as CSSProperties,
}

export default function Button({
  children,
  onClick,
  href,
  variant = 'primary',
  disabled = false,
  type = 'button',
  style,
}: ButtonProps) {
  const buttonStyle = {
    ...buttonStyles.base,
    ...buttonStyles[variant],
    ...(disabled && buttonStyles.disabled),
    ...style,
  }

  if (href) {
    return (
      <a href={href} style={buttonStyle}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.4)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {children}
    </button>
  )
}
