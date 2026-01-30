package finance

import (
	"context"
	"fmt"
	"networking-main/internal/models"
	"time"

	"gorm.io/gorm"
)

type FinancialOverview struct {
	TotalRevenue      float64 `json:"total_revenue"`
	MRR               float64 `json:"mrr"`              // Monthly Recurring Revenue
	MarketplaceGTV    float64 `json:"marketplace_gtv"`  // Gross Transaction Volume
	WalletLiquidity   float64 `json:"wallet_liquidity"` // Total cash in wallets
	ActiveSubscribers int     `json:"active_subscribers"`
	AverageRevenue    float64 `json:"arpu"` // Average Revenue Per User
}

type RevenuePoint struct {
	Date   string  `json:"date"`
	Amount float64 `json:"amount"`
}

type Service struct {
	db *gorm.DB
}

type SellerStats struct {
	TotalSales     int64           `json:"total_sales"`
	ActiveProducts int64           `json:"active_products"`
	Rating         float64         `json:"rating"`
	Revenue        float64         `json:"revenue"`
	IsVerified     bool            `json:"is_verified"`
	Products       []models.Module `json:"products"`
}

func NewService(db *gorm.DB) *Service {
	return &Service{db: db}
}

func (s *Service) GetOverview(ctx context.Context) (*FinancialOverview, error) {
	overview := &FinancialOverview{}

	// 1. Calculate Total Revenue from Payments
	var totalRevenue float64
	s.db.Model(&models.Payment{}).Where("status = ?", "completed").Select("SUM(amount)").Scan(&totalRevenue)
	overview.TotalRevenue = totalRevenue

	// 2. Calculate Wallet Liquidity
	var totalLiquidity float64
	s.db.Table("wallets").Select("SUM(balance)").Scan(&totalLiquidity)
	overview.WalletLiquidity = totalLiquidity

	// 3. Calculate Marketplace GTV
	var gtv float64
	s.db.Table("transactions").Where("type IN (?) AND status = ?", []string{"purchase", "sale"}, "completed").Select("SUM(amount)").Scan(&gtv)
	overview.MarketplaceGTV = gtv

	// 4. Calculate MRR (ISP Subscriptions)
	// Simple approximation: Sum of all active pricing packages price
	var mrr float64
	s.db.Model(&models.HotspotUser{}).
		Joins("JOIN pricing_packages ON hotspot_users.pricing_package_id = pricing_packages.id").
		Where("hotspot_users.access_expires_at > ?", time.Now()).
		Select("SUM(pricing_packages.price)").Scan(&mrr)
	overview.MRR = mrr

	// 5. Active Subscribers
	var count int64
	s.db.Model(&models.HotspotUser{}).Where("access_expires_at > ?", time.Now()).Count(&count)
	overview.ActiveSubscribers = int(count)

	// 6. Calculate ARPU
	if count > 0 {
		overview.AverageRevenue = mrr / float64(count)
	}

	return overview, nil
}

func (s *Service) GetRevenueTrends(ctx context.Context, days int) ([]RevenuePoint, error) {
	var points []RevenuePoint
	// Placeholder for trends logic
	return points, nil
}

// GetWallet retrieves or creates a wallet for the user
func (s *Service) GetWallet(ctx context.Context, userID uint) (*models.Wallet, error) {
	var wallet models.Wallet
	err := s.db.Where("user_id = ?", userID).First(&wallet).Error
	if err == gorm.ErrRecordNotFound {
		// Create new wallet
		wallet = models.Wallet{
			UserID:   userID,
			Balance:  0.0,
			Currency: "KES",
			Status:   "active",
		}
		if err := s.db.Create(&wallet).Error; err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}
	return &wallet, nil
}

// TopUp adds funds to the wallet
func (s *Service) TopUp(ctx context.Context, userID uint, amount float64, ref string) (*models.Wallet, error) {
	wallet, err := s.GetWallet(ctx, userID)
	if err != nil {
		return nil, err
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Create Transaction Record
	txn := models.WalletTransaction{
		WalletID:        wallet.ID,
		Amount:          amount,
		Type:            "topup",
		Reference:       ref,
		Description:     "Wallet Top Up via Portal",
		Status:          "completed",
		TransactionDate: time.Now(),
	}

	if err := tx.Create(&txn).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 2. Update Balance
	wallet.Balance += amount
	if err := tx.Save(wallet).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return wallet, nil
}

// GetWalletTransactions returns history
func (s *Service) GetWalletTransactions(ctx context.Context, userID uint) ([]models.WalletTransaction, error) {
	wallet, err := s.GetWallet(ctx, userID)
	if err != nil {
		return nil, err
	}

	var txns []models.WalletTransaction
	if err := s.db.Where("wallet_id = ?", wallet.ID).Order("transaction_date desc").Find(&txns).Error; err != nil {
		return nil, err
	}
	return txns, nil
}

// Purchase deducts funds for a purchase
func (s *Service) Purchase(ctx context.Context, userID uint, amount float64, description string, ref string) (*models.WalletTransaction, error) {
	wallet, err := s.GetWallet(ctx, userID)
	if err != nil {
		return nil, err
	}

	if wallet.Balance < amount {
		return nil, fmt.Errorf("insufficient funds")
	}

	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Create Transaction (Debit)
	txn := models.WalletTransaction{
		WalletID:        wallet.ID,
		Amount:          -amount, // Negative for debit
		Type:            "purchase",
		Reference:       ref,
		Description:     description,
		Status:          "completed",
		TransactionDate: time.Now(),
	}

	if err := tx.Create(&txn).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 2. Update Balance
	wallet.Balance -= amount
	if err := tx.Save(wallet).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &txn, nil
}

// GetSellerStats aggregates data for the seller dashboard
func (s *Service) GetSellerStats(ctx context.Context, userID uint) (*SellerStats, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}

	stats := &SellerStats{
		IsVerified: user.Role == "admin" || user.Role == "merchant",
	}

	// 1. Get products by this author (assuming Author matches Username)
	s.db.Model(&models.Module{}).Where("author = ?", user.Username).Find(&stats.Products)
	stats.ActiveProducts = int64(len(stats.Products))

	// 2. Count sales and sum revenue for these products
	if stats.ActiveProducts > 0 {
		var moduleIDs []string
		for _, p := range stats.Products {
			moduleIDs = append(moduleIDs, p.ID)
		}

		s.db.Model(&models.License{}).Where("module_id IN ?", moduleIDs).Count(&stats.TotalSales)
		s.db.Model(&models.License{}).Where("module_id IN ?", moduleIDs).Select("COALESCE(SUM(amount_paid), 0)").Scan(&stats.Revenue)

		// 3. Average Rating
		s.db.Model(&models.Module{}).Where("author = ?", user.Username).Select("COALESCE(AVG(rating), 0)").Scan(&stats.Rating)
	}

	return stats, nil
}
