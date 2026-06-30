package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/securecookie"
	"google.golang.org/api/idtoken"
	_ "modernc.org/sqlite"
)

const sessionCookieName = "czn_session"
const characterImageURLPrefix = "/images/characters"

type User struct {
	UID             string      `json:"uid"`
	Email           string      `json:"email"`
	Name            string      `json:"name"`
	CharactersOwned []Character `json:"charactersOwned"`
}

type Session struct {
	UID   string `json:"uid"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type EgoSkill struct {
	Name    string `json:"name"`
	Img     string `json:"img"`
	Details string `json:"details"`
}

type Partner struct {
	UID                string   `json:"uid"`
	Name               string   `json:"name"`
	Img                string   `json:"img"`
	Class              string   `json:"class"`
	Rarity             string   `json:"rarity"`
	EPCost             string   `json:"ep_cost"`
	Attack             string   `json:"attack"`
	Defense            string   `json:"defense"`
	Health             string   `json:"health"`
	PassiveName        string   `json:"passive_name"`
	PassiveDescription string   `json:"passive_description"`
	EgoSkill           EgoSkill `json:"ego_skill"`
	SourceURL          string   `json:"source_url"`
}

type Equipment struct {
	Type string `json:"type"`
	Name string `json:"name"`
	URL  string `json:"url"`
	Img  string `json:"img"`
}

type Stat struct {
	ID           string `json:"id"`
	FriendlyName string `json:"friendlyName"`
	Value        string `json:"value"`
}

type Character struct {
	UID           string      `json:"uid"`
	ID            string      `json:"id"`
	Name          string      `json:"name"`
	Tier          string      `json:"tier"`
	Type          string      `json:"type"`
	Faction       string      `json:"faction"`
	Rarity        string      `json:"rarity"`
	Attribute     string      `json:"attribute"`
	ImageUrl      string      `json:"imageUrl"`
	BestPartner   *Partner    `json:"bestPartner,omitempty"`
	BestEquipment []Equipment `json:"bestEquipment"`
	Stats         []Stat      `json:"stats"`
}

type UpdateCharacterInput struct {
	Name      string `json:"name"`
	Tier      string `json:"tier"`
	Type      string `json:"type"`
	Faction   string `json:"faction"`
	Rarity    string `json:"rarity"`
	Attribute string `json:"attribute"`
	ImageUrl  string `json:"imageUrl"`
}

type Store struct {
	useSQLite bool
	db        *sql.DB
}

type Team struct {
	UID         string      `json:"uid"`
	Name        string      `json:"name"`
	Characters  []Character `json:"characters"`
	Decks       []string    `json:"decks"`
	CreatedDate string      `json:"createdDate"`
	CreatedBy   string      `json:"createdBy"`
}

type CardTag struct {
	TagName string `json:"tagName"`
	Effect  string `json:"effect"`
}

type Card struct {
	UID      string `json:"uid"`
	Name     string `json:"name"`
	Effect   string `json:"effect"`
	Type     string `json:"type"`
	APCost   string `json:"apCost"`
	User     string `json:"user"`
	SubType  string `json:"subType"`
	Affinity string `json:"affinity"`
	ImageUrl string `json:"imageUrl"`
	Tags     string `json:"tags"`
}

type CreateTeamInput struct {
	Name         string   `json:"name"`
	CharacterIDs []string `json:"characterIds"`
	DeckIDs      []string `json:"deckIds"`
}

type UpdateTeamInput struct {
	Name         string   `json:"name"`
	CharacterIDs []string `json:"characterIds"`
	DeckIDs      []string `json:"deckIds"`
}

type DeckCard struct {
	UID      string    `json:"uid"`
	Name     string    `json:"name"`
	Effect   []string  `json:"effect"`
	Type     string    `json:"type"`
	APCost   string    `json:"apCost"`
	User     string    `json:"user"`
	SubType  string    `json:"subType"`
	Affinity string    `json:"affinity"`
	ImageUrl string    `json:"imageUrl"`
	Tags     []CardTag `json:"tags"`
}

type Deck struct {
	UID          string     `json:"uid"`
	Name         string     `json:"name"`
	CharacterUID string     `json:"characterUid"`
	CardIDs      []string   `json:"cardIds"`
	Cards        []DeckCard `json:"cards,omitempty"`
	CreatedBy    string     `json:"createdBy"`
	CreatedDate  string     `json:"createdDate"`
}

type CreateDeckInput struct {
	Name         string   `json:"name"`
	CharacterUID string   `json:"characterUid"`
	CardIDs      []string `json:"cardIds"`
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*User, error) {
	var user User
	var charactersOwned sql.NullString

	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, email, COALESCE(characters_owned, '[]')
		FROM users
		WHERE email = ?
	`, email).Scan(
		&user.UID,
		&user.Name,
		&user.Email,
		&charactersOwned,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	ids := []string{}

	if charactersOwned.Valid && charactersOwned.String != "" {
		_ = json.Unmarshal([]byte(charactersOwned.String), &ids)
	}

	for _, id := range ids {
		char, err := s.GetCharacterByID(ctx, id)
		if err == nil {
			user.CharactersOwned = append(user.CharactersOwned, char)
		}
	}
	if user.CharactersOwned == nil {
		user.CharactersOwned = []Character{}
	}
	return &user, nil
}

