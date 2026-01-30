import sys
import json

# Check if running in Pyodide (Browser)
def is_browser():
    return "pyodide" in sys.modules

if is_browser():
    import js
    from pyodide.ffi import to_js

class HALInterface:
    """
    Hardware Abstraction Layer for Marimo modules.
    Provides access to local device hardware (NFC, Biometrics, Printers).
    """

    def __init__(self, context=None):
        self.context = context or {}

    def scan_nfc(self):
        """
        Scan an NFC tag (Browser only).
        Returns the tag content string.
        """
        if is_browser():
            if not hasattr(js, 'NDEFReader'):
                print("HAL Error: WebNFC not supported in this browser.")
                return None
            
            # This is async in JS, but Python primitives are synchronous wrappers usually.
            # In Pyodide, we can use `await` if the notebook cell allows it.
            # For this primitive, we'll return a promise-like or instructions.
            # Simplified: signal UI to scan.
            print("HAL: Requesting NFC Scan...")
            # Ideally, we'd wrap this with a JS helper function exposed in index.html
            # js.scanNFC() -> Promise
            return "NFC_SCAN_INITIATED"
        else:
            print("HAL: Server mode cannot scan local NFC.")
            return "MOCK_NFC_TAG_123"

    def biometric_auth(self, challenge):
        """
        Request biometric authentication (FaceID/TouchID).
        """
        if is_browser():
            print(f"HAL: Requesting Biometric Auth: {challenge}")
            # WebAuthn logic would go here via JS bridge
            return True
        else:
            print("HAL: Server mode bypassing biometrics.")
            return True

    def print_receipt(self, html_content):
        """
        Print a receipt or document.
        """
        if is_browser():
            # Create a hidden iframe or new window to print
            js.document.body.insertAdjacentHTML("beforeend", f"<div id='print-area' style='display:none'>{html_content}</div>")
            # Logic to print this specific area...
            # Simple version: window.print()
            print("HAL: Printing...")
            js.window.print()
            return True
        else:
            print(f"HAL: Server printing mocked: {len(html_content)} bytes")
            return True

    def get_geolocation(self):
        """
        Get current GPS coordinates.
        """
        if is_browser():
            print("HAL: Requesting Geolocation...")
            # js.navigator.geolocation.getCurrentPosition(...)
            return {"lat": 0.0, "lng": 0.0} # Placeholder
        else:
            return {"lat": -1.2921, "lng": 36.8219} # Nairobi
