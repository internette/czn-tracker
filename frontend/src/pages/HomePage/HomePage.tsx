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

    return (
        <div>
            <section style={homePageStyles.section}>
                <Card>
                    <h2 style={homePageStyles.title}>Your Characters</h2>
                    {!user ? (
                        <p style={homePageStyles.welcomeText}>Sign in with Google to save decks and build teams.</p>
                    ) : (
                        <p style={homePageStyles.welcomeText}>Welcome back, <Link to="/account">{user.name}</Link>! View your characters and save decks.</p>
                    )}
                    <Link to="/characters">View all characters →</Link>
                </Card>
            </section>
        </div>
    )
}