func (s *Store) CreateUser(ctx context.Context, name, email string) (*User, error) {
	uid := uuid.NewString()

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO users (
			id,
			name,
			email,
			characters_owned
		)
		VALUES (?, ?, ?, ?)
	`, uid, name, email, "[]")
	if err != nil {
		return nil, err
	}

	return &User{
		UID:             uid,
		Name:            name,
		Email:           email,
		CharactersOwned: []Character{},
	}, nil
}

func (s *Store) GetUserByID(ctx context.Context, uid string) (*User, error) {
	var user User
	var charactersOwned string

	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, email, COALESCE(characters_owned, '[]')
		FROM users
		WHERE id = ?
	`, uid).Scan(
		&user.UID,
		&user.Name,
		&user.Email,
		&charactersOwned,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	var ids []string
	if charactersOwned != "" {
		_ = json.Unmarshal([]byte(charactersOwned), &ids)
	}

	for _, id := range ids {
		char, err := s.GetCharacterByID(ctx, id)
		if err == nil {
			user.CharactersOwned = append(user.CharactersOwned, char)
		}
	}
	if user.CharactersOwned == nil {
		user.CharactersOwned = []Character{}
	}
	return &user, nil
}

// GetCharacterByID returns a single character with its equipment and stats
func (s *Store) GetCharacterByID(ctx context.Context, uid string) (Character, error) {
	if s.useSQLite {
		var char Character
		var partnerUID sql.NullString
		var partnerName sql.NullString
		var partnerImg sql.NullString

		err := s.db.QueryRowContext(ctx, `
			SELECT
				c.uid,
				c.id,
				c.name,
				c.tier,
				c.type,
				c.faction,
				c.rarity,
				c.attribute,
				c.image_url,

				p.uid,
				p.name,
				p.img
			FROM characters c
			LEFT JOIN partners p
				ON c.best_partner_uid = p.uid
			WHERE c.uid = ?
		`, uid).Scan(
			&char.UID,
			&char.ID,
			&char.Name,
			&char.Tier,
			&char.Type,
			&char.Faction,
			&char.Rarity,
			&char.Attribute,
			&char.ImageUrl,
			&partnerUID,
			&partnerName,
			&partnerImg,
		)
		if err != nil {
			return Character{}, err
		}

		if partnerUID.Valid && partnerUID.String != "" {
			char.BestPartner = &Partner{
				UID:  partnerUID.String,
				Name: partnerName.String,
				Img:  partnerImg.String,
			}
		}

		char.BestEquipment = []Equipment{}
		char.Stats = []Stat{}

		// Load equipment
		equipRows, err := s.db.QueryContext(ctx, `
			SELECT type, name, url, img
			FROM character_equipment
			WHERE character_uid = ?
		`, uid)
		if err != nil {
			return Character{}, err
		}
		defer equipRows.Close()

		for equipRows.Next() {
			var eq Equipment

			if err := equipRows.Scan(&eq.Type, &eq.Name, &eq.URL, &eq.Img); err != nil {
				return Character{}, err
			}

			char.BestEquipment = append(char.BestEquipment, eq)
		}

		if err = equipRows.Err(); err != nil {
			return Character{}, err
		}

		// Load stats
		statRows, err := s.db.QueryContext(ctx, `
			SELECT id, friendly_name, value
			FROM character_stats
			WHERE character_uid = ?
		`, uid)
		if err != nil {
			return Character{}, err
		}
		defer statRows.Close()

		for statRows.Next() {
			var stat Stat

			if err := statRows.Scan(&stat.ID, &stat.FriendlyName, &stat.Value); err != nil {
				return Character{}, err
			}

			char.Stats = append(char.Stats, stat)
		}

		if err = statRows.Err(); err != nil {
			return Character{}, err
		}

		return char, nil
	}

	return Character{}, nil
}

func (s *Store) UpdateCharacter(ctx context.Context, uid string, input UpdateCharacterInput) (Character, error) {
	if s.useSQLite {
		result, err := s.db.ExecContext(ctx, `
			UPDATE characters
			SET
				name = ?,
				tier = ?,
				type = ?,
				faction = ?,
				rarity = ?,
				attribute = ?,
				image_url = ?
			WHERE uid = ?
		`,
			input.Name,
			input.Tier,
			input.Type,
			input.Faction,
			input.Rarity,
			input.Attribute,
			input.ImageUrl,
			uid,
		)
		if err != nil {
			return Character{}, err
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return Character{}, err
		}
		if rowsAffected == 0 {
			return Character{}, sql.ErrNoRows
		}

		return s.GetCharacterByID(ctx, uid)
	}

	return Character{}, nil
}

