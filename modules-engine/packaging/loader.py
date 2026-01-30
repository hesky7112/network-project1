"""
Module Loader
Loads and validates .alienmodule packages for execution
"""

import os
import json
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime

from .manifest import ModuleManifest
from .packager import ModulePackager


class ModuleLoader:
    """
    Loads modules from .alienmodule packages or directories
    Manages installed modules and their execution context
    """
    
    def __init__(
        self,
        modules_dir: str = None,
        encryption_key: str = None,
    ):
        """
        Initialize the module loader
        
        Args:
            modules_dir: Directory for installed modules (default: ./installed_modules)
            encryption_key: Key for decrypting packages
        """
        self.modules_dir = Path(modules_dir or os.getenv("MODULES_INSTALL_DIR", "./installed_modules"))
        self.modules_dir.mkdir(parents=True, exist_ok=True)
        self.packager = ModulePackager(encryption_key)
        self._module_cache: Dict[str, ModuleManifest] = {}
    
    def install(
        self,
        package_path: str,
        force: bool = False,
    ) -> Dict[str, Any]:
        """
        Install a module from a .alienmodule package
        
        Args:
            package_path: Path to the package file
            force: Overwrite if already installed
        
        Returns:
            Installation result with module info
        """
        # Extract package
        with tempfile.TemporaryDirectory() as temp_dir:
            result = self.packager.unpackage(package_path, temp_dir)
            
            if not result["success"]:
                return {"success": False, "error": result.get("error", "Extraction failed")}
            
            if not result["signature_valid"]:
                return {"success": False, "error": "Package signature invalid"}
            
            # Load manifest
            manifest_path = Path(temp_dir) / "manifest.json"
            with open(manifest_path) as f:
                manifest_data = json.load(f)
            
            manifest = ModuleManifest(**manifest_data)
            
            # Check if already installed
            install_path = self.modules_dir / manifest.id
            if install_path.exists() and not force:
                return {
                    "success": False,
                    "error": f"Module {manifest.id} already installed. Use force=True to overwrite.",
                }
            
            # Move to install directory
            if install_path.exists():
                import shutil
                shutil.rmtree(install_path)
            
            import shutil
            shutil.move(temp_dir, install_path)
        
        # Update cache
        self._module_cache[manifest.id] = manifest
        
        return {
            "success": True,
            "module_id": manifest.id,
            "version": manifest.version,
            "install_path": str(install_path),
        }
    
    def uninstall(self, module_id: str) -> Dict[str, Any]:
        """Uninstall a module"""
        install_path = self.modules_dir / module_id
        
        if not install_path.exists():
            return {"success": False, "error": f"Module {module_id} not installed"}
        
        import shutil
        shutil.rmtree(install_path)
        
        if module_id in self._module_cache:
            del self._module_cache[module_id]
        
        return {"success": True, "module_id": module_id}
    
    def load(self, module_id: str) -> Optional[ModuleManifest]:
        """Load a module manifest by ID"""
        # Check cache first
        if module_id in self._module_cache:
            return self._module_cache[module_id]
        
        # Look in installed modules
        manifest_path = self.modules_dir / module_id / "manifest.json"
        if not manifest_path.exists():
            return None
        
        with open(manifest_path) as f:
            manifest_data = json.load(f)
        
        manifest = ModuleManifest(**manifest_data)
        self._module_cache[module_id] = manifest
        
        return manifest
    
    def list_installed(self) -> List[Dict[str, Any]]:
        """List all installed modules"""
        modules = []
        
        for module_dir in self.modules_dir.iterdir():
            if module_dir.is_dir():
                manifest_path = module_dir / "manifest.json"
                if manifest_path.exists():
                    with open(manifest_path) as f:
                        manifest_data = json.load(f)
                    
                    modules.append({
                        "id": manifest_data.get("id"),
                        "name": manifest_data.get("name"),
                        "version": manifest_data.get("version"),
                        "category": manifest_data.get("category"),
                        "execution_mode": manifest_data.get("execution_mode"),
                    })
        
        return modules
    
    def get_module_path(self, module_id: str) -> Optional[Path]:
        """Get the installation path for a module"""
        install_path = self.modules_dir / module_id
        if install_path.exists():
            return install_path
        return None
    
    def get_ui_definition(self, module_id: str) -> Optional[Dict[str, Any]]:
        """Get the UI definition for a module"""
        manifest = self.load(module_id)
        if not manifest:
            return None
        
        return manifest.ui.model_dump()
    
    def get_primitives_chain(self, module_id: str) -> Optional[List[Dict[str, Any]]]:
        """Get the primitives chain for execution"""
        manifest = self.load(module_id)
        if not manifest:
            return None
        
        return [p.model_dump() for p in manifest.primitives]
    
    def check_requirements(self, module_id: str) -> Dict[str, Any]:
        """Check if system meets module requirements"""
        manifest = self.load(module_id)
        if not manifest:
            return {"success": False, "error": "Module not found"}
        
        issues = []
        
        # Check HAL requirement
        if manifest.requirements.requires_hal:
            # Try to ping HAL service
            try:
                import requests
                resp = requests.get("http://localhost:8080/api/v1/hal/status", timeout=2)
                if not resp.ok:
                    issues.append("HAL service not available (NFC/biometrics required)")
            except:
                issues.append("HAL service not available (NFC/biometrics required)")
        
        # Check GPU requirement
        if manifest.requirements.requires_gpu:
            try:
                import subprocess
                result = subprocess.run(["nvidia-smi"], capture_output=True)
                if result.returncode != 0:
                    issues.append("GPU (CUDA) not available")
            except:
                issues.append("GPU (CUDA) not available")
        
        # Check Python packages
        missing_packages = []
        for package in manifest.requirements.python_packages:
            try:
                __import__(package.split(">=")[0].split("==")[0])
            except ImportError:
                missing_packages.append(package)
        
        if missing_packages:
            issues.append(f"Missing Python packages: {', '.join(missing_packages)}")
        
        return {
            "success": len(issues) == 0,
            "requirements_met": len(issues) == 0,
            "issues": issues,
            "requirements": manifest.requirements.model_dump(),
        }
    
    def export_for_browser(self, module_id: str) -> Optional[Dict[str, Any]]:
        """
        Export module data for browser-side execution
        Returns manifest and required primitive code for Pyodide
        """
        manifest = self.load(module_id)
        if not manifest:
            return None
        
        if manifest.execution_mode not in ["browser", "hybrid"]:
            return {"error": "Module does not support browser execution"}
        
        module_path = self.get_module_path(module_id)
        
        # Read UI file if exists
        ui_content = None
        for ui_file in ["ui.marimo", "ui.py"]:
            ui_path = module_path / ui_file
            if ui_path.exists():
                with open(ui_path) as f:
                    ui_content = f.read()
                break
        
        # Collect primitive code that's WASM compatible
        primitives_code = {}
        primitives_dir = module_path / "primitives"
        if primitives_dir.exists():
            for prim_file in primitives_dir.rglob("*.py"):
                with open(prim_file) as f:
                    primitives_code[prim_file.stem] = f.read()
        
        return {
            "manifest": manifest.model_dump(),
            "ui_content": ui_content,
            "primitives_code": primitives_code,
            "execution_mode": "browser",
        }
