package billing

import (
	"context"
	"fmt"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type Service struct {
	db *gorm.DB
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

// GenerateInvoice creates a new invoice for a user and package
func (s *Service) GenerateInvoice(ctx context.Context, userID uint, packageID uint) (*models.Invoice, error) {
	var user models.HotspotUser
	if err := s.db.WithContext(ctx).First(&user, userID).Error; err != nil {
		return nil, err
	}

	var pkg models.PricingPackage
	if err := s.db.WithContext(ctx).First(&pkg, packageID).Error; err != nil {
		return nil, err
	}

	// Calculate Tax
	var taxes []models.TaxConfig
	s.db.WithContext(ctx).Where("is_active = ?", true).Find(&taxes)

	totalTax := 0.0
	for _, tax := range taxes {
		totalTax += (pkg.Price * tax.Rate / 100.0)
	}

	invoice := &models.Invoice{
		UserID:  userID,
		Number:  fmt.Sprintf("INV-%d-%04d", time.Now().Year(), time.Now().Unix()%10000),
		Amount:  pkg.Price,
		Tax:     totalTax,
		Total:   pkg.Price + totalTax,
		Status:  "unpaid",
		DueDate: time.Now().AddDate(0, 0, 7), // 7 days due date
	}

	if err := s.db.WithContext(ctx).Create(invoice).Error; err != nil {
		return nil, err
	}

	return invoice, nil
}

// MarkAsPaid updates invoice status and payment date
func (s *Service) MarkAsPaid(ctx context.Context, invoiceID uint, userID uint) error {
	now := time.Now()
	result := s.db.WithContext(ctx).Model(&models.Invoice{}).Where("id = ? AND user_id = ?", invoiceID, userID).Updates(map[string]interface{}{
		"status":  "paid",
		"paid_at": &now,
	})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("invoice not found or unauthorized")
	}
	return nil
}

// GetUserInvoices returns all invoices for a user
func (s *Service) GetUserInvoices(ctx context.Context, userID uint) ([]models.Invoice, error) {
	var invoices []models.Invoice
	err := s.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at desc").Find(&invoices).Error
	return invoices, err
}
