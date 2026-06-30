import { Link } from 'react-router-dom'
import { User } from '../../../types'
import Button from '../../ui/Button/Button'
import GoogleSignInButton from './GoogleSignInButton'
import styles from './Header.module.scss'

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            CZN Tracker
          </Link>
        </div>

        <nav className={styles.nav}>
          <Link to="/" className={styles.navLink}>Home</Link>
          <Link to="/characters" className={styles.navLink}>Characters</Link>
          <Link to="/teams" className={styles.navLink}>Teams</Link>
          <Link to="/decks" className={styles.navLink}>Decks</Link>
        </nav>

        <div className={styles.right}>
          {user ? (
            <>
              <Link to="/account" className={`user-name ${styles.userName}`}>
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