func (s *Store) loadEquipment(ctx context.Context, uid string) ([]Equipment, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT type, name, url, img
		FROM character_equipment
		WHERE character_uid = ?
	`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var equipment []Equipment

	for rows.Next() {
		var eq Equipment
		if err := rows.Scan(&eq.Type, &eq.Name, &eq.URL, &eq.Img); err != nil {
			return nil, err
		}
		equipment = append(equipment, eq)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return equipment, nil
}

func (s *Store) loadStats(ctx context.Context, uid string) ([]Stat, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, friendly_name, value
		FROM character_stats
		WHERE character_uid = ?
	`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []Stat

	for rows.Next() {
		var st Stat
		if err := rows.Scan(&st.ID, &st.FriendlyName, &st.Value); err != nil {
			return nil, err
		}
		stats = append(stats, st)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return stats, nil
}

// ListCharacters pulls relational data using an optimized 2-query map stitch
func (s *Store) ListCharacters(ctx context.Context) ([]Character, error) {
	if s.useSQLite {
		// 1. Fetch all core characters and their flattened partner columns
		rows, err := s.db.QueryContext(ctx, `
			SELECT
				uid,
				id,
				name,
				tier,
				type,
				faction,
				rarity,
				attribute,
				image_url,
				best_partner_uid,
				best_partner_name
			FROM characters
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var characters []Character
		charMap := make(map[string]int)

		for rows.Next() {
			var char Character
			var partnerUID sql.NullString
			var partnerName sql.NullString

			err := rows.Scan(
				&char.UID,
				&char.ID,
				&char.Name,
				&char.Tier,
				&char.Type,
				&char.Faction,
				&char.Rarity,
				&char.Attribute,
				&char.ImageUrl,
				&partnerUID,
				&partnerName,
			)
			if err != nil {
				return nil, err
			}

			if partnerUID.Valid && partnerUID.String != "" {
				char.BestPartner = &Partner{
					UID:  partnerUID.String,
					Name: partnerName.String,
				}
			}

			characters = append(characters, char)
			charMap[char.UID] = len(characters) - 1

			eq, err := s.loadEquipment(ctx, char.UID)
			if err != nil {
				return nil, err
			}
			characters[charMap[char.UID]].BestEquipment = eq

			stats, err := s.loadStats(ctx, char.UID)
			if err != nil {
				return nil, err
			}
			characters[charMap[char.UID]].Stats = stats
		}
		if err = rows.Err(); err != nil {
			return nil, err
		}

		return characters, nil
	}

	return []Character{}, nil
}

func (s *Store) ListPartners(ctx context.Context) ([]Partner, error) {
	if s.useSQLite {
		rows, err := s.db.QueryContext(ctx, `
			SELECT
				uid,
				name,
				img,
				class,
				rarity,
				ep_cost,
				attack,
				defense,
				health,
				passive_name,
				passive_description,
				ego_skill_name,
				ego_skill_img,
				ego_skill_details,
				source_url
			FROM partners
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var partners []Partner

		for rows.Next() {
			var p Partner
			var egoName, egoImg, egoDetails string
			if err := rows.Scan(
				&p.UID,
				&p.Name,
				&p.Img,
				&p.Class,
				&p.Rarity,
				&p.EPCost,
				&p.Attack,
				&p.Defense,
				&p.Health,
				&p.PassiveName,
				&p.PassiveDescription,
				&egoName,
				&egoImg,
				&egoDetails,
				&p.SourceURL,
			); err != nil {
				return nil, err
			}

			p.EgoSkill = EgoSkill{
				Name:    egoName,
				Img:     egoImg,
				Details: egoDetails,
			}

			partners = append(partners, p)
		}

		if err = rows.Err(); err != nil {
			return nil, err
		}

		return partners, nil
	}

	return []Partner{}, nil
}

func (s *Store) AddCharacterToUser(ctx context.Context, userID string, characterID string) error {
	var existing string

	err := s.db.QueryRowContext(ctx, `
		SELECT characters_owned
		FROM users
		WHERE id = ?
	`, userID).Scan(&existing)

	if err != nil {
		return err
	}

	var ids []string
	if existing != "" {
		_ = json.Unmarshal([]byte(existing), &ids)
	}

	// prevent duplicates
	for _, id := range ids {
		if id == characterID {
			return nil
		}
	}

	ids = append(ids, characterID)

	updated, err := json.Marshal(ids)
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, `
		UPDATE users
		SET characters_owned = ?
		WHERE id = ?
	`, string(updated), userID)

	return err
}

func (s *Store) RemoveCharacterFromUser(ctx context.Context, userID string, characterID string) error {
	var existing string

	err := s.db.QueryRowContext(ctx, `
		SELECT COALESCE(characters_owned, '[]')
		FROM users
		WHERE id = ?
	`, userID).Scan(&existing)
	if err != nil {
		return err
	}

	var ids []string
	if existing != "" {
		_ = json.Unmarshal([]byte(existing), &ids)
	}

	filtered := make([]string, 0, len(ids))
	for _, id := range ids {
		if id != characterID {
			filtered = append(filtered, id)
		}
	}

	updated, err := json.Marshal(filtered)
	if err != nil {
		return err
	}

	_, err = s.db.ExecContext(ctx, `
		UPDATE users
		SET characters_owned = ?
		WHERE id = ?
	`, string(updated), userID)

	return err
}

func (s *Store) CreateTeam(ctx context.Context, input CreateTeamInput, createdBy string) (Team, error) {
	uid := uuid.NewString()

	characterIDs, err := json.Marshal(input.CharacterIDs)
	if err != nil {
		return Team{}, err
	}

	createdDate := time.Now().UTC().Format(time.RFC3339)
	decksIDs, _ := json.Marshal(input.DeckIDs)

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO teams (
			uid,
			name,
			character_ids,
			decks_ids,
			created_date,
			created_by
		)
		VALUES (?, ?, ?, ?, ?, ?)
	`,
		uid,
		input.Name,
		string(characterIDs),
		string(decksIDs),
		createdDate,
		createdBy,
	)
	if err != nil {
		return Team{}, err
	}
	characters := make([]Character, 0, len(input.CharacterIDs))

	for _, characterID := range input.CharacterIDs {
		character, err := s.GetCharacterByID(ctx, characterID)
		if err != nil {
			return Team{}, err
		}

		characters = append(characters, character)
	}

	return Team{
		UID:         uid,
		Name:        input.Name,
		Characters:  characters,
		Decks:       input.DeckIDs,
		CreatedDate: createdDate,
		CreatedBy:   createdBy,
	}, nil
}

func (s *Store) ListTeams(ctx context.Context) ([]Team, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			uid,
			name,
			character_ids,
			decks_ids,
			created_date,
			created_by
		FROM teams
		ORDER BY created_date DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []Team

	for rows.Next() {
		var team Team
		var characterIDsJSON string
		var decksIDsJSON string

		if err := rows.Scan(
			&team.UID,
			&team.Name,
			&characterIDsJSON,
			&decksIDsJSON,
			&team.CreatedDate,
			&team.CreatedBy,
		); err != nil {
			return nil, err
		}

		var characterIDs []string
		if characterIDsJSON != "" {
			_ = json.Unmarshal([]byte(characterIDsJSON), &characterIDs)
		}

		for _, characterID := range characterIDs {
			character, err := s.GetCharacterByID(ctx, characterID)
			if err != nil {
				return nil, err
			}

			team.Characters = append(team.Characters, character)
		}

		var deckIDs []string
		if decksIDsJSON != "" {
			_ = json.Unmarshal([]byte(decksIDsJSON), &deckIDs)
		}
		team.Decks = deckIDs

		teams = append(teams, team)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return teams, nil
}

func (s *Store) ListTeamsByUser(ctx context.Context, createdBy string) ([]Team, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			uid,
			name,
			character_ids,
			decks_ids,
			created_date,
			created_by
		FROM teams
		WHERE created_by = ?
		ORDER BY created_date DESC
	`, createdBy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var teams []Team

	for rows.Next() {
		var team Team
		var characterIDsJSON string
		var decksIDsJSON string

		if err := rows.Scan(
			&team.UID,
			&team.Name,
			&characterIDsJSON,
			&decksIDsJSON,
			&team.CreatedDate,
			&team.CreatedBy,
		); err != nil {
			return nil, err
		}

		var characterIDs []string
		if characterIDsJSON != "" {
			_ = json.Unmarshal([]byte(characterIDsJSON), &characterIDs)
		}

		for _, characterID := range characterIDs {
			character, err := s.GetCharacterByID(ctx, characterID)
			if err != nil {
				return nil, err
			}

			team.Characters = append(team.Characters, character)
		}

		var deckIDs []string
		if decksIDsJSON != "" {
			_ = json.Unmarshal([]byte(decksIDsJSON), &deckIDs)
		}
		team.Decks = deckIDs

		teams = append(teams, team)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if teams == nil {
		return []Team{}, nil
	}

	return teams, nil
}

func (s *Store) GetTeamByID(ctx context.Context, uid string) (Team, error) {
	var team Team
	var characterIDsJSON string
	var decksIDsJSON string

	err := s.db.QueryRowContext(ctx, `
		SELECT
			uid,
			name,
			character_ids,
			decks_ids,
			created_date,
			created_by
		FROM teams
		WHERE uid = ?
	`, uid).Scan(
		&team.UID,
		&team.Name,
		&characterIDsJSON,
		&decksIDsJSON,
		&team.CreatedDate,
		&team.CreatedBy,
	)
	if err != nil {
		return Team{}, err
	}

	var characterIDs []string
	if characterIDsJSON != "" {
		_ = json.Unmarshal([]byte(characterIDsJSON), &characterIDs)
	}

	for _, characterID := range characterIDs {
		character, err := s.GetCharacterByID(ctx, characterID)
		if err != nil {
			return Team{}, err
		}

		team.Characters = append(team.Characters, character)
	}

	var deckIDs []string
	if decksIDsJSON != "" {
		_ = json.Unmarshal([]byte(decksIDsJSON), &deckIDs)
	}
	team.Decks = deckIDs

	return team, nil
}

func (s *Store) DeleteTeam(ctx context.Context, uid string) error {
	_, err := s.db.ExecContext(ctx, `
		DELETE FROM teams
		WHERE uid = ?
	`, uid)

	return err
}

func (s *Store) CreateDeck(ctx context.Context, input CreateDeckInput, createdBy string) (Deck, error) {
	uid := uuid.NewString()

	cardIDs, err := json.Marshal(input.CardIDs)
	if err != nil {
		return Deck{}, err
	}

	createdDate := time.Now().UTC().Format(time.RFC3339)

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO decks (uid, name, character_uid, card_ids, created_by, created_date)
		VALUES (?, ?, ?, ?, ?, ?)
	`, uid, input.Name, input.CharacterUID, string(cardIDs), createdBy, createdDate)
	if err != nil {
		return Deck{}, err
	}

	return Deck{
		UID:          uid,
		Name:         input.Name,
		CharacterUID: input.CharacterUID,
		CardIDs:      input.CardIDs,
		CreatedBy:    createdBy,
		CreatedDate:  createdDate,
	}, nil
}

func (s *Store) DeleteDeck(ctx context.Context, uid string) error {
	_, err := s.db.ExecContext(ctx, `
		DELETE FROM decks
		WHERE uid = ?
	`, uid)
	return err
}

func (s *Store) ListDecksByUser(ctx context.Context, createdBy string) ([]Deck, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT uid, name, character_uid, card_ids, created_by, created_date
		FROM decks
		WHERE created_by = ?
		ORDER BY created_date DESC
	`, createdBy)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var decks []Deck

	for rows.Next() {
		var deck Deck
		var cardIDsJSON string

		if err := rows.Scan(
			&deck.UID,
			&deck.Name,
			&deck.CharacterUID,
			&cardIDsJSON,
			&deck.CreatedBy,
			&deck.CreatedDate,
		); err != nil {
			return nil, err
		}

		if cardIDsJSON != "" {
			_ = json.Unmarshal([]byte(cardIDsJSON), &deck.CardIDs)
		}

		decks = append(decks, deck)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return decks, nil
}

func (s *Store) ListDecks(ctx context.Context, limit, offset int) ([]Deck, int, error) {
	var total int
	err := s.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM decks`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.QueryContext(ctx, `
		SELECT uid, name, character_uid, card_ids, created_by, created_date
		FROM decks
		ORDER BY created_date DESC
		LIMIT ? OFFSET ?
	`, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var decks []Deck
	var allCardIDs []string

	for rows.Next() {
		var deck Deck
		var cardIDsJSON string

		if err := rows.Scan(
			&deck.UID,
			&deck.Name,
			&deck.CharacterUID,
			&cardIDsJSON,
			&deck.CreatedBy,
			&deck.CreatedDate,
		); err != nil {
			return nil, 0, err
		}

		if cardIDsJSON != "" {
			_ = json.Unmarshal([]byte(cardIDsJSON), &deck.CardIDs)
			allCardIDs = append(allCardIDs, deck.CardIDs...)
		}

		decks = append(decks, deck)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	// Hydrate cards
	if len(allCardIDs) > 0 {
		uniqueIDs := uniqueStrings(allCardIDs)
		cardMap, err := s.fetchCardsByUIDs(ctx, uniqueIDs)
		if err != nil {
			return nil, 0, err
		}

		for i, deck := range decks {
			for _, id := range deck.CardIDs {
				if card, ok := cardMap[id]; ok {
					decks[i].Cards = append(decks[i].Cards, card)
				}
			}
		}
	}

	return decks, total, nil
}

func uniqueStrings(slice []string) []string {
	seen := make(map[string]struct{}, len(slice))
	result := make([]string, 0, len(slice))
	for _, s := range slice {
		if _, ok := seen[s]; !ok {
			seen[s] = struct{}{}
			result = append(result, s)
		}
	}
	return result
}

func (s *Store) fetchCardsByUIDs(ctx context.Context, uids []string) (map[string]DeckCard, error) {
	if len(uids) == 0 {
		return nil, nil
	}

	placeholders := make([]string, len(uids))
	args := make([]interface{}, len(uids))
	for i, uid := range uids {
		placeholders[i] = "?"
		args[i] = uid
	}

	query := fmt.Sprintf(`
		SELECT uid, name, effect, type, ap_cost, user, sub_type, affinity, image_url, tags
		FROM cards
		WHERE uid IN (%s)
	`, strings.Join(placeholders, ","))

	rows, err := s.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cardMap := make(map[string]DeckCard)

	for rows.Next() {
		var raw Card
		if err := rows.Scan(
			&raw.UID, &raw.Name, &raw.Effect, &raw.Type,
			&raw.APCost, &raw.User, &raw.SubType, &raw.Affinity,
			&raw.ImageUrl, &raw.Tags,
		); err != nil {
			return nil, err
		}

		var effects []string
		if err := json.Unmarshal([]byte(raw.Effect), &effects); err != nil || len(effects) == 0 {
			effects = []string{}
			for _, s := range strings.Split(raw.Effect, "・") {
				s = strings.TrimSpace(s)
				if s != "" {
					effects = append(effects, s)
				}
			}
		}

		var parsedTags []CardTag
		_ = json.Unmarshal([]byte(raw.Tags), &parsedTags)

		cardMap[raw.UID] = DeckCard{
			UID:      raw.UID,
			Name:     raw.Name,
			Effect:   effects,
			Type:     raw.Type,
			APCost:   raw.APCost,
			User:     raw.User,
			SubType:  raw.SubType,
			Affinity: raw.Affinity,
			ImageUrl: raw.ImageUrl,
			Tags:     parsedTags,
		}
	}

	return cardMap, rows.Err()
}

func main() {
	dbPath := filepath.Join("data", "czn-tracker.db")
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatalf("failed to create data dir: %v", err)
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open sqlite database: %v", err)
	}
	defer db.Close()

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS decks (
			uid TEXT PRIMARY KEY NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			character_uid TEXT NOT NULL DEFAULT '',
			card_ids TEXT NOT NULL DEFAULT '[]',
			created_by TEXT NOT NULL DEFAULT '',
			created_date TEXT NOT NULL DEFAULT ''
		)
	`); err != nil {
		log.Fatalf("Failed to create decks table: %v", err)
	}

	store := &Store{
		useSQLite: true,
		db:        db,
	}

	cookieHashKey := envFirst("COOKIE_HASH_KEY", "SESSION_HASH_KEY")
	if cookieHashKey == "" {
		log.Fatal("COOKIE_HASH_KEY is required for auth sessions")
	}
	cookieCodec := securecookie.New([]byte(cookieHashKey), nil)

	// Initialize Gin router instance
	r := gin.Default()
	r.Use(corsMiddleware())
	wd, _ := os.Getwd()
	imageRoot := filepath.Join(wd, "data", "images")
	log.Println("WD:", wd)
	log.Println("IMAGE ROOT:", imageRoot)

	files, _ := os.ReadDir(imageRoot)
	for _, f := range files {
		log.Println("FOUND FILE:", f.Name())
	}
	characterImageDir := filepath.Join(imageRoot, "characters")

	if err := os.MkdirAll(characterImageDir, 0755); err != nil {
		log.Fatalf("failed to create image directory: %v", err)
	}

	r.Static("/images", imageRoot)

	// -------------------------
	// Serve frontend (production build)
	// -------------------------
	frontendDist := "./frontend/dist"

	r.Static("/assets", filepath.Join(frontendDist, "assets"))

	r.GET("/", func(c *gin.Context) {
		c.File(filepath.Join(frontendDist, "index.html"))
	})

	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path

		// don't override static assets
		if strings.HasPrefix(path, "/images/") {
			c.Status(404)
			return
		}

		c.File(filepath.Join(frontendDist, "index.html"))
	})

	api := r.Group("/api")

	api.POST("/auth/google/login", func(c *gin.Context) {
		clientID := envFirst("GOOGLE_CLIENT_ID", "VITE_GOOGLE_CLIENT_ID")
		if clientID == "" {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing google client id"})
			return
		}

		credential := c.PostForm("credential")
		if credential == "" {
			var body struct {
				Credential string `json:"credential"`
			}
			if err := c.ShouldBindJSON(&body); err == nil {
				credential = body.Credential
			}
		}
		if credential == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "missing google credential"})
			return
		}

		payload, err := idtoken.Validate(c.Request.Context(), credential, clientID)
		if err != nil {
			log.Printf("Error validating google credential: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid google credential"})
			return
		}

		email, _ := payload.Claims["email"].(string)
		name, _ := payload.Claims["name"].(string)
		if email == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "google credential did not include an email"})
			return
		}
		if name == "" {
			name = email
		}

		user, err := store.GetUserByEmail(c.Request.Context(), email)
		if err != nil {
			log.Printf("Error retrieving user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
			return
		}

		if user == nil {
			user, err = store.CreateUser(c.Request.Context(), name, email)
			if err != nil {
				log.Printf("Error creating user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
				return
			}
		}

		sessionValue, err := cookieCodec.Encode(sessionCookieName, Session{
			UID:   user.UID,
			Email: email,
			Name:  name,
		})
		if err != nil {
			log.Printf("Error encoding session cookie: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create session"})
			return
		}

		http.SetCookie(c.Writer, &http.Cookie{
			Name:     sessionCookieName,
			Value:    sessionValue,
			Path:     "/",
			MaxAge:   int((7 * 24 * time.Hour).Seconds()),
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	api.GET("/me", func(c *gin.Context) {
		sessionUser, ok := currentUser(c.Request, cookieCodec)
		if !ok {
			c.JSON(http.StatusOK, gin.H{"user": nil})
			return
		}

		user, err := store.GetUserByID(c.Request.Context(), sessionUser.UID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	api.GET("/users/:id", func(c *gin.Context) {
		id := c.Param("id")

		user, err := store.GetUserByID(c.Request.Context(), id)
		if err != nil {
			log.Printf("Error retrieving user by id: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to retrieve user"})
			return
		}

		if user == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	api.POST("/users/:id/characters/:characterId", func(c *gin.Context) {
		userID := c.Param("id")
		characterID := c.Param("characterId")

		err := store.AddCharacterToUser(c.Request.Context(), userID, characterID)
		if err != nil {
			log.Printf("Error updating user characters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}

		user, err := store.GetUserByID(c.Request.Context(), userID)
		if err != nil {
			log.Printf("Error fetching updated user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	api.DELETE("/users/:id/characters/:characterId", func(c *gin.Context) {
		userID := c.Param("id")
		characterID := c.Param("characterId")

		err := store.RemoveCharacterFromUser(c.Request.Context(), userID, characterID)
		if err != nil {
			log.Printf("Error removing user character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
			return
		}

		user, err := store.GetUserByID(c.Request.Context(), userID)
		if err != nil {
			log.Printf("Error fetching updated user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"user": user})
	})

	logoutHandler := func(c *gin.Context) {
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     sessionCookieName,
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}

	api.POST("/auth/logout", logoutHandler)
	api.GET("/auth/logout", logoutHandler)

	// Register the GET endpoint group endpoint
	api.GET("/characters", func(c *gin.Context) {
		characters, err := store.ListCharacters(c.Request.Context())
		if err != nil {
			log.Printf("Error pulling characters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load characters"})
			return
		}

		c.JSON(http.StatusOK, characters)
	})

	api.GET("/characters/:id", func(c *gin.Context) {
		id := c.Param("id")

		character, err := store.GetCharacterByID(c.Request.Context(), id)
		if err != nil {
			log.Printf("Error pulling character by id: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load character"})
			return
		}

		c.JSON(http.StatusOK, character)
	})

	api.PUT("/characters/:id", func(c *gin.Context) {
		id := c.Param("id")

		var input UpdateCharacterInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid character payload"})
			return
		}

		character, err := store.UpdateCharacter(c.Request.Context(), id, input)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "character not found"})
			return
		}
		if err != nil {
			log.Printf("Error updating character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update character"})
			return
		}

		c.JSON(http.StatusOK, character)
	})

	api.POST("/characters/:id/edit", func(c *gin.Context) {
		id := c.Param("id")
		input := UpdateCharacterInput{
			Name:      c.PostForm("name"),
			Tier:      c.PostForm("tier"),
			Type:      c.PostForm("type"),
			Faction:   c.PostForm("faction"),
			Rarity:    c.PostForm("rarity"),
			Attribute: c.PostForm("attribute"),
			ImageUrl:  c.PostForm("imageUrl"),
		}

		file, err := c.FormFile("image")
		if err == nil {
			imageURL, err := saveCharacterImage(c, file, input.Name)
			if err != nil {
				log.Printf("Error saving character image: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "failed to save character image"})
				return
			}
			input.ImageUrl = imageURL
		} else if !errors.Is(err, http.ErrMissingFile) {
			log.Printf("Error reading character image upload: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid character image upload"})
			return
		}

		character, err := store.UpdateCharacter(c.Request.Context(), id, input)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "character not found"})
			return
		}
		if err != nil {
			log.Printf("Error updating character: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update character"})
			return
		}

		c.JSON(http.StatusOK, character)
	})

	api.GET("/partners", func(c *gin.Context) {
		partners, err := store.ListPartners(c.Request.Context())
		if err != nil {
			log.Printf("Error pulling partners: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load partners"})
			return
		}

		c.JSON(http.StatusOK, partners)
	})

	api.GET("/cards", func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "20")
		pageStr := c.DefaultQuery("page", "1")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 100 {
			limit = 20
		}

		page, err := strconv.Atoi(pageStr)
		if err != nil || page <= 0 {
			page = 1
		}

		offset := (page - 1) * limit

		rows, err := store.db.QueryContext(c.Request.Context(), `
			SELECT
				uid,
				name,
				effect,
				type,
				ap_cost,
				user,
				sub_type,
				affinity,
				image_url,
				tags
			FROM cards
			ORDER BY rowid DESC
			LIMIT ? OFFSET ?
		`, limit, offset)

		if err != nil {
			log.Printf("Error loading cards: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load cards"})
			return
		}
		defer rows.Close()

		type CardResponse struct {
			UID      string    `json:"uid"`
			Name     string    `json:"name"`
			Effect   []string  `json:"effect"`
			Type     string    `json:"type"`
			APCost   string    `json:"apCost"`
			User     string    `json:"user"`
			SubType  string    `json:"subType"`
			Affinity string    `json:"affinity"`
			ImageUrl string    `json:"imageUrl"`
			Tags     []CardTag `json:"tags"`
		}

		var cards []CardResponse

		for rows.Next() {
			var ccard Card
			var parsedTags []CardTag

			if err := rows.Scan(
				&ccard.UID,
				&ccard.Name,
				&ccard.Effect,
				&ccard.Type,
				&ccard.APCost,
				&ccard.User,
				&ccard.SubType,
				&ccard.Affinity,
				&ccard.ImageUrl,
				&ccard.Tags,
			); err != nil {
				log.Printf("Error scanning card: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse cards"})
				return
			}

			// Parse effect into array (supports JSON array string or delimiter format)
			var effects []string
			// Try JSON array first
			if err := json.Unmarshal([]byte(ccard.Effect), &effects); err != nil || len(effects) == 0 {
				effects = []string{}
				for _, s := range strings.Split(ccard.Effect, "・") {
					s = strings.TrimSpace(s)
					if s != "" {
						effects = append(effects, s)
					}
				}
			}

			_ = json.Unmarshal([]byte(ccard.Tags), &parsedTags)

			cards = append(cards, CardResponse{
				UID:      ccard.UID,
				Name:     ccard.Name,
				Effect:   effects,
				Type:     ccard.Type,
				APCost:   ccard.APCost,
				User:     ccard.User,
				SubType:  ccard.SubType,
				Affinity: ccard.Affinity,
				ImageUrl: ccard.ImageUrl,
				Tags:     parsedTags,
			})
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "row iteration error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"cards": cards,
			"page":  page,
			"limit": limit,
		})
	})

	api.GET("/cards/character/:id", func(c *gin.Context) {
		characterID := c.Param("id")

		limitStr := c.DefaultQuery("limit", "20")
		pageStr := c.DefaultQuery("page", "1")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 100 {
			limit = 20
		}

		page, err := strconv.Atoi(pageStr)
		if err != nil || page <= 0 {
			page = 1
		}

		offset := (page - 1) * limit

		rows, err := store.db.QueryContext(c.Request.Context(), `
			SELECT
				uid,
				name,
				effect,
				type,
				ap_cost,
				user,
				sub_type,
				affinity,
				image_url,
				tags
			FROM cards
			WHERE (LOWER(user) = LOWER(?) OR user IS NULL OR user = '')
			  AND type != "Status Ailment"
			ORDER BY rowid DESC
			LIMIT ? OFFSET ?
		`, characterID, limit, offset)

		if err != nil {
			log.Printf("Error loading character cards: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load cards"})
			return
		}
		defer rows.Close()

		type CardResponse struct {
			UID      string    `json:"uid"`
			Name     string    `json:"name"`
			Effect   []string  `json:"effect"`
			Type     string    `json:"type"`
			APCost   string    `json:"apCost"`
			User     string    `json:"user"`
			SubType  string    `json:"subType"`
			Affinity string    `json:"affinity"`
			ImageUrl string    `json:"imageUrl"`
			Tags     []CardTag `json:"tags"`
		}

		var cards []CardResponse

		for rows.Next() {
			var ccard Card
			var parsedTags []CardTag

			if err := rows.Scan(
				&ccard.UID,
				&ccard.Name,
				&ccard.Effect,
				&ccard.Type,
				&ccard.APCost,
				&ccard.User,
				&ccard.SubType,
				&ccard.Affinity,
				&ccard.ImageUrl,
				&ccard.Tags,
			); err != nil {
				log.Printf("Error scanning card: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse cards"})
				return
			}

			// Parse effect into array (supports JSON array string or delimiter format)
			var effects []string
			// Try JSON array first
			if err := json.Unmarshal([]byte(ccard.Effect), &effects); err != nil || len(effects) == 0 {
				effects = []string{}
				for _, s := range strings.Split(ccard.Effect, "・") {
					s = strings.TrimSpace(s)
					if s != "" {
						effects = append(effects, s)
					}
				}
			}

			_ = json.Unmarshal([]byte(ccard.Tags), &parsedTags)

			cards = append(cards, CardResponse{
				UID:      ccard.UID,
				Name:     ccard.Name,
				Effect:   effects,
				Type:     ccard.Type,
				APCost:   ccard.APCost,
				User:     ccard.User,
				SubType:  ccard.SubType,
				Affinity: ccard.Affinity,
				ImageUrl: ccard.ImageUrl,
				Tags:     parsedTags,
			})
		}

		if err = rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "row iteration error"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"cards": cards,
			"page":  page,
			"limit": limit,
		})
	})

	api.GET("/teams", func(c *gin.Context) {
		createdBy := c.Query("createdBy")

		var teams []Team
		var err error

		if createdBy != "" {
			teams, err = store.ListTeamsByUser(c.Request.Context(), createdBy)
		} else {
			teams, err = store.ListTeams(c.Request.Context())
		}

		if err != nil {
			log.Printf("Error loading teams: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to load teams",
			})
			return
		}

		c.JSON(http.StatusOK, teams)
	})

	api.GET("/teams/:id", func(c *gin.Context) {
		id := c.Param("id")

		team, err := store.GetTeamByID(c.Request.Context(), id)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{
				"error": "team not found",
			})
			return
		}
		if err != nil {
			log.Printf("Error loading team: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to load team",
			})
			return
		}

		c.JSON(http.StatusOK, team)
	})

	api.POST("/teams", func(c *gin.Context) {
		sessionUser, ok := currentUser(c.Request, cookieCodec)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		var input CreateTeamInput

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team payload"})
			return
		}

		if len(input.CharacterIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "team must contain at least one character",
			})
			return
		}

		if len(input.CharacterIDs) > 3 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "team cannot contain more than 3 characters",
			})
			return
		}

		team, err := store.CreateTeam(c.Request.Context(), input, sessionUser.UID)
		if err != nil {
			log.Printf("Error creating team: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create team",
			})
			return
		}

		c.JSON(http.StatusCreated, team)
	})

	api.PUT("/teams/:id", func(c *gin.Context) {
		id := c.Param("id")

		var input UpdateTeamInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team payload"})
			return
		}

		var existingName string
		var existingCharactersJSON string
		var existingDecksJSON string

		err := store.db.QueryRowContext(c.Request.Context(), `
			SELECT name, character_ids, decks_ids
			FROM teams
			WHERE uid = ?
		`, id).Scan(&existingName, &existingCharactersJSON, &existingDecksJSON)

		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "team not found"})
			return
		}
		if err != nil {
			log.Printf("Error fetching team for update: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load team"})
			return
		}

		var existingIDs []string
		if existingCharactersJSON != "" {
			_ = json.Unmarshal([]byte(existingCharactersJSON), &existingIDs)
		}

		var existingDecks []string
		if existingDecksJSON != "" {
			_ = json.Unmarshal([]byte(existingDecksJSON), &existingDecks)
		}

		newName := existingName
		if input.Name != "" {
			newName = input.Name
		}

		newIDs := existingIDs
		if input.CharacterIDs != nil {
			newIDs = input.CharacterIDs
		}

		newDecks := existingDecks
		if input.DeckIDs != nil {
			newDecks = input.DeckIDs
		}

		if len(newIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "team must contain at least one character"})
			return
		}
		if len(newIDs) > 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "team cannot contain more than 3 characters"})
			return
		}

		updatedJSON, err := json.Marshal(newIDs)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to encode team"})
			return
		}

		updatedDecksJSON, _ := json.Marshal(newDecks)

		_, err = store.db.ExecContext(c.Request.Context(), `
			UPDATE teams
			SET name = ?, character_ids = ?, decks_ids = ?
			WHERE uid = ?
		`, newName, string(updatedJSON), string(updatedDecksJSON), id)

		if err != nil {
			log.Printf("Error updating team: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update team"})
			return
		}

		// rebuild response team
		characters := make([]Character, 0, len(newIDs))
		for _, characterID := range newIDs {
			character, err := store.GetCharacterByID(c.Request.Context(), characterID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load team characters"})
				return
			}
			characters = append(characters, character)
		}

		c.JSON(http.StatusOK, Team{
			UID:         id,
			Name:        newName,
			Characters:  characters,
			Decks:       newDecks,
			CreatedDate: "",
		})
	})

	api.DELETE("/teams/:id", func(c *gin.Context) {
		id := c.Param("id")

		err := store.DeleteTeam(c.Request.Context(), id)
		if err != nil {
			log.Printf("Error deleting team: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to delete team",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
		})
	})

	api.POST("/decks", func(c *gin.Context) {
		sessionUser, ok := currentUser(c.Request, cookieCodec)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		var input CreateDeckInput

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid deck payload"})
			return
		}

		if input.Name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "deck name is required"})
			return
		}

		if input.CharacterUID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "character uid is required"})
			return
		}

		if len(input.CardIDs) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "deck must contain at least one card"})
			return
		}

		deck, err := store.CreateDeck(c.Request.Context(), input, sessionUser.UID)
		if err != nil {
			log.Printf("Error creating deck: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create deck"})
			return
		}

		c.JSON(http.StatusCreated, deck)
	})

	api.GET("/decks/mine", func(c *gin.Context) {
		sessionUser, ok := currentUser(c.Request, cookieCodec)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
			return
		}

		decks, err := store.ListDecksByUser(c.Request.Context(), sessionUser.UID)
		if err != nil {
			log.Printf("Error loading user decks: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load decks"})
			return
		}

		c.JSON(http.StatusOK, decks)
	})

	api.GET("/decks", func(c *gin.Context) {
		limitStr := c.DefaultQuery("limit", "20")
		pageStr := c.DefaultQuery("page", "1")

		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit <= 0 || limit > 100 {
			limit = 20
		}

		page, err := strconv.Atoi(pageStr)
		if err != nil || page <= 0 {
			page = 1
		}

		offset := (page - 1) * limit

		decks, total, err := store.ListDecks(c.Request.Context(), limit, offset)
		if err != nil {
			log.Printf("Error loading decks: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load decks"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"decks": decks,
			"page":  page,
			"limit": limit,
			"total": total,
		})
	})

	api.DELETE("/decks/:id", func(c *gin.Context) {
		id := c.Param("id")

		err := store.DeleteDeck(c.Request.Context(), id)
		if err != nil {
			log.Printf("Error deleting deck: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to delete deck",
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port

	log.Printf("Gin server starting up on %s...", addr)

	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to run gin router: %v", err)
	}
}

func currentUser(r *http.Request, cookieCodec *securecookie.SecureCookie) (User, bool) {
	cookie, err := r.Cookie(sessionCookieName)
	if err != nil {
		return User{}, false
	}

	var session Session
	if err := cookieCodec.Decode(sessionCookieName, cookie.Value, &session); err != nil {
		return User{}, false
	}

	if session.Email == "" {
		return User{}, false
	}

	u := User{
		UID:             session.UID,
		Email:           session.Email,
		Name:            session.Name,
		CharactersOwned: []Character{},
	}

	return u, true
}

func saveCharacterImage(c *gin.Context, file *multipart.FileHeader, characterName string) (string, error) {
	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExtensions := map[string]bool{
		".gif":  true,
		".jpeg": true,
		".jpg":  true,
		".png":  true,
		".webp": true,
	}
	if !allowedExtensions[ext] {
		return "", errors.New("unsupported image extension")
	}

	uploadDir := filepath.Join("data", "images", "characters")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", err
	}

	safeName := strings.TrimSpace(strings.ToLower(characterName))
	safeName = strings.ReplaceAll(safeName, " ", "-")
	if safeName == "" {
		safeName = uuid.NewString()
	}

	filename := safeName + ext
	destination := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(file, destination); err != nil {
		return "", err
	}

	return characterImageURLPrefix + "/" + filename, nil
}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigins := map[string]bool{
		"http://localhost:5173": true,
		"http://localhost:8080": true,
	}
	if frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/"); frontendURL != "" {
		allowedOrigins[frontendURL] = true
	}

	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
			c.Header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		}

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func envFirst(keys ...string) string {
	for _, key := range keys {
		if value := os.Getenv(key); value != "" {
			return value
		}
	}

	return ""
}
