"""
Module Manifest Schema
Defines the structure of a module package manifest.json
"""

from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class ExecutionMode(str, Enum):
    SERVER = "server"
    BROWSER = "browser"
    HYBRID = "hybrid"


class LicenseType(str, Enum):
    PREVIEW = "preview"
    LEASE = "lease"
    PURCHASE = "purchase"
    FREE = "free"


class Category(str, Enum):
    CHURCH = "church"
    SCHOOL = "school"
    HEALTHCARE = "healthcare"
    RETAIL = "retail"
    BUSINESS = "business"
    SECURITY = "security"
    ANALYTICS = "analytics"
    NETWORK = "network"
    EVENTS = "events"
    COMPLIANCE = "compliance"


class PrimitiveRef(BaseModel):
    """Reference to a master primitive and its configuration"""
    module: str = Field(..., description="Primitive name, e.g., 'DocumentIntelligence'")
    method: str = Field(..., description="Method to call, e.g., 'extract_text'")
    config: Optional[Dict[str, Any]] = Field(default=None, description="Static configuration")
    input_mapping: Optional[Dict[str, str]] = Field(default=None, description="Map previous outputs to inputs")


class UIField(BaseModel):
    """Form field definition for the UI"""
    name: str
    type: Literal["text", "number", "email", "file", "select", "checkbox", "date", "textarea"]
    label: str
    required: bool = False
    default: Optional[Any] = None
    options: Optional[List[str]] = None  # For select fields
    accept: Optional[str] = None  # For file fields, e.g., ".pdf,.docx"


class UIDefinition(BaseModel):
    """UI definition for the module"""
    form_fields: List[UIField] = []
    output_type: Literal["table", "chart", "pdf", "text", "download", "dashboard"] = "text"
    theme: Optional[str] = None


class Pricing(BaseModel):
    """Module pricing configuration"""
    license_type: LicenseType = LicenseType.LEASE
    price: float = 0.0
    currency: str = "KES"
    preview_days: int = 7
    preview_executions: int = 100


class Requirements(BaseModel):
    """System requirements for the module"""
    requires_hal: bool = False  # NFC, biometrics, GPIO
    requires_gpu: bool = False  # CUDA for ML models
    min_memory_mb: int = 256
    compatible_auras: List[str] = ["default"]
    python_packages: List[str] = []
    wasm_compatible: bool = True  # Can run in browser via Pyodide


class Author(BaseModel):
    """Module author information"""
    name: str
    email: Optional[str] = None
    organization: Optional[str] = None
    website: Optional[str] = None


class ModuleManifest(BaseModel):
    """
    Complete module manifest schema
    This is the manifest.json that defines a packaged module
    """
    # Identification
    id: str = Field(..., description="Unique module ID, e.g., 'church-archive-digitizer'")
    name: str = Field(..., description="Display name")
    version: str = Field(default="1.0.0", description="Semantic version")
    description: str = Field(..., description="Short description for marketplace")
    long_description: Optional[str] = Field(default=None, description="Detailed markdown description")
    
    # Classification
    category: Category
    tags: List[str] = []
    
    # Execution
    execution_mode: ExecutionMode = ExecutionMode.HYBRID
    primitives: List[PrimitiveRef] = Field(..., description="Ordered list of primitives to chain")
    
    # UI
    ui: UIDefinition = Field(default_factory=UIDefinition)
    icon: Optional[str] = None  # Path to icon file or data URI
    screenshots: List[str] = []  # Paths to screenshot files
    
    # Pricing
    pricing: Pricing = Field(default_factory=Pricing)
    
    # Requirements
    requirements: Requirements = Field(default_factory=Requirements)
    
    # Author
    author: Author
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    # Files
    files: Dict[str, str] = Field(
        default_factory=dict,
        description="Map of file types to paths, e.g., {'ui': 'ui.marimo', 'config': 'config.yaml'}"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "church-archive-digitizer",
                "name": "Church Archive Digitizer",
                "version": "1.0.0",
                "description": "Convert handwritten ledgers into searchable digital archives",
                "category": "church",
                "tags": ["ocr", "pdf", "archive"],
                "execution_mode": "hybrid",
                "primitives": [
                    {"module": "DocumentIntelligence", "method": "extract_text", "config": {"ocr_size": "gundam"}},
                    {"module": "ReportGeneration", "method": "generate_pdf", "config": {"template": "church_ledger"}}
                ],
                "ui": {
                    "form_fields": [
                        {"name": "pdf_file", "type": "file", "label": "Upload Ledger PDF", "required": True, "accept": ".pdf"}
                    ],
                    "output_type": "download"
                },
                "pricing": {
                    "license_type": "purchase",
                    "price": 299,
                    "currency": "KES"
                },
                "author": {
                    "name": "AlienNet",
                    "organization": "AlienNet Ltd"
                }
            }
        }


def create_example_manifest() -> ModuleManifest:
    """Create an example manifest for reference"""
    return ModuleManifest(
        id="church-archive-digitizer",
        name="Church Archive Digitizer",
        description="Convert handwritten ledgers into searchable digital archives using AI-powered OCR.",
        category=Category.CHURCH,
        tags=["ocr", "pdf", "church", "archive"],
        execution_mode=ExecutionMode.HYBRID,
        primitives=[
            PrimitiveRef(
                module="DocumentIntelligence",
                method="extract_text",
                config={"ocr_size": "gundam"},
            ),
            PrimitiveRef(
                module="ReportGeneration",
                method="generate_pdf",
                config={"template": "church_ledger"},
                input_mapping={"data": "content"},
            ),
        ],
        ui=UIDefinition(
            form_fields=[
                UIField(name="pdf_file", type="file", label="Upload Ledger PDF", required=True, accept=".pdf"),
                UIField(name="year", type="number", label="Ledger Year", required=False),
            ],
            output_type="download",
        ),
        pricing=Pricing(
            license_type=LicenseType.PURCHASE,
            price=299,
            currency="KES",
        ),
        requirements=Requirements(
            requires_hal=False,
            requires_gpu=False,
            wasm_compatible=True,
        ),
        author=Author(
            name="AlienNet",
            organization="AlienNet Ltd",
        ),
    )


if __name__ == "__main__":
    # Generate example manifest
    import json
    manifest = create_example_manifest()
    print(json.dumps(manifest.model_dump(), indent=2, default=str))
