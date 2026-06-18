import { Character, Deck, Team, User } from './types'

const apiBase = import.meta.env.VITE_API_BASE || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }

  return response.json()
}

export async function getMe(): Promise<{ user: User | null }> {
  return request('/api/me')
}

export async function getCharacters(): Promise<Character[]> {
  return request('/api/characters')
}

export async function getCharacter(id: string): Promise<Character> {
  return request(`/api/characters/${id}`)
}

export type UpdateCharacterInput = Pick<
  Character,
  'name' | 'tier' | 'type' | 'faction' | 'rarity' | 'attribute' | 'imageUrl'
>

export async function updateCharacter(id: string, character: UpdateCharacterInput): Promise<Character> {
  return request(`/api/characters/${id}`, {
    method: 'PUT',
    body: JSON.stringify(character),
  })
}

export async function getDecks(characterId: string): Promise<{ decks: Deck[] }> {
  return request(`/api/characters/${characterId}/decks`)
}

export async function createDeck(characterId: string, name: string, cards: string[]): Promise<Deck> {
  return request(`/api/characters/${characterId}/decks`, {
    method: 'POST',
    body: JSON.stringify({ name, cards }),
  })
}

export async function getTeams(): Promise<{ teams: Team[] }> {
  return request('/api/teams')
}

export async function createTeam(name: string, characterIds: string[]): Promise<Team> {
  return request('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, characterIds }),
  })
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' })
}
