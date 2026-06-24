package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
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
	CreatedDate string      `json:"createdDate"`
}

type CreateTeamInput struct {
	Name         string   `json:"name"`
	CharacterIDs []string `json:"characterIds"`
}

type UpdateTeamInput struct {
	Name         string   `json:"name"`
	CharacterIDs []string `json:"characterIds"`
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

func (s *Store) CreateTeam(ctx context.Context, input CreateTeamInput) (Team, error) {
	uid := uuid.NewString()

	characterIDs, err := json.Marshal(input.CharacterIDs)
	if err != nil {
		return Team{}, err
	}

	createdDate := time.Now().UTC().Format(time.RFC3339)

	_, err = s.db.ExecContext(ctx, `
		INSERT INTO teams (
			uid,
			name,
			character_ids,
			created_date
		)
		VALUES (?, ?, ?, ?)
	`, uid, input.Name, string(characterIDs), createdDate)
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
		CreatedDate: createdDate,
	}, nil
}

func (s *Store) ListTeams(ctx context.Context) ([]Team, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT
			uid,
			name,
			character_ids,
			created_date
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

		if err := rows.Scan(
			&team.UID,
			&team.Name,
			&characterIDsJSON,
			&team.CreatedDate,
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

		teams = append(teams, team)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return teams, nil
}

func (s *Store) DeleteTeam(ctx context.Context, uid string) error {
	_, err := s.db.ExecContext(ctx, `
		DELETE FROM teams
		WHERE uid = ?
	`, uid)

	return err
}

func main() {
	dbPath := filepath.Clean("../data/czn-tracker.db")

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("Failed to open sqlite database: %v", err)
	}
	defer db.Close()

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
	characterImageDir := characterImageUploadDir()
	if err := os.MkdirAll(characterImageDir, 0755); err != nil {
		log.Printf("Error creating character image directory: %v", err)
	} else {
		r.Static("/images", filepath.Dir(characterImageDir))
	}

	r.POST("/auth/google/login", func(c *gin.Context) {
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

	r.GET("/me", func(c *gin.Context) {
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

	r.GET("/users/:id", func(c *gin.Context) {
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

	r.POST("/users/:id/characters/:characterId", func(c *gin.Context) {
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

	r.DELETE("/users/:id/characters/:characterId", func(c *gin.Context) {
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

	r.POST("/auth/logout", logoutHandler)
	r.GET("/auth/logout", logoutHandler)

	// Register the GET endpoint group endpoint
	r.GET("/characters", func(c *gin.Context) {
		characters, err := store.ListCharacters(c.Request.Context())
		if err != nil {
			log.Printf("Error pulling characters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load characters"})
			return
		}

		c.JSON(http.StatusOK, characters)
	})

	r.GET("/characters/:id", func(c *gin.Context) {
		id := c.Param("id")

		character, err := store.GetCharacterByID(c.Request.Context(), id)
		if err != nil {
			log.Printf("Error pulling character by id: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load character"})
			return
		}

		c.JSON(http.StatusOK, character)
	})

	r.PUT("/characters/:id", func(c *gin.Context) {
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

	r.POST("/characters/:id/edit", func(c *gin.Context) {
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

	r.GET("/partners", func(c *gin.Context) {
		partners, err := store.ListPartners(c.Request.Context())
		if err != nil {
			log.Printf("Error pulling partners: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load partners"})
			return
		}

		c.JSON(http.StatusOK, partners)
	})

	r.GET("/teams", func(c *gin.Context) {
		teams, err := store.ListTeams(c.Request.Context())
		if err != nil {
			log.Printf("Error loading teams: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to load teams",
			})
			return
		}

		c.JSON(http.StatusOK, teams)
	})

	r.POST("/teams", func(c *gin.Context) {
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

		team, err := store.CreateTeam(c.Request.Context(), input)
		if err != nil {
			log.Printf("Error creating team: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "failed to create team",
			})
			return
		}

		c.JSON(http.StatusCreated, team)
	})

	r.PUT("/teams/:id", func(c *gin.Context) {
		id := c.Param("id")

		var input UpdateTeamInput
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team payload"})
			return
		}

		var existingName string
		var existingJSON string

		err := store.db.QueryRowContext(c.Request.Context(), `
			SELECT name, character_ids
			FROM teams
			WHERE uid = ?
		`, id).Scan(&existingName, &existingJSON)

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
		if existingJSON != "" {
			_ = json.Unmarshal([]byte(existingJSON), &existingIDs)
		}

		newName := existingName
		if input.Name != "" {
			newName = input.Name
		}

		newIDs := existingIDs
		if input.CharacterIDs != nil {
			newIDs = input.CharacterIDs
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

		_, err = store.db.ExecContext(c.Request.Context(), `
			UPDATE teams
			SET name = ?, character_ids = ?
			WHERE uid = ?
		`, newName, string(updatedJSON), id)

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
			CreatedDate: "",
		})
	})

	r.DELETE("/teams/:id", func(c *gin.Context) {
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

	uploadDir := characterImageUploadDir()
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

func characterImageUploadDir() string {
	if imageDir := os.Getenv("CHARACTER_IMAGE_DIR"); imageDir != "" {
		return imageDir
	}

	candidates := []string{
		filepath.Join("public", "images", "characters"),
		filepath.Join("frontend", "public", "images", "characters"),
		filepath.Join("..", "frontend", "public", "images", "characters"),
	}

	for _, candidate := range candidates {
		parent := filepath.Dir(candidate)
		if _, err := os.Stat(parent); err == nil {
			return candidate
		}
	}

	return filepath.Join("frontend", "public", "images", "characters")
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
