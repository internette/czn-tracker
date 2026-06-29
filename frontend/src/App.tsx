import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { getMe } from './api'
import { User } from './types'
import { Header } from './components/layout'
import { LoadingState } from './components/ui'
import HomePage from './pages/HomePage/HomePage'
import CharactersPage from './pages/CharactersPage/CharactersPage'
import CharacterDetailsPage from './pages/CharacterDetailsPage'
import TeamsPage from './pages/TeamsPage/TeamsPage'
import AddCharacterPage from './pages/AddCharacterPage/AddCharacterPage'
import EditCharacterPage from './pages/EditCharacterPage/EditCharacterPage'
import AccountPage from './pages/AccountPage/AccountPage'
import DeckBuilderPage from './pages/DeckBuilderPage/DeckBuilderPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadCurrentUser() {
      setLoading(true)
      try {
        const result = await getMe()
        setUser(result.user)
      } catch (error) {
        console.error('Error fetching current user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    loadCurrentUser()
  }, [])

  return (
    <div className="app">
      <Header user={user} />

      <main className="main-content">
        {loading ? (
          <LoadingState />
        ) : (
          <Routes>
            <Route path="/" element={<HomePage user={user} />} />
            <Route path="/characters" element={<CharactersPage user={user} />} />
            <Route path="/characters/:id" element={<CharacterDetailsPage />} />
            <Route path="/characters/:id/edit" element={<EditCharacterPage />} />
            <Route path="/teams" element={<TeamsPage user={user} />} />
            <Route path="/account" element={<AccountPage user={user} />} />
            <Route path="/add-character" element={<AddCharacterPage />} />
            <Route path="/deck-builder" element={<DeckBuilderPage user={user} />} />
          </Routes>
        )}
      </main>
    </div>
  )
}

export default App
