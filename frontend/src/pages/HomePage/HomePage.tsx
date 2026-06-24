import { useEffect, useState, CSSProperties } from 'react'
import { getCharacters } from '../../api'
import { Character, User } from '../../types'
import { Card, Grid, LoadingState, EmptyState } from '../../components/ui'
import Link from '../../components/ui/Link/Link'
import { CharacterCard } from '../../components/common'

interface HomePageProps {
    user: User | null
}

const homePageStyles = {
    section: {
        marginBottom: '24px',
    } as CSSProperties,
    title: {
        margin: '0 0 8px 0',
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#e2e8f0',
    } as CSSProperties,
    description: {
        margin: '0 0 16px 0',
        color: '#cbd5e1',
        fontSize: '0.95rem',
    } as CSSProperties,
    welcomeText: {
        color: '#cbd5e1',
        fontSize: '0.95rem',
    } as CSSProperties,
}

export default function HomePage({ user }: HomePageProps) {
    const [characters, setCharacters] = useState<Character[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadCharacters() {
            setLoading(true)
            const response = await getCharacters()
            setCharacters(response.characters)
            setLoading(false)
        }
        loadCharacters()
    }, [])

    return (
        <div>
            <section style={homePageStyles.section}>
                <Card>
                    <h2 style={homePageStyles.title}>Your Characters</h2>
                    {!user ? (
                        <p style={homePageStyles.welcomeText}>Sign in with Google to save decks and build teams.</p>
                    ) : (
                        <p style={homePageStyles.welcomeText}>Welcome back, {user.name}! View your characters and save decks.</p>
                    )}
                    {loading ? (
                        <LoadingState message="Loading characters..." />
                    ) : characters.length === 0 ? (
                        <EmptyState title="No characters available" />
                    ) : (
                        <Grid cols={2} gap={16}>
                            {characters.slice(0, 2).map((character) => (
                                <CharacterCard key={character.id} character={character} />
                            ))}
                        </Grid>
                    )}
                    <Link to="/characters">View all characters →</Link>
                </Card>
            </section>

            <section style={homePageStyles.section}>
                <Card>
                    <h2 style={homePageStyles.title}>Build Teams</h2>
                    <p style={homePageStyles.description}>
                        Create team compositions from your characters and store them for later.
                    </p>
                    <Link to="/teams">Open team builder →</Link>
                </Card>
            </section>
        </div>
    )
}
