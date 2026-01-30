"""
Module Packager
Creates distributable .alienmodule packages from module source files
"""

import os
import json
import shutil
import hashlib
import tempfile
import zipfile
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .manifest import ModuleManifest, ExecutionMode


class ModulePackager:
    """
    Creates .alienmodule packages for distribution
    
    Package structure:
        module-id.alienmodule (encrypted zip)
        ├── manifest.json          # Module definition
        ├── ui.marimo              # Marimo notebook UI
        ├── config.yaml            # Default configuration
        ├── assets/                # Icons, screenshots
        │   ├── icon.png
        │   └── screenshot-1.png
        ├── primitives/            # (Browser mode) WASM primitives
        │   └── document_intelligence.wasm
        └── signature              # Package signature for verification
    """
    
    MAGIC_BYTES = b"ALIENMOD"
    VERSION = 1
    
    def __init__(self, encryption_key: str = None):
        """
        Initialize packager with optional encryption key
        If no key provided, uses env var MODULE_ENCRYPTION_KEY
        """
        self.encryption_key = encryption_key or os.getenv("MODULE_ENCRYPTION_KEY")
        if not self.encryption_key:
            # Generate default key (should be set in production)
            self.encryption_key = Fernet.generate_key().decode()
    
    def package(
        self,
        source_dir: str,
        output_path: str = None,
        encrypt: bool = True,
    ) -> Dict[str, Any]:
        """
        Package a module directory into a .alienmodule file
        
        Args:
            source_dir: Directory containing manifest.json and module files
            output_path: Output path for the package (default: source_dir/../{module_id}.alienmodule)
            encrypt: Whether to encrypt the package (default: True)
        
        Returns:
            Dict with package info (path, size, hash, etc.)
        """
        source_path = Path(source_dir)
        
        # Load and validate manifest
        manifest_path = source_path / "manifest.json"
        if not manifest_path.exists():
            raise FileNotFoundError(f"manifest.json not found in {source_dir}")
        
        with open(manifest_path) as f:
            manifest_data = json.load(f)
        
        manifest = ModuleManifest(**manifest_data)
        
        # Determine output path
        if not output_path:
            output_path = source_path.parent / f"{manifest.id}.alienmodule"
        else:
            output_path = Path(output_path)
        
        # Create temp directory for packaging
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            package_dir = temp_path / "package"
            package_dir.mkdir()
            
            # Copy files to package directory
            files_to_include = self._collect_files(source_path, manifest)
            
            for src_file, dest_name in files_to_include:
                dest_path = package_dir / dest_name
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dest_path)
            
            # Update manifest with file hashes
            manifest_data["file_hashes"] = self._compute_file_hashes(package_dir)
            manifest_data["packaged_at"] = datetime.now().isoformat()
            
            # Write updated manifest
            with open(package_dir / "manifest.json", "w") as f:
                json.dump(manifest_data, f, indent=2)
            
            # Generate signature
            signature = self._sign_package(package_dir)
            with open(package_dir / "signature", "w") as f:
                f.write(signature)
            
            # Create zip archive
            zip_path = temp_path / "package.zip"
            self._create_zip(package_dir, zip_path)
            
            # Encrypt if requested
            if encrypt:
                final_content = self._encrypt_package(zip_path)
            else:
                with open(zip_path, "rb") as f:
                    final_content = f.read()
            
            # Write final package with header
            with open(output_path, "wb") as f:
                # Magic bytes + version + encrypted flag
                f.write(self.MAGIC_BYTES)
                f.write(self.VERSION.to_bytes(2, "big"))
                f.write(b"\x01" if encrypt else b"\x00")
                f.write(final_content)
            
            # Compute final hash
            package_hash = hashlib.sha256(final_content).hexdigest()
            package_size = output_path.stat().st_size
        
        return {
            "success": True,
            "path": str(output_path),
            "module_id": manifest.id,
            "version": manifest.version,
            "size_bytes": package_size,
            "hash": package_hash,
            "encrypted": encrypt,
        }
    
    def unpackage(
        self,
        package_path: str,
        output_dir: str = None,
    ) -> Dict[str, Any]:
        """
        Extract a .alienmodule package
        
        Args:
            package_path: Path to .alienmodule file
            output_dir: Directory to extract to (default: same dir as package)
        
        Returns:
            Dict with extraction info
        """
        package_file = Path(package_path)
        
        with open(package_file, "rb") as f:
            # Read header
            magic = f.read(8)
            if magic != self.MAGIC_BYTES:
                raise ValueError("Invalid package file: wrong magic bytes")
            
            version = int.from_bytes(f.read(2), "big")
            encrypted = f.read(1) == b"\x01"
            
            content = f.read()
        
        # Decrypt if needed
        if encrypted:
            zip_content = self._decrypt_package(content)
        else:
            zip_content = content
        
        # Determine output directory
        if not output_dir:
            output_dir = package_file.parent / package_file.stem
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Extract zip
        with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp:
            tmp.write(zip_content)
            tmp_path = tmp.name
        
        try:
            with zipfile.ZipFile(tmp_path, "r") as zf:
                zf.extractall(output_path)
        finally:
            os.unlink(tmp_path)
        
        # Verify signature
        signature_valid = self._verify_signature(output_path)
        
        # Load manifest
        with open(output_path / "manifest.json") as f:
            manifest = json.load(f)
        
        return {
            "success": True,
            "path": str(output_path),
            "module_id": manifest.get("id"),
            "version": manifest.get("version"),
            "signature_valid": signature_valid,
        }
    
    def validate(self, package_path: str) -> Dict[str, Any]:
        """Validate a package without extracting"""
        try:
            with open(package_path, "rb") as f:
                magic = f.read(8)
                if magic != self.MAGIC_BYTES:
                    return {"valid": False, "error": "Invalid magic bytes"}
                
                version = int.from_bytes(f.read(2), "big")
                encrypted = f.read(1) == b"\x01"
            
            return {
                "valid": True,
                "version": version,
                "encrypted": encrypted,
                "size_bytes": os.path.getsize(package_path),
            }
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def _collect_files(self, source_dir: Path, manifest: ModuleManifest) -> List[tuple]:
        """Collect files to include in the package"""
        files = []
        
        # Always include manifest
        files.append((source_dir / "manifest.json", "manifest.json"))
        
        # Include declared files
        for file_type, file_path in manifest.files.items():
            full_path = source_dir / file_path
            if full_path.exists():
                files.append((full_path, file_path))
        
        # Include UI file if exists
        for ui_file in ["ui.marimo", "ui.py"]:
            ui_path = source_dir / ui_file
            if ui_path.exists():
                files.append((ui_path, ui_file))
        
        # Include config if exists
        config_path = source_dir / "config.yaml"
        if config_path.exists():
            files.append((config_path, "config.yaml"))
        
        # Include assets directory
        assets_dir = source_dir / "assets"
        if assets_dir.exists():
            for asset_file in assets_dir.rglob("*"):
                if asset_file.is_file():
                    rel_path = asset_file.relative_to(source_dir)
                    files.append((asset_file, str(rel_path)))
        
        # Include WASM primitives for browser mode
        if manifest.execution_mode in [ExecutionMode.BROWSER, ExecutionMode.HYBRID]:
            primitives_dir = source_dir / "primitives"
            if primitives_dir.exists():
                for prim_file in primitives_dir.rglob("*.wasm"):
                    rel_path = prim_file.relative_to(source_dir)
                    files.append((prim_file, str(rel_path)))
        
        return files
    
    def _compute_file_hashes(self, package_dir: Path) -> Dict[str, str]:
        """Compute SHA256 hashes for all files"""
        hashes = {}
        for file_path in package_dir.rglob("*"):
            if file_path.is_file() and file_path.name != "signature":
                with open(file_path, "rb") as f:
                    file_hash = hashlib.sha256(f.read()).hexdigest()
                rel_path = file_path.relative_to(package_dir)
                hashes[str(rel_path)] = file_hash
        return hashes
    
    def _create_zip(self, source_dir: Path, output_path: Path):
        """Create a zip archive of the package directory"""
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for file_path in source_dir.rglob("*"):
                if file_path.is_file():
                    arcname = file_path.relative_to(source_dir)
                    zf.write(file_path, arcname)
    
    def _get_fernet(self) -> Fernet:
        """Get Fernet instance from encryption key"""
        # If key is not 32 bytes base64, derive it
        try:
            return Fernet(self.encryption_key.encode())
        except:
            # Derive key using PBKDF2
            salt = b"alienmodule_salt"  # Fixed salt (should vary in production)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.encryption_key.encode()))
            return Fernet(key)
    
    def _encrypt_package(self, zip_path: Path) -> bytes:
        """Encrypt the package zip file"""
        fernet = self._get_fernet()
        with open(zip_path, "rb") as f:
            return fernet.encrypt(f.read())
    
    def _decrypt_package(self, encrypted_content: bytes) -> bytes:
        """Decrypt the package content"""
        fernet = self._get_fernet()
        return fernet.decrypt(encrypted_content)
    
    def _sign_package(self, package_dir: Path) -> str:
        """Generate a signature for the package content"""
        # Compute hash of all files (excluding signature itself)
        content_hash = hashlib.sha256()
        
        for file_path in sorted(package_dir.rglob("*")):
            if file_path.is_file() and file_path.name != "signature":
                with open(file_path, "rb") as f:
                    content_hash.update(f.read())
        
        # Sign with encryption key
        signature_data = content_hash.hexdigest() + ":" + self.encryption_key
        return hashlib.sha256(signature_data.encode()).hexdigest()
    
    def _verify_signature(self, package_dir: Path) -> bool:
        """Verify the package signature"""
        signature_path = package_dir / "signature"
        if not signature_path.exists():
            return False
        
        with open(signature_path) as f:
            stored_signature = f.read().strip()
        
        # Temporarily remove signature file
        signature_path.unlink()
        
        try:
            expected_signature = self._sign_package(package_dir)
            return stored_signature == expected_signature
        finally:
            # Restore signature file
            with open(signature_path, "w") as f:
                f.write(stored_signature)
