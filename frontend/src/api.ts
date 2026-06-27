import { Character, Deck, Team, User } from './types'

const apiBase = import.meta.env.VITE_API_BASE || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: 'include',
    cache: 'no-store',
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

export async function updateCharacter(
  id: string,
  character: UpdateCharacterInput,
  image?: File | null,
): Promise<Character> {
  const formData = new FormData()
  formData.append('name', character.name)
  formData.append('tier', character.tier)
  formData.append('type', character.type)
  formData.append('faction', character.faction)
  formData.append('rarity', character.rarity)
  formData.append('attribute', character.attribute)
  formData.append('imageUrl', character.imageUrl)

  if (image) {
    formData.append('image', image)
  }

  const response = await fetch(`${apiBase}/api/characters/${id}/edit`, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || response.statusText)
  }

  return response.json()
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

export async function getTeams(): Promise<Team[]> {
  return request('/api/teams')
}

export async function getMyTeams(): Promise<Team[]> {
  return request('/api/teams/mine')
}

export async function createTeam(name: string, characterIds: string[]): Promise<Team> {
  return request('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, characterIds }),
  })
}

export async function updateTeam(
  uid: string,
  input: { name?: string; characterIds?: string[] }
): Promise<Team> {
  return request(`/api/teams/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' })
}

export async function deleteTeam(uid: string): Promise<void> {
  await request(`/api/teams/${uid}`, {
    method: 'DELETE',
  })
}
