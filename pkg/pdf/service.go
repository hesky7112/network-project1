package pdf

import (
	"os"

	"github.com/pdfcpu/pdfcpu/pkg/api"
	"github.com/pdfcpu/pdfcpu/pkg/pdfcpu/model"
	pdfcpuTypes "github.com/pdfcpu/pdfcpu/pkg/pdfcpu/types"
)

// Service handles high-performance PDF operations
type Service struct {
	TempDir string
}

func NewService(tempDir string) *Service {
	if _, err := os.Stat(tempDir); os.IsNotExist(err) {
		os.MkdirAll(tempDir, 0755)
	}
	return &Service{TempDir: tempDir}
}

// Validate checks if a PDF file is valid
func (s *Service) Validate(filePath string) error {
	return api.ValidateFile(filePath, nil)
}

// Split splits a PDF into single page files
func (s *Service) Split(filePath string, outDir string) error {
	return api.SplitFile(filePath, outDir, 1, nil)
}

// Merge merges multiple PDFs into one
func (s *Service) Merge(files []string, outFile string) error {
	return api.MergeCreateFile(files, outFile, false, nil)
}

// Watermark adds a text watermark to all pages
func (s *Service) Watermark(filePath string, outFile string, text string) error {
	// Simple text watermark configuration
	// "text, points:48, scale:1 abs, pos:c, rot:45"
	wm, err := api.TextWatermark(text, "points:48, scale:1 abs, pos:c, rot:45, color: .8 .8 .8, opacity: 0.5", true, false, pdfcpuTypes.POINTS)
	if err != nil {
		return err
	}
	return api.AddWatermarksFile(filePath, outFile, nil, wm, nil)
}

// Encrypt secures a PDF with a password
func (s *Service) Encrypt(filePath string, outFile string, password string) error {
	conf := model.NewDefaultConfiguration()
	conf.UserPW = password
	conf.OwnerPW = password
	return api.EncryptFile(filePath, outFile, conf)
}
