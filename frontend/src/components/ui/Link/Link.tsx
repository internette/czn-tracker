import { Link as RouterLink } from 'react-router-dom'
import { CSSProperties } from 'react'

interface LinkProps {
  to: string
  children: React.ReactNode
  external?: boolean
  style?: CSSProperties
}

const linkStyles = {
  base: {
    color: '#38bdf8',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    display: 'inline-block',
    borderBottom: '2px solid transparent',
  } as CSSProperties,
}

export default function Link({ to, children, external = false, style }: LinkProps) {
  const linkStyle = {
    ...linkStyles.base,
    ...style,
  }

  if (external) {
    return (
      <a
        href={to}
        style={linkStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#7dd3fc'
          e.currentTarget.style.transform = 'translateX(4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#38bdf8'
          e.currentTarget.style.transform = 'none'
        }}
      >
        {children}
      </a>
    )
  }

  return (
    <RouterLink
      to={to}
      style={linkStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#7dd3fc'
        e.currentTarget.style.transform = 'translateX(4px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#38bdf8'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {children}
    </RouterLink>
  )
}
