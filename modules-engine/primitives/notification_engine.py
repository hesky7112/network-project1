"""
Notification Engine Primitive
SMS, Email, WhatsApp, Push, Webhooks
"""

import os
from typing import Dict, Any, List, Optional


class NotificationEngine:
    """Master primitive for multi-channel notifications"""
    
    def __init__(self):
        self.at_username = os.getenv("AFRICASTALKING_USERNAME")
        self.at_api_key = os.getenv("AFRICASTALKING_API_KEY")
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_pass = os.getenv("SMTP_PASS")
    
    def send_sms(
        self,
        phone: str,
        message: str,
        sender_id: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send SMS via Africa's Talking"""
        try:
            if not self.at_username or not self.at_api_key:
                return {"success": False, "error": "Africa's Talking credentials not configured"}
            
            import africastalking
            
            africastalking.initialize(self.at_username, self.at_api_key)
            sms = africastalking.SMS
            
            response = sms.send(message, [phone], sender_id)
            
            return {
                "success": True,
                "message_id": response.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("messageId"),
                "cost": response.get("SMSMessageData", {}).get("Recipients", [{}])[0].get("cost"),
            }
            
        except ImportError:
            return self._fallback_sms(phone, message)
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_email(
        self,
        to: str,
        subject: str,
        body: str,
        html: bool = False,
        attachments: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send email via SMTP"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            from email.mime.base import MIMEBase
            from email import encoders
            
            if not self.smtp_host or not self.smtp_user:
                return {"success": False, "error": "SMTP credentials not configured"}
            
            msg = MIMEMultipart()
            msg["From"] = self.smtp_user
            msg["To"] = to
            msg["Subject"] = subject
            
            content_type = "html" if html else "plain"
            msg.attach(MIMEText(body, content_type))
            
            # Add attachments
            if attachments:
                for filepath in attachments:
                    with open(filepath, "rb") as f:
                        part = MIMEBase("application", "octet-stream")
                        part.set_payload(f.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={os.path.basename(filepath)}",
                    )
                    msg.attach(part)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            
            return {"success": True, "to": to, "subject": subject}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_whatsapp(
        self,
        phone: str,
        message: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Send WhatsApp message via Business API"""
        import requests
        
        try:
            wa_token = os.getenv("WHATSAPP_TOKEN")
            wa_phone_id = os.getenv("WHATSAPP_PHONE_ID")
            
            if not wa_token or not wa_phone_id:
                return {"success": False, "error": "WhatsApp credentials not configured"}
            
            url = f"https://graph.facebook.com/v18.0/{wa_phone_id}/messages"
            
            payload = {
                "messaging_product": "whatsapp",
                "to": phone,
                "type": "text",
                "text": {"body": message},
            }
            
            response = requests.post(
                url,
                json=payload,
                headers={"Authorization": f"Bearer {wa_token}"},
                timeout=10
            )
            
            if response.ok:
                data = response.json()
                return {
                    "success": True,
                    "message_id": data.get("messages", [{}])[0].get("id"),
                }
            else:
                return {"success": False, "error": response.text}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_push_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Dict = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send push notification via Firebase/OneSignal"""
        import requests
        
        try:
            fcm_key = os.getenv("FIREBASE_SERVER_KEY")
            
            if fcm_key:
                # Firebase Cloud Messaging
                url = "https://fcm.googleapis.com/fcm/send"
                
                payload = {
                    "to": f"/topics/user_{user_id}",
                    "notification": {
                        "title": title,
                        "body": body,
                    },
                    "data": data or {},
                }
                
                response = requests.post(
                    url,
                    json=payload,
                    headers={"Authorization": f"key={fcm_key}"},
                    timeout=10
                )
                
                return {"success": response.ok, "response": response.json()}
            
            return {"success": False, "error": "Push notification service not configured"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_webhook(
        self,
        url: str,
        payload: Dict,
        method: str = "POST",
        headers: Dict = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Send webhook to external URL"""
        import requests
        
        try:
            request_headers = headers or {}
            request_headers.setdefault("Content-Type", "application/json")
            
            if method.upper() == "POST":
                response = requests.post(url, json=payload, headers=request_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=payload, headers=request_headers, timeout=30)
            else:
                response = requests.get(url, params=payload, headers=request_headers, timeout=30)
            
            return {
                "success": response.ok,
                "status_code": response.status_code,
                "response": response.text[:500],  # Limit response size
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def send_bulk_sms(
        self,
        recipients: List[str],
        message: str,
        **kwargs
    ) -> Dict[str, Any]:
        """Send SMS to multiple recipients"""
        results = []
        for phone in recipients:
            result = self.send_sms(phone, message)
            results.append({"phone": phone, **result})
        
        success_count = sum(1 for r in results if r.get("success"))
        
        return {
            "success": True,
            "total": len(recipients),
            "success_count": success_count,
            "failed_count": len(recipients) - success_count,
            "results": results,
        }
    
    def _fallback_sms(self, phone: str, message: str) -> Dict[str, Any]:
        """Fallback when Africa's Talking is not available"""
        # Log for manual sending
        return {
            "success": False,
            "error": "SMS service not available. Install: pip install africastalking",
            "pending_message": {"phone": phone, "message": message},
        }
