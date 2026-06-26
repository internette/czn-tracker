import { Link } from 'react-router-dom'
import { User } from '../../../types'
import Button from '../../ui/Button/Button'
import { CSSProperties } from 'react'
import GoogleSignInButton from './GoogleSignInButton'

interface HeaderProps {
  user: User | null
}

const headerStyles = {
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderBottom: '1px solid #334155',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
  } as CSSProperties,
  container: {
    width: 'min(96%, 1200px)',
    margin: '0 auto',
    padding: '16px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  } as CSSProperties,
  left: {
    flexShrink: 0,
  } as CSSProperties,
  logo: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#38bdf8',
    textDecoration: 'none',
    letterSpacing: '0.5px',
    transition: 'color 0.3s ease',
  } as CSSProperties,
  nav: {
    display: 'flex',
    gap: '32px',
    flex: 1,
    justifyContent: 'center',
  } as CSSProperties,
  navLink: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    borderBottom: '2px solid transparent',
    paddingBottom: '4px',
  } as CSSProperties,
  right: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  } as CSSProperties,
  userName: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
  } as CSSProperties,
}

export default function Header({ user }: HeaderProps) {
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        <div style={headerStyles.left}>
          <Link
            to="/"
            style={headerStyles.logo}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#7dd3fc'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#38bdf8'
            }}
          >
            CZN Tracker
          </Link>
        </div>

        <nav style={headerStyles.nav}>
          <Link
            to="/"
            style={headerStyles.navLink}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#38bdf8'
              e.currentTarget.style.borderBottomColor = '#38bdf8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1'
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
          >
            Home
          </Link>
          <Link
            to="/characters"
            style={headerStyles.navLink}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#38bdf8'
              e.currentTarget.style.borderBottomColor = '#38bdf8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1'
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
          >
            Characters
          </Link>
          <Link
            to="/teams"
            style={headerStyles.navLink}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#38bdf8'
              e.currentTarget.style.borderBottomColor = '#38bdf8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#cbd5e1'
              e.currentTarget.style.borderBottomColor = 'transparent'
            }}
          >
            Teams
          </Link>
        </nav>

        <div style={headerStyles.right}>
          {user ? (
            <>
              <Link to="/account" className="user-name" style={headerStyles.userName}>
                {user.name}
              </Link>
              <Button
                href="/api/auth/logout"
                variant="secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Logout
              </Button>
            </>
          ) : (
            <GoogleSignInButton />
          )}
        </div>
      </div>
    </header>
  )
}
