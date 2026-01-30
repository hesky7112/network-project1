"""
Payment Processing Primitive
M-Pesa, Stripe, and invoice generation
"""

import os
import base64
from typing import Dict, Any, Optional
from datetime import datetime
import hashlib


class PaymentProcessing:
    """Master primitive for payments (M-Pesa STK Push, card payments, invoicing)"""
    
    def __init__(self):
        self.mpesa_consumer_key = os.getenv("MPESA_CONSUMER_KEY")
        self.mpesa_consumer_secret = os.getenv("MPESA_CONSUMER_SECRET")
        self.mpesa_passkey = os.getenv("MPESA_PASSKEY")
        self.mpesa_shortcode = os.getenv("MPESA_SHORTCODE")
        self.mpesa_env = os.getenv("MPESA_ENV", "sandbox")
    
    def initiate_mpesa_stk(
        self,
        phone: str,
        amount: float,
        account_ref: str = "Payment",
        description: str = "Payment",
        **kwargs
    ) -> Dict[str, Any]:
        """Initiate M-Pesa STK Push"""
        import requests
        
        try:
            if not all([self.mpesa_consumer_key, self.mpesa_consumer_secret]):
                return {"success": False, "error": "M-Pesa credentials not configured"}
            
            # Normalize phone number
            phone = self._normalize_phone(phone)
            
            # Get access token
            base_url = "https://api.safaricom.co.ke" if self.mpesa_env == "production" else "https://sandbox.safaricom.co.ke"
            
            auth_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
            credentials = base64.b64encode(
                f"{self.mpesa_consumer_key}:{self.mpesa_consumer_secret}".encode()
            ).decode()
            
            auth_response = requests.get(
                auth_url,
                headers={"Authorization": f"Basic {credentials}"},
                timeout=10
            )
            
            if not auth_response.ok:
                return {"success": False, "error": "Failed to get M-Pesa access token"}
            
            access_token = auth_response.json().get("access_token")
            
            # Generate timestamp and password
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            password = base64.b64encode(
                f"{self.mpesa_shortcode}{self.mpesa_passkey}{timestamp}".encode()
            ).decode()
            
            # STK Push request
            stk_url = f"{base_url}/mpesa/stkpush/v1/processrequest"
            
            payload = {
                "BusinessShortCode": self.mpesa_shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": int(amount),
                "PartyA": phone,
                "PartyB": self.mpesa_shortcode,
                "PhoneNumber": phone,
                "CallBackURL": os.getenv("MPESA_CALLBACK_URL", "https://example.com/callback"),
                "AccountReference": account_ref[:12],  # Max 12 chars
                "TransactionDesc": description[:13],  # Max 13 chars
            }
            
            response = requests.post(
                stk_url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json",
                },
                timeout=30
            )
            
            result = response.json()
            
            if result.get("ResponseCode") == "0":
                return {
                    "success": True,
                    "checkout_request_id": result.get("CheckoutRequestID"),
                    "merchant_request_id": result.get("MerchantRequestID"),
                    "response_description": result.get("ResponseDescription"),
                }
            else:
                return {
                    "success": False,
                    "error": result.get("errorMessage", result.get("ResponseDescription")),
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def check_mpesa_status(
        self,
        checkout_request_id: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Check M-Pesa STK Push status"""
        import requests
        
        try:
            # Get access token (same as above)
            base_url = "https://api.safaricom.co.ke" if self.mpesa_env == "production" else "https://sandbox.safaricom.co.ke"
            
            auth_url = f"{base_url}/oauth/v1/generate?grant_type=client_credentials"
            credentials = base64.b64encode(
                f"{self.mpesa_consumer_key}:{self.mpesa_consumer_secret}".encode()
            ).decode()
            
            auth_response = requests.get(
                auth_url,
                headers={"Authorization": f"Basic {credentials}"},
                timeout=10
            )
            access_token = auth_response.json().get("access_token")
            
            # Status query
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            password = base64.b64encode(
                f"{self.mpesa_shortcode}{self.mpesa_passkey}{timestamp}".encode()
            ).decode()
            
            query_url = f"{base_url}/mpesa/stkpushquery/v1/query"
            
            payload = {
                "BusinessShortCode": self.mpesa_shortcode,
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id,
            }
            
            response = requests.post(
                query_url,
                json=payload,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=30
            )
            
            result = response.json()
            
            return {
                "success": True,
                "result_code": result.get("ResultCode"),
                "result_desc": result.get("ResultDesc"),
                "is_completed": result.get("ResultCode") == "0",
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def process_card_payment(
        self,
        amount: float,
        currency: str = "KES",
        card_token: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Process card payment via Stripe/Flutterwave"""
        try:
            stripe_key = os.getenv("STRIPE_SECRET_KEY")
            
            if stripe_key:
                import stripe
                stripe.api_key = stripe_key
                
                intent = stripe.PaymentIntent.create(
                    amount=int(amount * 100),  # Convert to cents
                    currency=currency.lower(),
                    payment_method=card_token,
                    confirm=True if card_token else False,
                )
                
                return {
                    "success": True,
                    "payment_intent_id": intent.id,
                    "status": intent.status,
                    "client_secret": intent.client_secret,
                }
            
            return {"success": False, "error": "No payment processor configured"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_invoice(
        self,
        items: list,
        customer: Dict[str, str],
        invoice_number: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate invoice from items"""
        try:
            if not invoice_number:
                invoice_number = f"INV-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Calculate totals
            subtotal = sum(item.get("quantity", 1) * item.get("unit_price", 0) for item in items)
            tax_rate = kwargs.get("tax_rate", 0.16)  # 16% VAT in Kenya
            tax = subtotal * tax_rate
            total = subtotal + tax
            
            invoice = {
                "invoice_number": invoice_number,
                "date": datetime.now().isoformat(),
                "customer": customer,
                "items": items,
                "subtotal": subtotal,
                "tax_rate": tax_rate,
                "tax_amount": tax,
                "total": total,
                "currency": kwargs.get("currency", "KES"),
            }
            
            return {
                "success": True,
                "invoice": invoice,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def reconcile_payments(
        self,
        expected: list,
        actual: list,
        match_field: str = "reference",
        **kwargs
    ) -> Dict[str, Any]:
        """Match expected payments with actual transactions"""
        try:
            expected_map = {str(e.get(match_field)): e for e in expected}
            actual_map = {str(a.get(match_field)): a for a in actual}
            
            matched = []
            unmatched_expected = []
            unmatched_actual = []
            
            for ref, expected_item in expected_map.items():
                if ref in actual_map:
                    matched.append({
                        "expected": expected_item,
                        "actual": actual_map[ref],
                        "status": "matched",
                    })
                else:
                    unmatched_expected.append(expected_item)
            
            for ref, actual_item in actual_map.items():
                if ref not in expected_map:
                    unmatched_actual.append(actual_item)
            
            return {
                "success": True,
                "matched_count": len(matched),
                "unmatched_expected": len(unmatched_expected),
                "unmatched_actual": len(unmatched_actual),
                "matched": matched,
                "missing_payments": unmatched_expected,
                "extra_transactions": unmatched_actual,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _normalize_phone(self, phone: str) -> str:
        """Normalize phone number to 254XXXXXXXXX format"""
        phone = "".join(filter(str.isdigit, phone))
        
        if phone.startswith("0"):
            phone = "254" + phone[1:]
        elif phone.startswith("+"):
            phone = phone[1:]
        elif not phone.startswith("254"):
            phone = "254" + phone
        
        return phone
