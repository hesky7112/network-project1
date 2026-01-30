"""
WASM Bundler for Browser-Side Execution
Creates Pyodide-compatible bundles for privacy premium modules
"""

import os
import json
import shutil
import tempfile
from pathlib import Path
from typing import Dict, Any, List, Optional
import zipfile


class WASMBundler:
    """
    Creates WASM bundles for browser-side execution via Pyodide
    
    Output structure:
        module-id.wasm/
        ├── manifest.json       # Module manifest
        ├── bundle.js           # JavaScript loader
        ├── primitives.py       # Combined primitives code
        ├── ui.marimo           # UI definition
        └── deps/               # Pure Python dependencies
    """
    
    PYODIDE_PACKAGES = [
        "pandas", "numpy", "pydantic", "requests",
        "pillow", "reportlab", "qrcode"
    ]
    
    def __init__(self, primitives_dir: str = None):
        """
        Initialize bundler
        
        Args:
            primitives_dir: Directory containing primitive Python files
        """
        self.primitives_dir = Path(
            primitives_dir or 
            os.path.join(os.path.dirname(__file__), "..", "primitives")
        )
    
    def bundle(
        self,
        module_dir: str,
        output_dir: str = None,
    ) -> Dict[str, Any]:
        """
        Create a WASM-compatible bundle from a module directory
        
        Args:
            module_dir: Directory containing manifest.json
            output_dir: Output directory (default: module_dir/../{module_id}.wasm)
        
        Returns:
            Bundle creation result
        """
        module_path = Path(module_dir)
        
        # Load manifest
        manifest_path = module_path / "manifest.json"
        with open(manifest_path) as f:
            manifest = json.load(f)
        
        # Determine output path
        module_id = manifest["id"]
        if not output_dir:
            output_dir = module_path.parent / f"{module_id}.wasm"
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Copy manifest
        shutil.copy2(manifest_path, output_path / "manifest.json")
        
        # Copy UI file
        for ui_file in ["ui.marimo", "ui.py"]:
            ui_path = module_path / ui_file
            if ui_path.exists():
                shutil.copy2(ui_path, output_path / ui_file)
                break
        
        # Collect required primitives
        primitives_code = self._collect_primitives(manifest.get("primitives", []))
        
        # Write combined primitives file
        with open(output_path / "primitives.py", "w") as f:
            f.write(primitives_code)
        
        # Generate JavaScript loader
        loader_js = self._generate_loader(manifest)
        with open(output_path / "bundle.js", "w") as f:
            f.write(loader_js)
        
        # Determine required Pyodide packages
        required_packages = self._get_required_packages(manifest)
        
        # Write package list
        with open(output_path / "packages.json", "w") as f:
            json.dump({"packages": required_packages}, f, indent=2)
        
        return {
            "success": True,
            "output_path": str(output_path),
            "module_id": module_id,
            "required_packages": required_packages,
        }
    
    def _collect_primitives(self, primitives: List[Dict]) -> str:
        """Collect and combine primitive code"""
        code_parts = [
            '"""Auto-generated primitives bundle for browser execution"""',
            "",
            "import json",
            "from typing import Dict, Any, List, Optional",
            "",
        ]
        
        # Track which primitives we need
        primitive_names = set()
        for p in primitives:
            primitive_names.add(p.get("module", ""))
        
        # Map primitive names to file names
        name_to_file = {
            "DocumentIntelligence": "document_intelligence",
            "DataIngestion": "data_ingestion",
            "MLEngine": "ml_engine",
            "ReportGeneration": "report_generation",
            "ChatbotEngine": "chatbot_engine",
            "WorkflowOrchestrator": "workflow_orchestrator",
            "PaymentProcessing": "payment_processing",
            "HALInterface": "hal_interface",
            "NotificationEngine": "notification_engine",
            "UIRenderer": "ui_renderer",
            "DataValidation": "data_validation",
            "AnalyticsEngine": "analytics_engine",
            "ComplianceEngine": "compliance_engine",
        }
        
        # Collect code from required primitives
        for name in primitive_names:
            if name in name_to_file:
                file_name = name_to_file[name] + ".py"
                file_path = self.primitives_dir / file_name
                
                if file_path.exists():
                    with open(file_path) as f:
                        content = f.read()
                    
                    # Remove imports that won't work in browser
                    content = self._sanitize_for_browser(content)
                    code_parts.append(f"\n# === {name} ===\n")
                    code_parts.append(content)
        
        return "\n".join(code_parts)
    
    def _sanitize_for_browser(self, code: str) -> str:
        """Remove/modify code that won't work in browser"""
        lines = code.split("\n")
        sanitized = []
        
        skip_imports = [
            "import requests",
            "import africastalking",
            "import cv2",
            "from pyzbar",
            "import smtplib",
            "from cryptography",
        ]
        
        for line in lines:
            # Skip problematic imports
            if any(imp in line for imp in skip_imports):
                sanitized.append(f"# BROWSER_SKIP: {line}")
                continue
            
            # Replace requests with fetch placeholder
            if "requests.get" in line or "requests.post" in line:
                sanitized.append(f"# BROWSER_FETCH: {line}")
                continue
            
            sanitized.append(line)
        
        return "\n".join(sanitized)
    
    def _generate_loader(self, manifest: Dict) -> str:
        """Generate JavaScript loader for Pyodide"""
        module_id = manifest["id"]
        
        return f'''/**
 * WASM Bundle Loader for {manifest["name"]}
 * Auto-generated - do not edit manually
 */

const MODULE_ID = "{module_id}";
const MODULE_VERSION = "{manifest.get("version", "1.0.0")}";

class AlienModuleLoader {{
    constructor() {{
        this.pyodide = null;
        this.loaded = false;
    }}

    async init() {{
        if (this.pyodide) return;
        
        // Load Pyodide
        this.pyodide = await loadPyodide({{
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/"
        }});
        
        // Load required packages
        const packages = await (await fetch('./packages.json')).json();
        await this.pyodide.loadPackage(packages.packages);
        
        // Load primitives
        const primitivesCode = await (await fetch('./primitives.py')).text();
        await this.pyodide.runPythonAsync(primitivesCode);
        
        this.loaded = true;
        console.log(`Module ${{MODULE_ID}} v${{MODULE_VERSION}} loaded`);
    }}

    async execute(inputs) {{
        if (!this.loaded) await this.init();
        
        // Prepare inputs
        this.pyodide.globals.set('_inputs', JSON.stringify(inputs));
        
        // Execute module chain
        const result = await this.pyodide.runPythonAsync(`
import json

inputs = json.loads(_inputs)
result = {{"success": True, "outputs": {{}}}}

# Execute primitive chain
manifest = ${{JSON.stringify(manifest.primitives || [])}}

current_data = inputs
for prim in manifest:
    module_name = prim.get("module")
    method_name = prim.get("method")
    config = prim.get("config", {{}})
    
    # Get primitive class
    primitive_class = globals().get(module_name)
    if primitive_class:
        instance = primitive_class()
        method = getattr(instance, method_name, None)
        if method:
            args = {{**config, **current_data}}
            current_data = method(**args)

result["outputs"] = current_data
json.dumps(result)
        `);
        
        return JSON.parse(result);
    }}

    async getUI() {{
        // Load UI definition
        try {{
            return await (await fetch('./ui.marimo')).text();
        }} catch {{
            return null;
        }}
    }}
}}

// Export for use
window.AlienModuleLoader = AlienModuleLoader;
window.alienModule = new AlienModuleLoader();
'''
    
    def _get_required_packages(self, manifest: Dict) -> List[str]:
        """Determine which Pyodide packages are needed"""
        packages = ["micropip"]  # Always need this
        
        primitives = manifest.get("primitives", [])
        primitive_names = [p.get("module", "") for p in primitives]
        
        # Map primitives to packages
        primitive_packages = {
            "DocumentIntelligence": ["Pillow"],
            "DataIngestion": ["pandas"],
            "MLEngine": ["numpy", "pandas", "scikit-learn"],
            "ReportGeneration": ["Pillow", "reportlab"],
            "ChatbotEngine": [],
            "AnalyticsEngine": ["pandas", "numpy"],
            "DataValidation": ["pydantic"],
        }
        
        for name in primitive_names:
            if name in primitive_packages:
                packages.extend(primitive_packages[name])
        
        return list(set(packages))
    
    def create_offline_bundle(
        self,
        module_dir: str,
        output_path: str = None,
    ) -> Dict[str, Any]:
        """
        Create a fully offline bundle with all dependencies
        """
        # First create the WASM bundle
        with tempfile.TemporaryDirectory() as temp_dir:
            result = self.bundle(module_dir, temp_dir)
            
            if not result["success"]:
                return result
            
            bundle_path = Path(result["output_path"])
            
            # Determine output
            if not output_path:
                manifest_path = Path(module_dir) / "manifest.json"
                with open(manifest_path) as f:
                    manifest = json.load(f)
                output_path = Path(module_dir).parent / f"{manifest['id']}.offline.zip"
            
            # Create zip with all files
            with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for file_path in bundle_path.rglob("*"):
                    if file_path.is_file():
                        arcname = file_path.relative_to(bundle_path)
                        zf.write(file_path, arcname)
        
        return {
            "success": True,
            "output_path": str(output_path),
            "type": "offline_bundle",
        }
