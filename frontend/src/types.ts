export interface User {
  email: string
  name: string
  uid: string
  charactersOwned: Character[]
}

interface PartnerForCharacter {
  uid: string, 
  name: string,
  img: string
}

interface Equipment {
  type: string,
  name: string,
  url: string,
  img: string
}

export interface Character {
  bestEquipment: Equipment[]
  bestPartner: PartnerForCharacter
  id: string
  name: string
  uid: string
  tier: string
  type: string
  faction: string
  rarity: string
  attribute: string
  imageUrl: string
}

export interface Deck {
  id: string
  characterId: string
  ownerEmail: string
  name: string
  cards: string[]
  createdAt: number
}

export interface Team {
  id: string
  ownerEmail: string
  name: string
  characterIds: string[]
  createdAt: number
}
