"""
Data Ingestion Primitive
Handles API fetching from internal and external sources
"""

import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime


class DataIngestion:
    """Master primitive for API integration (internal + external: M-Pesa, KRA, etc.)"""
    
    def __init__(self):
        self.api_base_url = os.getenv("API_BASE_URL", "http://localhost:8080")
        self.timeout = 30
    
    def fetch_internal_api(
        self, 
        endpoint: str, 
        params: Optional[Dict] = None,
        method: str = "GET",
        **kwargs
    ) -> Dict[str, Any]:
        """Fetch data from the Go backend API"""
        import requests
        
        try:
            url = f"{self.api_base_url}{endpoint}"
            
            if method.upper() == "GET":
                response = requests.get(url, params=params, timeout=self.timeout)
            else:
                response = requests.post(url, json=params, timeout=self.timeout)
            
            response.raise_for_status()
            
            return {
                "success": True,
                "data": response.json(),
                "status_code": response.status_code,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_external_api(
        self,
        url: str,
        auth: Optional[str] = None,
        headers: Optional[Dict] = None,
        params: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Fetch data from external APIs"""
        import requests
        
        try:
            request_headers = headers or {}
            if auth:
                request_headers["Authorization"] = f"Bearer {auth}"
            
            response = requests.get(
                url, 
                headers=request_headers, 
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()
            
            return {
                "success": True,
                "data": response.json(),
                "status_code": response.status_code,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_mpesa_transactions(
        self,
        business_code: str,
        start_date: str = None,
        end_date: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Fetch M-Pesa transactions via Daraja API
        Requires MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET env vars
        """
        import requests
        import base64
        
        try:
            consumer_key = os.getenv("MPESA_CONSUMER_KEY")
            consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
            
            if not consumer_key or not consumer_secret:
                return {"success": False, "error": "M-Pesa credentials not configured"}
            
            # Get access token
            auth_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
            credentials = base64.b64encode(
                f"{consumer_key}:{consumer_secret}".encode()
            ).decode()
            
            auth_response = requests.get(
                auth_url,
                headers={"Authorization": f"Basic {credentials}"},
                timeout=10
            )
            access_token = auth_response.json().get("access_token")
            
            # Fetch transactions (simplified - actual API may differ)
            return self.fetch_internal_api(
                f"/api/v1/mpesa/transactions?business_code={business_code}"
            )
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_kra_data(
        self,
        pin: str,
        data_type: str = "obligations",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Fetch data from KRA iTax API
        data_type: obligations, returns, compliance
        """
        try:
            # KRA iTax integration (simplified)
            # In production, use actual iTax API endpoints
            kra_api_key = os.getenv("KRA_API_KEY")
            
            if not kra_api_key:
                return {"success": False, "error": "KRA API key not configured"}
            
            # Placeholder for actual KRA API
            return {
                "success": True,
                "data": {
                    "pin": pin,
                    "status": "compliant",
                    "obligations": [],
                    "last_return": datetime.now().isoformat(),
                },
                "message": "KRA integration placeholder - configure actual API"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_gavaconnect(
        self,
        service_id: str,
        params: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Fetch data from GavaConnect eCitizen API"""
        try:
            gava_api_key = os.getenv("GAVACONNECT_API_KEY")
            
            if not gava_api_key:
                return {"success": False, "error": "GavaConnect API key not configured"}
            
            # Placeholder for actual GavaConnect API
            return {
                "success": True,
                "data": {
                    "service_id": service_id,
                    "status": "available",
                },
                "message": "GavaConnect integration placeholder"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def stream_telemetry(
        self,
        endpoint: str = "/api/v1/telemetry/live",
        duration_seconds: int = 10,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Stream real-time telemetry data
        Returns accumulated data over duration
        """
        import requests
        import time
        
        try:
            url = f"{self.api_base_url}{endpoint}"
            data_points = []
            start_time = time.time()
            
            while time.time() - start_time < duration_seconds:
                try:
                    response = requests.get(url, timeout=5)
                    if response.ok:
                        data_points.append(response.json())
                except:
                    pass
                time.sleep(1)
            
            return {
                "success": True,
                "data_points": data_points,
                "count": len(data_points),
                "duration_seconds": duration_seconds,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_csv(self, file_path: str = None, url: str = None, **kwargs) -> Dict[str, Any]:
        """Import CSV data"""
        import pandas as pd
        
        try:
            if file_path:
                df = pd.read_csv(file_path)
            elif url:
                df = pd.read_csv(url)
            else:
                return {"success": False, "error": "No file path or URL provided"}
            
            return {
                "success": True,
                "data": df.to_dict(orient="records"),
                "columns": list(df.columns),
                "row_count": len(df),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fetch_excel(self, file_path: str, sheet_name: str = None, **kwargs) -> Dict[str, Any]:
        """Import Excel data"""
        import pandas as pd
        
        try:
            df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            return {
                "success": True,
                "data": df.to_dict(orient="records"),
                "columns": list(df.columns),
                "row_count": len(df),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
