import { Link } from 'react-router-dom'
import { User } from '../types'

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/" className="logo">
            CZN Tracker
          </Link>
        </div>

        <nav className="header-nav">
          <Link to="/">Home</Link>
          <Link to="/characters">Characters</Link>
          <Link to="/teams">Teams</Link>
        </nav>

        <div className="header-right">
          {user ? (
            <div className="user-section">
              <span className="user-name">{user.name}</span>
              <a
                href="http://localhost:8080/auth/logout"
                className="logout-btn"
              >
                Logout
              </a>
            </div>
          ) : (
            <a
              href="http://localhost:8080/auth/google/login"
              className="login-btn"
            >
              Sign in with Google
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
