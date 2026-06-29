import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card as CardType, Character, Deck, Team, User } from '../../types'
import { getMyTeams, deleteTeam, getMyDecks, getCharacters, getCardsByCharacter } from '../../api'
import { Grid } from '../../components/ui'
import SavedTeamCard from '../../components/SavedTeamCard/SavedTeamCard'
import styles from './AccountPage.module.scss'

interface AccountPageProps {
  user: User | null
}

export default function AccountPage({ user }: AccountPageProps) {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [decks, setDecks] = useState<Deck[]>([])
  const [charactersMap, setCharactersMap] = useState<Record<string, Character>>({})
  const [cardsMap, setCardsMap] = useState<Record<string, CardType>>({})

  useEffect(() => {
    getCharacters().then((chars) => {
      const map: Record<string, Character> = {}
      for (const c of chars) {
        map[c.uid] = c
      }
      setCharactersMap(map)
    })
  }, [])

  useEffect(() => {
    async function loadTeams() {
      try {
        const response = await getMyTeams()
        setTeams(response ?? [])
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }
    async function loadDecks() {
      try {
        const response = await getMyDecks()
        setDecks(response ?? [])
        const uniqueCharacterUids = [...new Set((response ?? []).map((d) => d.characterUid))]
        const cardMap: Record<string, CardType> = {}
        await Promise.all(
          uniqueCharacterUids.map(async (uid) => {
            try {
              const result = await getCardsByCharacter(uid)
              for (const card of result.cards) {
                cardMap[card.uid] = card
              }
            } catch {}
          }),
        )
        setCardsMap(cardMap)
      } catch (error) {
        console.error('Error loading decks:', error)
      }
    }
    if(user){
        loadTeams()
        loadDecks()
    }
  }, [user])
  const mostUsedCharacters = useMemo(() => {
    
    const usageMap: Record<string, { character: any; count: number }> = {}

    teams.forEach((team: any) => {
      team.characters?.forEach((character: any) => {
        if (!usageMap[character.uid]) {
          usageMap[character.uid] = {
            character,
            count: 0,
          }
        }

        usageMap[character.uid].count += 1
      })
    })

    return Object.values(usageMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [teams])

  async function handleDeleteTeam(teamUid: string) {
      try {
        await deleteTeam(teamUid)
  
        setTeams((current) => current.filter((team) => team.uid !== teamUid))
      } catch (err) {
        console.error('Failed to delete team', err)
      }
    }
    function handleEditTeam(team: Team) {
        navigate('/teams', {
            state: {
                selectedIds: team.characters.map((c) => c.id),
                teamName: team.name,
                editingTeamId: team.uid,
            },
        })
    }

  return (
    <div>
      <h1>Account</h1>
      <section>
        <h2>Most Used Characters</h2>
        {mostUsedCharacters.length > 0 ? (
            <div className={styles.mostUsedCharacters}>
                <ol className={styles.topCharactersList}>
                    {mostUsedCharacters.map(({ character, count }) => {
                        const percentageFull = Math.floor((count * 100) / teams.length);
                        return (<li className={`${styles.topCharacterListItem} ${styles[character.attribute.toLowerCase()]}`} key={character.uid}>
                            <div className={styles.topCharacterListItem__icon} style={{backgroundImage: `url(${character.imageUrl})`}}/> 
                            <div className={styles.topCharacterListItem__details}>
                                <span>{character.name}</span>
                                <small className={`${styles.topCharacterListItem__attribute} ${styles[character.attribute.toLowerCase()]}`}>{character.attribute}</small>
                            </div>
                            <div className={styles.topCharacterListItem__countDetails}>
                                <div className={`${styles.topCharacterListItem__percentageBar} ${styles[character.attribute.toLowerCase()]}`} style={{ backgroundImage: `linear-gradient(to right, transparent ${percentageFull}%, #24314f ${percentageFull}%, #24314f ${percentageFull}% 100%)`}}/>
                                <div className={styles.topCharacterListItem__teamCount}>
                                    <small>
                                        <span>{count}</span>&nbsp;team{count > 1 && 's'}
                                    </small>
                                </div>
                            </div>
                        </li>)
                    })}
                </ol>
            </div>
        ) : (
          <p>No team data available.</p>
        )}
      </section>
      <section>
        <h2>Saved Teams</h2>

        {teams.length === 0 ? (
          <p>No saved teams.</p>
        ) : (
          <Grid minItemWidth={300}>
            {teams.map((team: any) => (
              <SavedTeamCard key={team.uid}
                  team={team}
                  onDelete={handleDeleteTeam}
                  onEdit={handleEditTeam}/>
            ))}
          </Grid>
        )}
      </section>
      <section>
        <h2>Saved Decks</h2>
        {decks.length === 0 ? (
          <p>No saved decks.</p>
        ) : (
          <div className={styles.deckGrid}>
            {decks.map((deck) => {
              const character = charactersMap[deck.characterUid]
              return (
                <div key={deck.uid} className={styles.deckTile}>
                  <div
                    className={styles.deckTileImage}
                    style={{ backgroundImage: `url(${character?.imageUrl || ''})` }}
                  />
                  <div className={styles.deckTileBody}>
                    <h3 className={styles.deckTileName}>{deck.name}</h3>
                    <ul className={styles.deckTileCardList}>
                      {deck.cardIds.map((cardUid) => {
                        const card = cardsMap[cardUid]
                        return <li key={cardUid} className={styles.deckTileCardItem}>{card?.name || cardUid}</li>
                      })}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}