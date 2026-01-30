"""
Compliance Engine Primitive
Audit logging, GDPR, KRA compliance
"""

import os
import json
import hashlib
from typing import Dict, Any, List, Optional
from datetime import datetime


class ComplianceEngine:
    """Master primitive for compliance (audit logging, GDPR, KRA)"""
    
    def __init__(self):
        self.audit_log_path = os.getenv("AUDIT_LOG_PATH", "audit_logs")
    
    def audit_log(
        self,
        action: str,
        user_id: str,
        data: Dict,
        resource: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Create immutable audit trail entry"""
        try:
            timestamp = datetime.utcnow().isoformat()
            
            entry = {
                "timestamp": timestamp,
                "action": action,
                "user_id": user_id,
                "resource": resource,
                "data_hash": self._hash_data(data),
                "ip_address": kwargs.get("ip_address"),
                "user_agent": kwargs.get("user_agent"),
            }
            
            # Calculate entry hash for tamper detection
            entry["entry_hash"] = hashlib.sha256(
                json.dumps(entry, sort_keys=True).encode()
            ).hexdigest()
            
            # Store log entry
            self._store_audit_entry(entry)
            
            return {
                "success": True,
                "entry_id": entry["entry_hash"][:16],
                "timestamp": timestamp,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def anonymize_data(
        self,
        data: Dict,
        fields: List[str],
        method: str = "hash",
        **kwargs
    ) -> Dict[str, Any]:
        """Anonymize sensitive fields (GDPR compliance)"""
        try:
            anonymized = data.copy()
            
            for field in fields:
                if field in anonymized:
                    value = str(anonymized[field])
                    
                    if method == "hash":
                        anonymized[field] = hashlib.sha256(value.encode()).hexdigest()[:16]
                    elif method == "mask":
                        if len(value) > 4:
                            anonymized[field] = value[:2] + "*" * (len(value) - 4) + value[-2:]
                        else:
                            anonymized[field] = "*" * len(value)
                    elif method == "remove":
                        anonymized[field] = "[REDACTED]"
                    elif method == "pseudonymize":
                        # Deterministic but reversible
                        anonymized[field] = f"USER_{hashlib.md5(value.encode()).hexdigest()[:8]}"
            
            return {
                "success": True,
                "data": anonymized,
                "anonymized_fields": fields,
                "method": method,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def encrypt_sensitive_data(
        self,
        data: str,
        key: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Encrypt sensitive data (HIPAA compliance)"""
        try:
            from cryptography.fernet import Fernet
            
            if not key:
                key = os.getenv("ENCRYPTION_KEY")
                if not key:
                    # Generate new key (should be stored securely)
                    key = Fernet.generate_key().decode()
            
            fernet = Fernet(key.encode() if isinstance(key, str) else key)
            encrypted = fernet.encrypt(data.encode())
            
            return {
                "success": True,
                "encrypted": encrypted.decode(),
                "key_hint": key[:8] + "..." if len(key) > 8 else key,
            }
            
        except ImportError:
            # Fallback to basic encoding
            import base64
            encoded = base64.b64encode(data.encode()).decode()
            return {
                "success": True,
                "encrypted": encoded,
                "method": "base64_fallback",
                "warning": "Install cryptography for proper encryption",
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def decrypt_sensitive_data(
        self,
        encrypted_data: str,
        key: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Decrypt sensitive data"""
        try:
            from cryptography.fernet import Fernet
            
            fernet = Fernet(key.encode() if isinstance(key, str) else key)
            decrypted = fernet.decrypt(encrypted_data.encode())
            
            return {
                "success": True,
                "data": decrypted.decode(),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def validate_kra_compliance(
        self,
        transaction: Dict,
        **kwargs
    ) -> Dict[str, Any]:
        """Validate transaction for KRA tax compliance"""
        try:
            issues = []
            
            # Check required fields
            required_fields = ["amount", "date", "description", "customer_pin"]
            for field in required_fields:
                if field not in transaction or not transaction[field]:
                    issues.append(f"Missing required field: {field}")
            
            # Validate KRA PIN format
            customer_pin = transaction.get("customer_pin", "")
            if customer_pin and not self._validate_kra_pin_format(customer_pin):
                issues.append("Invalid KRA PIN format")
            
            # Check VAT calculation (16% in Kenya)
            if "amount" in transaction and "vat_amount" in transaction:
                expected_vat = transaction["amount"] * 0.16
                actual_vat = transaction["vat_amount"]
                if abs(expected_vat - actual_vat) > 0.01:
                    issues.append(f"VAT mismatch: expected {expected_vat:.2f}, got {actual_vat:.2f}")
            
            # Check date is not in future
            if "date" in transaction:
                try:
                    tx_date = datetime.fromisoformat(transaction["date"])
                    if tx_date > datetime.now():
                        issues.append("Transaction date cannot be in the future")
                except:
                    issues.append("Invalid date format")
            
            return {
                "success": True,
                "compliant": len(issues) == 0,
                "issues": issues,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_compliance_report(
        self,
        period: str,
        report_type: str = "audit",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate compliance report for audit purposes"""
        try:
            # Parse period
            if period == "month":
                start_date = datetime.now().replace(day=1)
            elif period == "quarter":
                quarter = (datetime.now().month - 1) // 3
                start_date = datetime.now().replace(month=quarter*3 + 1, day=1)
            elif period == "year":
                start_date = datetime.now().replace(month=1, day=1)
            else:
                start_date = datetime.now()
            
            # Collect audit entries
            entries = self._get_audit_entries(start_date)
            
            report = {
                "report_type": report_type,
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": datetime.now().isoformat(),
                "total_entries": len(entries),
                "summary": {
                    "actions": {},
                    "users": {},
                },
                "entries": entries[:100],  # Limit to 100 for display
            }
            
            # Summarize
            for entry in entries:
                action = entry.get("action", "unknown")
                user = entry.get("user_id", "unknown")
                
                report["summary"]["actions"][action] = report["summary"]["actions"].get(action, 0) + 1
                report["summary"]["users"][user] = report["summary"]["users"].get(user, 0) + 1
            
            return {"success": True, "report": report}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def check_data_retention(
        self,
        data: List[Dict],
        retention_days: int,
        date_field: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Check data retention policy compliance"""
        try:
            cutoff_date = datetime.now() - timedelta(days=retention_days)
            
            expired = []
            valid = []
            
            for record in data:
                record_date = record.get(date_field)
                if record_date:
                    try:
                        dt = datetime.fromisoformat(record_date)
                        if dt < cutoff_date:
                            expired.append(record)
                        else:
                            valid.append(record)
                    except:
                        valid.append(record)
                else:
                    valid.append(record)
            
            return {
                "success": True,
                "total_records": len(data),
                "expired_count": len(expired),
                "valid_count": len(valid),
                "expired_records": expired,
                "retention_days": retention_days,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _hash_data(self, data: Any) -> str:
        """Create hash of data for audit purposes"""
        return hashlib.sha256(
            json.dumps(data, sort_keys=True, default=str).encode()
        ).hexdigest()
    
    def _validate_kra_pin_format(self, pin: str) -> bool:
        """Validate KRA PIN format"""
        import re
        pattern = r'^[A-Z]\d{9}[A-Z]$'
        return bool(re.match(pattern, pin.upper()))
    
    def _store_audit_entry(self, entry: Dict):
        """Store audit log entry"""
        os.makedirs(self.audit_log_path, exist_ok=True)
        
        log_file = os.path.join(
            self.audit_log_path,
            f"audit_{datetime.now().strftime('%Y%m%d')}.jsonl"
        )
        
        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")
    
    def _get_audit_entries(self, start_date: datetime) -> List[Dict]:
        """Retrieve audit entries since start_date"""
        entries = []
        
        if not os.path.exists(self.audit_log_path):
            return entries
        
        for filename in os.listdir(self.audit_log_path):
            if filename.startswith("audit_") and filename.endswith(".jsonl"):
                filepath = os.path.join(self.audit_log_path, filename)
                with open(filepath) as f:
                    for line in f:
                        try:
                            entry = json.loads(line)
                            entry_date = datetime.fromisoformat(entry["timestamp"])
                            if entry_date >= start_date:
                                entries.append(entry)
                        except:
                            pass
        
        return entries
