package modules

import (
	"archive/zip"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// ========== PDF OPS (Phase 6) ==========

// SplitPDF uploads a PDF and returns a ZIP of split pages
func (h *Handlers) SplitPDF(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// Temp workspace
	workDir := filepath.Join(h.pdfService.TempDir, fmt.Sprintf("split_%d", time.Now().UnixNano()))
	os.MkdirAll(workDir, 0755)
	defer os.RemoveAll(workDir) // Cleanup

	// Save input
	inputPath := filepath.Join(workDir, header.Filename)
	dest, err := os.Create(inputPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	io.Copy(dest, file)
	dest.Close()

	// Perform Split
	outDir := filepath.Join(workDir, "pages")
	os.MkdirAll(outDir, 0755)
	if err := h.pdfService.Split(inputPath, outDir); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Split failed: " + err.Error()})
		return
	}

	// Zip results
	zipPath := filepath.Join(workDir, "result.zip")
	if err := zipFolder(outDir, zipPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Zip failed"})
		return
	}

	// Serve
	c.Header("Content-Disposition", "attachment; filename=split_pages.zip")
	c.File(zipPath)
}

// MergePDFs uploads multiple PDFs and returns a merged PDF
func (h *Handlers) MergePDFs(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form"})
		return
	}

	files := form.File["files"]
	if len(files) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Need at least 2 files to merge"})
		return
	}

	// Temp workspace
	workDir := filepath.Join(h.pdfService.TempDir, fmt.Sprintf("merge_%d", time.Now().UnixNano()))
	os.MkdirAll(workDir, 0755)
	defer os.RemoveAll(workDir)

	var filePaths []string
	for i, fileHeader := range files {
		inputPath := filepath.Join(workDir, fmt.Sprintf("%03d_%s", i, fileHeader.Filename))
		src, _ := fileHeader.Open()
		dst, _ := os.Create(inputPath)
		io.Copy(dst, src)
		src.Close()
		dst.Close()
		filePaths = append(filePaths, inputPath)
	}

	// Perform Merge
	outPath := filepath.Join(workDir, "merged.pdf")
	if err := h.pdfService.Merge(filePaths, outPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Merge failed: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=merged.pdf")
	c.File(outPath)
}

// WatermarkPDF adds text watermark
func (h *Handlers) WatermarkPDF(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	text := c.PostForm("text")
	if text == "" {
		text = "CONFIDENTIAL"
	}

	workDir := filepath.Join(h.pdfService.TempDir, fmt.Sprintf("wm_%d", time.Now().UnixNano()))
	os.MkdirAll(workDir, 0755)
	defer os.RemoveAll(workDir)

	inputPath := filepath.Join(workDir, header.Filename)
	dst, _ := os.Create(inputPath)
	io.Copy(dst, file)
	dst.Close()

	outPath := filepath.Join(workDir, "watermarked.pdf")
	if err := h.pdfService.Watermark(inputPath, outPath, text); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Watermark failed: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=watermarked_"+header.Filename)
	c.File(outPath)
}

// ExtractPDFData uploads a PDF and extracts structured data using intelligence primitives
func (h *Handlers) ExtractPDFData(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}
	defer file.Close()

	// 1. Save to temp
	tempPath := filepath.Join(os.TempDir(), fmt.Sprintf("extract_%d_%s", time.Now().UnixNano(), header.Filename))
	dst, err := os.Create(tempPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create temp file"})
		return
	}
	io.Copy(dst, file)
	dst.Close()
	defer os.Remove(tempPath)

	// 2. Read bytes for the primitive (Spawner currently expects input map)
	// Some primitives take file paths, but DocumentIntelligence in Python takes pdf_bytes or pdf_path
	// Our spawner.ExecuteServer takes JSON input. We'll send the path and assume the engine can read it if it's shared,
	// or we send base64. Let's send a mock for now or try to use the smarter execute if possible.

	// Actually, the DocumentIntelligence primitive in Python can take a path.
	// If the Go and Python services share the same filesystem, this works.
	// If not, we should pass bytes.

	// For this system, they likely share the disk or we can pass base64.
	// Let's use the Spawner to call the engine.

	input := map[string]interface{}{
		"pdf_path": tempPath,
		"method":   "ocr", // Default to OCR for high precision
	}

	// We'll manually call the executeServer with the DocumentIntelligence primitive
	module := &Module{
		ID: "pdf-intel-core",
		Primitives: []PrimitiveRef{
			{Module: "DocumentIntelligence", Method: "perform_ocr"},
			{Module: "DocumentIntelligence", Method: "classify_document", Config: map[string]interface{}{"content": "{{result}}"}},
		},
	}

	result, err := h.spawner.executeServer(module, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Intelligence engine failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// PDFChat allows chatting with an AI about a document's content
func (h *Handlers) PDFChat(c *gin.Context) {
	var req struct {
		Query   string                   `json:"query" binding:"required"`
		Context map[string]interface{}   `json:"context"`
		History []map[string]interface{} `json:"history"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Construct input for the ChatbotEngine primitive
	input := map[string]interface{}{
		"message": req.Query,
		"history": req.History,
	}

	// Inject document context if provided
	if req.Context != nil {
		input["context_injection"] = req.Context
	}

	module := &Module{
		ID: "pdf-chat-core",
		Primitives: []PrimitiveRef{
			{
				Module: "ChatbotEngine",
				Method: "chat",
				Config: map[string]interface{}{
					"system_prompt": "You are a professional PDF analyzer. Answer the user's questions based on the provided document context.",
				},
			},
		},
	}

	result, err := h.spawner.executeServer(module, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI Engine failed: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// Helper: Zip a folder
func zipFolder(source, target string) error {
	zipfile, err := os.Create(target)
	if err != nil {
		return err
	}
	defer zipfile.Close()

	archive := zip.NewWriter(zipfile)
	defer archive.Close()

	return filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		header, err := zip.FileInfoHeader(info)
		if err != nil {
			return err
		}
		header.Name = filepath.Base(path)
		header.Method = zip.Deflate

		writer, err := archive.CreateHeader(header)
		if err != nil {
			return err
		}
		file, err := os.Open(path)
		if err != nil {
			return err
		}
		defer file.Close()
		_, err = io.Copy(writer, file)
		return err
	})
}
