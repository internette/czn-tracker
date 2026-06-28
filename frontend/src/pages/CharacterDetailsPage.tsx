import { FormEvent, useEffect, useState, CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { createDeck, getCharacter, getDecks } from '../api'
import { Character, Deck } from '../types'

export default function CharacterDetailsPage() {
  const { id } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [decks, setDecks] = useState<Deck[]>([])
  const [name, setName] = useState('')
  const [cards, setCards] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const characterDetailsStyles = {
    equipmentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: '12px',
    } as CSSProperties,

    equipmentItem: {
      background: 'rgba(15, 23, 42, 0.8)',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'right center',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.6)',
      marginBottom: '18px',
      padding: '10px',
      borderRadius: '10px',
      textAlign: 'center',
    } as CSSProperties,

    equipmentImage: {
      width: "7rem",
      height: "7rem",
      objectFit: 'cover',
      borderRadius: '8px',
    } as CSSProperties,

    equipmentName: {
      fontSize: "0.9rem"
    } as CSSProperties
  }

  useEffect(() => {
    if (!id) return
    async function load() {
      const char = await getCharacter(id);
      setCharacter(char);
    }
    load()
  }, [id]);

  if (!character) {
    return <div className="loading">Loading character...</div>
  }

  return (
    <div>
      <section className="card">
        <Link to="/">← Back to characters</Link>
        <Link to={`/characters/${character.id}/edit`} style={{ display: 'inline-block', marginLeft: '16px' }}>
          Edit
        </Link>
        <h2 className="section-title">{character.name}</h2>
        <div><img src={character.imageUrl}/></div>
        <p><strong>Best Partner:</strong></p>
        <div>
          <div><img src={character.bestPartner.img}/></div>
          <p>{character.bestPartner.name}</p>
        </div>
        <p><strong>Best Equipment:</strong></p>
        <div style={characterDetailsStyles.equipmentGrid}>
          {character.bestEquipment.map((equipment, idx) => (
            <div style={characterDetailsStyles.equipmentItem} key={idx}>
              <img src={equipment.img} style={characterDetailsStyles.equipmentImage} />
              <p style={characterDetailsStyles.equipmentName}>{equipment.name}</p>
            </div>
          ))}
        </div>

        {/* <p><strong>Best Sets:</strong></p> */}
        {/* <div>{character.bestSets.map(set => {

        })}</div> */}
        {/* <p><strong>Teammate:</strong> {character.teammate}</p> */}
      </section>
    </div>
  )
}
