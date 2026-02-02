package migration

import (
	"context"
	"encoding/base64"
	"encoding/csv"
	"fmt"
	"io"
	"networking-main/internal/models"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type CSVSource struct {
	db *gorm.DB
}

func NewCSVSource(db *gorm.DB) *CSVSource {
	return &CSVSource{db: db}
}

func (c *CSVSource) GetName() string {
	return "csv"
}

func (c *CSVSource) Migrate(ctx context.Context, job *JobStatus, config map[string]interface{}) error {
	dataEncoded, ok := config["data"].(string)
	if !ok {
		return fmt.Errorf("missing base64 data in config")
	}

	resource, _ := config["resource"].(string)
	if resource == "" {
		resource = "users" // Default
	}

	data, err := base64.StdEncoding.DecodeString(dataEncoded)
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}

	reader := csv.NewReader(strings.NewReader(string(data)))
	header, err := reader.Read()
	if err != nil {
		return fmt.Errorf("failed to read csv header: %w", err)
	}

	// Simple header map for dynamic parsing
	fieldMap := make(map[string]int)
	for i, h := range header {
		fieldMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	var records [][]string
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			job.LogError(fmt.Sprintf("Corrupt record: %v", err))
			continue
		}
		records = append(records, record)
	}

	job.Total = len(records)
	success := 0
	failure := 0

	for i, record := range records {
		var err error
		switch resource {
		case "users":
			err = c.migrateUser(record, fieldMap)
		case "devices":
			err = c.migrateDevice(record, fieldMap)
		default:
			err = fmt.Errorf("unknown resource type: %s", resource)
		}

		if err != nil {
			failure++
			job.LogError(fmt.Sprintf("Row %d: %v", i+2, err))
		} else {
			success++
		}

		job.UpdateProgress(((i+1)*100)/job.Total, success, failure)
	}

	return nil
}

func (c *CSVSource) migrateUser(record []string, fieldMap map[string]int) error {
	usernameIdx, ok := fieldMap["username"]
	if !ok || usernameIdx >= len(record) {
		return fmt.Errorf("missing username field")
	}
	emailIdx, ok := fieldMap["email"]
	if !ok || emailIdx >= len(record) {
		return fmt.Errorf("missing email field")
	}
	passwordIdx, ok := fieldMap["password"]
	if !ok || passwordIdx >= len(record) {
		return fmt.Errorf("missing password field")
	}
	roleIdx := fieldMap["role"] // optional

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(record[passwordIdx]), bcrypt.DefaultCost)

	role := "viewer"
	if roleIdx < len(record) && record[roleIdx] != "" {
		role = record[roleIdx]
	}

	user := models.User{
		Username: record[usernameIdx],
		Email:    record[emailIdx],
		Password: string(hashedPassword),
		Role:     role,
	}

	return c.db.Create(&user).Error
}

func (c *CSVSource) migrateDevice(record []string, fieldMap map[string]int) error {
	ipIdx, ok := fieldMap["ip_address"]
	if !ok || ipIdx >= len(record) {
		return fmt.Errorf("missing ip_address field")
	}
	hostnameIdx, ok := fieldMap["hostname"]
	if !ok || hostnameIdx >= len(record) {
		return fmt.Errorf("missing hostname field")
	}
	vendorIdx := fieldMap["vendor"]
	typeIdx := fieldMap["device_type"]

	device := models.Device{
		IPAddress: record[ipIdx],
		Hostname:  record[hostnameIdx],
		Status:    "unknown",
	}

	if vendorIdx < len(record) {
		device.Vendor = record[vendorIdx]
	}
	if typeIdx < len(record) {
		device.DeviceType = record[typeIdx]
	}

	return c.db.Create(&device).Error
}
