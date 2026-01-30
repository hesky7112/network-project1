package modules

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"
)

// Spawner executes modules by orchestrating primitives
type Spawner struct {
	Registry       *Registry
	LicenseManager *LicenseManager
	EngineURL      string // modules-engine Python service URL
	ModulesDir     string // Path to Marimo module files
}

// NewSpawner creates a new module spawner
func NewSpawner(registry *Registry, licenseMgr *LicenseManager) *Spawner {
	return &Spawner{
		Registry:       registry,
		LicenseManager: licenseMgr,
		EngineURL:      os.Getenv("MODULES_ENGINE_URL"),
		ModulesDir:     os.Getenv("MODULES_DIR"),
	}
}

// ExecutionRequest represents a request to run a module
type ExecutionRequest struct {
	UserID        uint                   `json:"user_id"`
	ModuleID      string                 `json:"module_id"`
	ExecutionMode ExecutionMode          `json:"execution_mode"`
	Input         map[string]interface{} `json:"input"`
}

// ExecutionResponse represents the result of a module run
type ExecutionResponse struct {
	Success    bool                   `json:"success"`
	Output     map[string]interface{} `json:"output"`
	Duration   time.Duration          `json:"duration"`
	Error      string                 `json:"error,omitempty"`
	OutputFile string                 `json:"output_file,omitempty"` // Path to generated PDF, etc.
}

// Execute runs a module for a user
func (s *Spawner) Execute(req *ExecutionRequest) (*ExecutionResponse, error) {
	startTime := time.Now()

	// 1. Validate license
	canExecute, reason := s.LicenseManager.CanExecute(req.UserID, req.ModuleID)
	if !canExecute {
		return &ExecutionResponse{
			Success: false,
			Error:   reason,
		}, nil
	}

	// 2. Get license for tracking
	license, err := s.LicenseManager.GetLicense(req.UserID, req.ModuleID)
	if err != nil {
		return nil, err
	}

	// 3. Get module definition
	module, err := s.Registry.GetModule(req.ModuleID)
	if err != nil {
		return nil, err
	}

	// 4. Determine execution mode
	execMode := req.ExecutionMode
	if execMode == "" {
		execMode = module.ExecutionMode
	}

	// 5. Execute based on mode
	var response *ExecutionResponse

	switch execMode {
	case ExecutionServer:
		response, err = s.executeServer(module, req.Input)
	case ExecutionBrowser:
		// Browser execution returns the module definition for client-side execution
		response = &ExecutionResponse{
			Success: true,
			Output: map[string]interface{}{
				"execution_mode": "browser",
				"primitives":     module.Primitives,
				"ui_template":    module.UITemplate,
			},
		}
	default:
		// Hybrid - let client choose, default to server
		response, err = s.executeServer(module, req.Input)
	}

	if err != nil {
		response = &ExecutionResponse{
			Success: false,
			Error:   err.Error(),
		}
	}

	response.Duration = time.Since(startTime)

	// 6. Log execution
	inputBytes, _ := json.Marshal(req.Input)
	outputBytes, _ := json.Marshal(response.Output)

	status := "success"
	if !response.Success {
		status = "failed"
	}

	s.LicenseManager.LogExecution(&ExecutionLog{
		UserID:        req.UserID,
		ModuleID:      req.ModuleID,
		LicenseID:     license.ID,
		ExecutionMode: execMode,
		Status:        status,
		InputSize:     int64(len(inputBytes)),
		OutputSize:    int64(len(outputBytes)),
		DurationMs:    response.Duration.Milliseconds(),
		Error:         response.Error,
	})

	// 7. Increment execution count
	s.LicenseManager.IncrementExecution(license.ID)

	return response, nil
}

// executeServer runs the module on the Python modules-engine service
func (s *Spawner) executeServer(module *Module, input map[string]interface{}) (*ExecutionResponse, error) {
	if s.EngineURL == "" {
		// Fallback to local execution via subprocess
		return s.executeLocal(module, input)
	}

	// Prepare request for modules-engine
	payload := map[string]interface{}{
		"module_id":  module.ID,
		"primitives": module.Primitives,
		"input":      input,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	// Call modules-engine
	resp, err := http.Post(
		s.EngineURL+"/execute",
		"application/json",
		bytes.NewBuffer(jsonPayload),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call modules-engine: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response ExecutionResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// executeLocal runs the module via local Python subprocess
func (s *Spawner) executeLocal(module *Module, input map[string]interface{}) (*ExecutionResponse, error) {
	// Find Python executable
	pythonPath := "python3"
	if runtime.GOOS == "windows" {
		pythonPath = "python"
	}

	// Prepare input as JSON
	inputJSON, err := json.Marshal(map[string]interface{}{
		"module_id":  module.ID,
		"primitives": module.Primitives,
		"input":      input,
	})
	if err != nil {
		return nil, err
	}

	// Run the executor script
	executorPath := filepath.Join(s.ModulesDir, "executor.py")
	if s.ModulesDir == "" {
		executorPath = "modules-engine/executor.py"
	}

	cmd := exec.Command(pythonPath, executorPath)
	cmd.Stdin = bytes.NewBuffer(inputJSON)

	output, err := cmd.Output()
	if err != nil {
		return &ExecutionResponse{
			Success: false,
			Error:   fmt.Sprintf("execution failed: %v", err),
		}, nil
	}

	var response ExecutionResponse
	if err := json.Unmarshal(output, &response); err != nil {
		return nil, err
	}

	return &response, nil
}

// GetModuleForBrowser returns module data for browser-side execution
func (s *Spawner) GetModuleForBrowser(moduleID string) (map[string]interface{}, error) {
	module, err := s.Registry.GetModule(moduleID)
	if err != nil {
		return nil, err
	}

	// Read UI template content
	templatePath := filepath.Join(s.ModulesDir, module.UITemplate)
	templateContent := ""

	if data, err := os.ReadFile(templatePath); err == nil {
		templateContent = string(data)
	}

	return map[string]interface{}{
		"id":             module.ID,
		"name":           module.Name,
		"execution_mode": "browser",
		"primitives":     module.Primitives,
		"ui_template":    templateContent,
	}, nil
}

// ValidateHALRequirements checks if HAL is available for modules that need it
func (s *Spawner) ValidateHALRequirements(module *Module) error {
	if module.RequiresHAL {
		// Check if HAL service is running
		resp, err := http.Get("http://localhost:8080/api/v1/hal/status")
		if err != nil || resp.StatusCode != 200 {
			return fmt.Errorf("this module requires HAL (NFC/Biometrics) which is not available")
		}
	}

	if module.RequiresGPU {
		// Check for CUDA availability (simplified check)
		cmd := exec.Command("nvidia-smi")
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("this module requires GPU (CUDA) which is not available")
		}
	}

	return nil
}
