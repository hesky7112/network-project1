package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strconv"
	"testing"
)

func TestRoleManagement(t *testing.T) {
	baseURL := "http://localhost:8080/api/v1/rbac/admin"

	// 1. Create a custom role
	rolePayload := map[string]interface{}{
		"name":        "Finance_Manager_Test",
		"description": "Test role for finance management",
		"permissions": `{"treasury": ["read", "write"], "reports": ["read"]}`,
	}
	body, _ := json.Marshal(rolePayload)
	resp, err := http.Post(baseURL+"/roles", "application/json", bytes.NewBuffer(body))
	if err != nil {
		t.Fatalf("Failed to create role: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status OK, got %v", resp.StatusCode)
	}

	var createdRole map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&createdRole)
	roleID := uint(createdRole["id"].(float64))

	// 2. List all roles and verify
	resp, err = http.Get(baseURL + "/roles")
	if err != nil {
		t.Fatalf("Failed to list roles: %v", err)
	}
	var roles []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&roles)

	found := false
	for _, r := range roles {
		if r["name"] == "Finance_Manager_Test" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Created role not found in list")
	}

	// 3. Try to delete a system role (L_01) - Should fail
	req, _ := http.NewRequest("DELETE", baseURL+"/roles/1", nil)
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Failed to attempt delete: %v", err)
	}
	if resp.StatusCode == http.StatusOK {
		t.Error("System role should not be deletable")
	}

	// 4. Delete the custom role - Should succeed
	roleIDStr := strconv.FormatUint(uint64(roleID), 10)
	req, _ = http.NewRequest("DELETE", baseURL+"/roles/"+roleIDStr, nil)
	resp, err = http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("Failed to delete role: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Errorf("Failed to delete custom role, got %v", resp.StatusCode)
	}
}
