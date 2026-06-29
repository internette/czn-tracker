import { User } from '../../types'
import { Card } from '../../components/ui'
import Link from '../../components/ui/Link/Link'
import styles from './HomePage.module.scss'

interface HomePageProps {
    user: User | null
}

export default function HomePage({ user }: HomePageProps) {

    return (
        <div>
            <section className={styles.section}>
                <Card>
                    <h2 className={styles.title}>Your Characters</h2>
                    {!user ? (
                        <p className={styles.welcomeText}>Sign in with Google to save decks and build teams.</p>
                    ) : (
                        <p className={styles.welcomeText}>Welcome back, <Link to="/account">{user.name}</Link>! View your characters and save decks.</p>
                    )}
                    <Link to="/characters">View all characters →</Link>
                </Card>
            </section>
        </div>
    )
}
