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

class Storage:
    """
    Persistent storage primitive for Marimo modules.
    Adapts to environment (Server vs Browser).
    """

    def __init__(self, context=None):
        self.context = context or {}
        self.module_id = self.context.get("module_id")
        self.user_id = self.context.get("user_id")
        self.api_url = os.environ.get("MODULES_API_URL", "http://localhost:8080/api/v1/modules")
        # In browser, these env vars might not exist, but context should be injected

    def set(self, key, value, is_public=False):
        """
        Save a value to storage.
        Auto-compresses payloads > 1KB using Zstd (Python 3.13+ Buff).
        """
        if is_browser():
            # Browser: LocalStorage (No native zstd in JS context easily yet, skipping compression)
            full_key = f"mod_{self.module_id}_{key}"
            js.localStorage.setItem(full_key, json.dumps(value))
            return True
        else:
            # Server: Backend API
            url = f"{self.api_url}/{self.module_id}/storage/{key}"
            headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
            
            try:
                # Compression Logic (The "Buff")
                json_bytes = json.dumps(value).encode('utf-8')
                is_compressed = False
                final_val = json.dumps(value)  # Default uncompressed string

                if len(json_bytes) > 1024:
                    try:
                        import zstandard as zstd
                        import base64
                        cctx = zstd.ZstdCompressor(level=3)
                        compressed = cctx.compress(json_bytes)
                        # Store as base64 string with prefix
                        final_val = "zstd:" + base64.b64encode(compressed).decode('ascii')
                        is_compressed = True
                        print(f"Storage: Compressed {len(json_bytes)}B -> {len(compressed)}B (Zstd)")
                    except ImportError:
                        print("Storage: Zstandard not installed, skipping compression.")

                payload = {"value": final_val, "is_public": is_public}
                
                resp = requests.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return True
            except Exception as e:
                print(f"Storage Error: {e}")
                return False

    def get(self, key, default=None):
        """
        Retrieve a value from storage.
        Auto-decompresses if Zstd detected.
        """
        if is_browser():
            full_key = f"mod_{self.module_id}_{key}"
            val = js.localStorage.getItem(full_key)
            if val is None:
                return default
            try:
                return json.loads(val)
            except:
                return val
        else:
            url = f"{self.api_url}/{self.module_id}/storage/{key}"
            headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
            try:
                resp = requests.get(url, headers=headers)
                if resp.status_code == 404:
                    return default
                resp.raise_for_status()
                data = resp.json()
                raw_val = data.get("value")

                # Decompression Logic (The "Buff")
                if isinstance(raw_val, str) and raw_val.startswith("zstd:"):
                    try:
                        import zstandard as zstd
                        import base64
                        dctx = zstd.ZstdDecompressor()
                        compressed_bytes = base64.b64decode(raw_val[5:]) # Strip 'zstd:'
                        decompressed = dctx.decompress(compressed_bytes)
                        return json.loads(decompressed)
                    except Exception as z_err:
                        print(f"Storage: Decompression failed ({z_err}), returning raw.")
                        return raw_val
                
                return json.loads(raw_val)
            except Exception as e:
                print(f"Storage Error: {e}")
                return default

    def delete(self, key):
        """
        Remove a key from storage.
        """
        if is_browser():
            full_key = f"mod_{self.module_id}_{key}"
            js.localStorage.removeItem(full_key)
            return True
        else:
            url = f"{self.api_url}/{self.module_id}/storage/{key}"
            headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
            try:
                requests.delete(url, headers=headers)
                return True
            except:
                return False

    def list_keys(self):
        """
        List all keys for this module.
        """
        if is_browser():
            keys = []
            prefix = f"mod_{self.module_id}_"
            for i in range(js.localStorage.length):
                k = js.localStorage.key(i)
                if k.startswith(prefix):
                    keys.append(k[len(prefix):])
            return keys
        else:
            url = f"{self.api_url}/{self.module_id}/storage"
            headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
            try:
                resp = requests.get(url, headers=headers)
                resp.raise_for_status()
                return list(resp.json().keys())
            except:
                return []
