package main

import (
	"database/sql"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

type Partner struct {
	UID  string `json:"uid"`
	Name string `json:"name"`
}

type Equipment struct {
	Type string `json:"type"`
	Name string `json:"name"`
	URL  string `json:"url"`
	Img  string `json:"img"`
}

type Character struct {
	UID           string      `json:"uid"`
	ID            string      `json:"id"`
	Name          string      `json:"name"`
	BestPartner   *Partner    `json:"bestPartner,omitempty"`
	BestEquipment []Equipment `json:"bestEquipment"`
}

type Store struct {
	useSQLite bool
	db        *sql.DB
}

// ListCharacters pulls relational data using an optimized 2-query map stitch
func (s *Store) ListCharacters() ([]Character, error) {
	if s.useSQLite {
		// 1. Fetch all core characters and their flattened partner columns
		rows, err := s.db.Query(`
			SELECT 
				uid, id, name, best_partner_uid, best_partner_name 
			FROM characters
		`)
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		var characters []Character
		charMap := make(map[string]*Character)

		for rows.Next() {
			var char Character
			var partnerUID sql.NullString
			var partnerName sql.NullString

			err := rows.Scan(
				&char.UID,
				&char.ID,
				&char.Name,
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

			// Force initialized slice instance over 'null' inside JSON output arrays
			char.BestEquipment = []Equipment{}
			characters = append(characters, char)

			// Hold item reference memory address
			charMap[char.UID] = &characters[len(characters)-1]
		}
		if err = rows.Err(); err != nil {
			return nil, err
		}

		// 2. Query all equipment metrics in a bulk sweep
		equipRows, err := s.db.Query(`
			SELECT 
				character_uid, type, name, url, img 
			FROM character_equipment
		`)
		if err != nil {
			return nil, err
		}
		defer equipRows.Close()

		for equipRows.Next() {
			var charUID string
			var eq Equipment

			err := equipRows.Scan(&charUID, &eq.Type, &eq.Name, &eq.URL, &eq.Img)
			if err != nil {
				return nil, err
			}

			if char, exists := charMap[charUID]; exists {
				char.BestEquipment = append(char.BestEquipment, eq)
			}
		}
		if err = equipRows.Err(); err != nil {
			return nil, err
		}

		return characters, nil
	}

	return []Character{}, nil
}

func main() {
	dbPath := filepath.Clean("./game_data.db")

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
		characters, err := store.ListCharacters()
		if err != nil {
			log.Printf("Error pulling characters: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load characters"})
			return
		}

		c.JSON(http.StatusOK, characters)
	})

	log.Println("Gin server starting up on port :8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to run gin router: %v", err)
	}
}
