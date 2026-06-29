import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCharacter } from '../api'
import { Character } from '../types'
import styles from './CharacterDetailsPage.module.scss'

export default function CharacterDetailsPage() {
  const { id } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)

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
        <div className={styles.equipmentGrid}>
          {character.bestEquipment.map((equipment, idx) => (
            <div className={styles.equipmentItem} key={idx}>
              <img src={equipment.img} className={styles.equipmentImage} />
              <p className={styles.equipmentName}>{equipment.name}</p>
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
