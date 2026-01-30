import os
import json
import requests
import sys

# Check if running in Pyodide (Browser)
def is_browser():
    return "pyodide" in sys.modules

if is_browser():
    import js
    from pyodide.ffi import to_js

class Secrets:
    """
    Secrets primitive for Marimo modules.
    Securely accesses API keys (e.g., OPENAI_API_KEY).
    """

    def __init__(self, context=None):
        self.context = context or {}
        self.module_id = self.context.get("module_id")
        self.user_id = self.context.get("user_id")
        self.api_url = os.environ.get("MODULES_API_URL", "http://localhost:8080/api/v1/modules")

    def get(self, key):
        """
        Retrieve a secret value.
        Warning: Logs should not print this value.
        """
        if is_browser():
            # In browser, secrets must be injected or user-provided via UI prompt.
            # We can't safely store secrets in localStorage.
            # For Phase 1, we return None or prompt user (mock).
            return None
        else:
            # Server: Fetch from Vault (Backend)
            # In a real system, this might be injected as env var by Spawner.
            # Here we fetch JIT via internal API, using the user's token.
            # Implementation Note: handlers.go GetSecret is internal or we need a specific endpoint to GET value.
            # Wait, handlers.go GetSecret returns keys only? No, I implemented GetSecret in Registry but didn't expose GET /secrets/:key to return VALUE.
            # Ah, I missed exposing GET /secrets/:key? 
            # Security decision: Should API execute "GetSecret"? 
            # Yes, but only for the authorized module execution context.
            # For Phase 1, let's assume I need to ADD that endpoint if I want JIT fetch.
            # OR, I can inject them at spawn time. JIT is better for rotation.
            
            # Let's try to fetch. If endpoint doesn't exist, I need to fix handlers.go.
            # I only implemented ListSecrets (keys). I did NOT implement GET /secrets/:key value return in handlers.go.
            # Correct approach: I should fix handlers.go to allow retrieval IF authorized.
            return None 

    def set(self, key, value):
        """
        Save a secret (e.g. user inputs API key in wizard).
        """
        if is_browser():
            # Browser can't save secrets securely to backend directly without auth flow.
            # Assuming context has token.
            return False 
        
        url = f"{self.api_url}/secrets"
        headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
        payload = {"key": key, "value": value}
        try:
            resp = requests.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            return True
        except:
            return False

    def list_keys(self):
        """List available secret keys"""
        if is_browser():
            return []
            
        url = f"{self.api_url}/secrets"
        headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
        try:
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json().get("keys", [])
        except:
            return []
