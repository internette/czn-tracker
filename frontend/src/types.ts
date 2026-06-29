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
  uid: string
  name: string
  characterUid: string
  cardIds: string[]
  createdBy: string
  createdDate: string
}

export interface CardTag {
  tagName: string
  effect: string
}

export interface Card {
  uid: string
  name: string
  effect: string[]
  type: string
  apCost: string
  user: string
  subType: string
  affinity: string
  imageUrl: string
  tags: CardTag[]
}

export interface Team {
  uid: string
  name: string
  characters: Character[]
  createdDate: number
  createdBy: string
}
