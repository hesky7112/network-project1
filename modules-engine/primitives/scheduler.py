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

class Scheduler:
    """
    Automation primitive for Marimo modules.
    Allows modules to schedule themselves to run in the future.
    """

    def __init__(self, context=None):
        self.context = context or {}
        self.module_id = self.context.get("module_id")
        self.user_id = self.context.get("user_id")
        self.api_url = os.environ.get("MODULES_API_URL", "http://localhost:8080/api/v1/modules")

    def schedule(self, interval, input_data=None):
        """
        Schedule this module to run repeatedly.
        interval: "10m", "1h", or "*/5 * * * *"
        input_data: dict of inputs for the run
        """
        if is_browser():
            # In browser, we can only do ephemeral scheduling while tab is open
            # We use setTimeout/setInterval
            print(f"Browser Scheduling: {interval}")
            # Simplified: just run once after delay (parsing interval is hard in JS without lib)
            # For now, return False as "Persistent Scheduling not supported in Browser"
            # Or mapped to a simple delay if format is "1000ms"
            return False
        else:
            # Server persistent schedule
            url = f"{self.api_url}/{self.module_id}/schedule"
            headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
            payload = {
                "schedule": interval,
                "input": input_data or {}
            }
            try:
                resp = requests.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                print(f"Scheduler Error: {e}")
                return None

    def list_jobs(self):
        """List active schedules for this module"""
        if is_browser():
            return []
        
        url = f"{self.api_url}/{self.module_id}/schedule"
        headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
        try:
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except:
            return []

    def cancel(self, job_id):
        """Cancel a scheduled job"""
        if is_browser():
            return False
            
        url = f"{self.api_url}/{self.module_id}/schedule/{job_id}"
        headers = {"Authorization": f"Bearer {self.context.get('token', '')}"}
        try:
            requests.delete(url, headers=headers)
            return True
        except:
            return False
