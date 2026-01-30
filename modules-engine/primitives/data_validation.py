"""
Data Validation Primitive
Input validation, KRA PIN checks, sanitization
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime


class DataValidation:
    """Master primitive for data validation and sanitization"""
    
    def __init__(self):
        pass
    
    def validate_phone_number(
        self,
        phone: str,
        country: str = "KE",
        **kwargs
    ) -> Dict[str, Any]:
        """Validate phone number format"""
        # Remove non-digits
        digits = re.sub(r'\D', '', phone)
        
        if country == "KE":
            # Kenyan phone: 254XXXXXXXXX or 0XXXXXXXXX
            if len(digits) == 12 and digits.startswith("254"):
                normalized = digits
                valid = True
            elif len(digits) == 10 and digits.startswith("0"):
                normalized = "254" + digits[1:]
                valid = True
            elif len(digits) == 9:
                normalized = "254" + digits
                valid = True
            else:
                normalized = digits
                valid = False
            
            return {
                "success": True,
                "valid": valid,
                "normalized": normalized,
                "country": country,
            }
        
        # Generic validation
        return {
            "success": True,
            "valid": len(digits) >= 10,
            "normalized": digits,
            "country": country,
        }
    
    def validate_kra_pin(
        self,
        pin: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Validate KRA PIN format (Kenya)"""
        # KRA PIN format: A123456789B (letter, 9 digits, letter)
        pattern = r'^[A-Z]\d{9}[A-Z]$'
        
        pin_upper = pin.upper().strip()
        valid = bool(re.match(pattern, pin_upper))
        
        return {
            "success": True,
            "valid": valid,
            "normalized": pin_upper if valid else None,
            "format": "A123456789B" if not valid else None,
        }
    
    def validate_email(
        self,
        email: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        email_lower = email.lower().strip()
        valid = bool(re.match(pattern, email_lower))
        
        return {
            "success": True,
            "valid": valid,
            "normalized": email_lower if valid else None,
        }
    
    def validate_date(
        self,
        date_str: str,
        format: str = "%Y-%m-%d",
        **kwargs
    ) -> Dict[str, Any]:
        """Validate date format"""
        try:
            parsed = datetime.strptime(date_str, format)
            return {
                "success": True,
                "valid": True,
                "parsed": parsed.isoformat(),
                "format": format,
            }
        except ValueError:
            return {
                "success": True,
                "valid": False,
                "expected_format": format,
            }
    
    def validate_id_number(
        self,
        id_number: str,
        country: str = "KE",
        **kwargs
    ) -> Dict[str, Any]:
        """Validate national ID number"""
        digits = re.sub(r'\D', '', id_number)
        
        if country == "KE":
            # Kenyan ID: 7-8 digits
            valid = 7 <= len(digits) <= 8
        else:
            valid = len(digits) > 0
        
        return {
            "success": True,
            "valid": valid,
            "normalized": digits,
            "country": country,
        }
    
    def sanitize_input(
        self,
        data: str,
        allow_html: bool = False,
        **kwargs
    ) -> Dict[str, Any]:
        """Sanitize input to prevent XSS/SQL injection"""
        import html
        
        # Remove null bytes
        sanitized = data.replace('\x00', '')
        
        if not allow_html:
            # Escape HTML entities
            sanitized = html.escape(sanitized)
        
        # Remove common SQL injection patterns
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)",
            r"(--|;|'|\")",
        ]
        
        for pattern in sql_patterns:
            sanitized = re.sub(pattern, '', sanitized, flags=re.IGNORECASE)
        
        return {
            "success": True,
            "sanitized": sanitized.strip(),
            "original_length": len(data),
            "sanitized_length": len(sanitized),
        }
    
    def validate_schema(
        self,
        data: Dict,
        schema: Dict,
        **kwargs
    ) -> Dict[str, Any]:
        """Validate data against schema"""
        errors = []
        
        for field, rules in schema.items():
            value = data.get(field)
            required = rules.get("required", False)
            field_type = rules.get("type", "str")
            
            if required and value is None:
                errors.append(f"Field '{field}' is required")
                continue
            
            if value is not None:
                # Type validation
                if field_type == "str" and not isinstance(value, str):
                    errors.append(f"Field '{field}' must be a string")
                elif field_type == "int" and not isinstance(value, int):
                    errors.append(f"Field '{field}' must be an integer")
                elif field_type == "float" and not isinstance(value, (int, float)):
                    errors.append(f"Field '{field}' must be a number")
                elif field_type == "bool" and not isinstance(value, bool):
                    errors.append(f"Field '{field}' must be a boolean")
                
                # Length validation
                if "min_length" in rules and len(str(value)) < rules["min_length"]:
                    errors.append(f"Field '{field}' must be at least {rules['min_length']} characters")
                if "max_length" in rules and len(str(value)) > rules["max_length"]:
                    errors.append(f"Field '{field}' must not exceed {rules['max_length']} characters")
                
                # Range validation
                if "min" in rules and value < rules["min"]:
                    errors.append(f"Field '{field}' must be at least {rules['min']}")
                if "max" in rules and value > rules["max"]:
                    errors.append(f"Field '{field}' must not exceed {rules['max']}")
        
        return {
            "success": True,
            "valid": len(errors) == 0,
            "errors": errors,
        }
    
    def validate_mpesa_reference(
        self,
        reference: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Validate M-Pesa transaction reference"""
        # M-Pesa reference format: 10 alphanumeric characters
        pattern = r'^[A-Z0-9]{10}$'
        
        ref_upper = reference.upper().strip()
        valid = bool(re.match(pattern, ref_upper))
        
        return {
            "success": True,
            "valid": valid,
            "normalized": ref_upper if valid else None,
        }
    
    def validate_amount(
        self,
        amount: Any,
        min_amount: float = 0,
        max_amount: float = None,
        currency: str = "KES",
        **kwargs
    ) -> Dict[str, Any]:
        """Validate monetary amount"""
        try:
            amount_float = float(amount)
            
            if amount_float < min_amount:
                return {
                    "success": True,
                    "valid": False,
                    "error": f"Amount must be at least {min_amount} {currency}",
                }
            
            if max_amount and amount_float > max_amount:
                return {
                    "success": True,
                    "valid": False,
                    "error": f"Amount must not exceed {max_amount} {currency}",
                }
            
            return {
                "success": True,
                "valid": True,
                "amount": amount_float,
                "currency": currency,
            }
            
        except (ValueError, TypeError):
            return {
                "success": True,
                "valid": False,
                "error": "Invalid amount format",
            }
