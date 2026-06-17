package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

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

type Store struct {
	useSQLite bool
	db        *sql.DB
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

	// Initialize Gin router instance
	r := gin.Default()

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

	r.GET("/partners", func(c *gin.Context) {
		partners, err := store.ListPartners(c.Request.Context())
		if err != nil {
			log.Printf("Error pulling partners: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load partners"})
			return
		}

		c.JSON(http.StatusOK, partners)
	})

	log.Println("Gin server starting up on port :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to run gin router: %v", err)
	}
}
