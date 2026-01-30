"""
Modules Engine - Master Primitives Server
Handles execution of mini-app modules via FastAPI
"""

import json
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add primitives to path
sys.path.insert(0, str(Path(__file__).parent / "primitives"))

from primitives import (
    DocumentIntelligence,
    DataIngestion,
    MLEngine,
    ReportGeneration,
    ChatbotEngine,
    WorkflowOrchestrator,
    PaymentProcessing,
    HALInterface,
    NotificationEngine,
    UIRenderer,
    DataValidation,
    AnalyticsEngine,
    ComplianceEngine,
    Storage,
    Scheduler,
    Secrets,
)

app = FastAPI(
    title="Modules Engine",
    description="Mini-app spawning engine with 13 master primitives",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    print("--- REGISTERED ROUTES ---")
    for route in app.routes:
        print(f"{route.methods} {route.path}")
    print("-------------------------")

# Primitive registry
PRIMITIVES = {
    "DocumentIntelligence": DocumentIntelligence,
    "DataIngestion": DataIngestion,
    "MLEngine": MLEngine,
    "ReportGeneration": ReportGeneration,
    "ChatbotEngine": ChatbotEngine,
    "WorkflowOrchestrator": WorkflowOrchestrator,
    "PaymentProcessing": PaymentProcessing,
    "HALInterface": HALInterface,
    "NotificationEngine": NotificationEngine,
    "UIRenderer": UIRenderer,
    "DataValidation": DataValidation,
    "AnalyticsEngine": AnalyticsEngine,
    "ComplianceEngine": ComplianceEngine,
    "Storage": Storage,
    "Scheduler": Scheduler,
    "Secrets": Secrets,
}


class PrimitiveRef(BaseModel):
    module: str
    method: str
    config: Optional[Dict[str, Any]] = None


class ExecutionRequest(BaseModel):
    module_id: str
    user_id: Optional[int] = None
    token: Optional[str] = None
    primitives: list[PrimitiveRef]
    input: Dict[str, Any]


class ExecutionResponse(BaseModel):
    success: bool
    output: Dict[str, Any] = {}
    error: Optional[str] = None
    output_file: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "healthy", "primitives": list(PRIMITIVES.keys())}


@app.post("/execute", response_model=ExecutionResponse)
async def execute_module(req: ExecutionRequest):
    """Execute a module by chaining its primitives"""
    try:
        result = req.input
        output_file = None
        
        for prim in req.primitives:
            # Get primitive class
            if prim.module not in PRIMITIVES:
                raise ValueError(f"Unknown primitive: {prim.module}")
            
            primitive_class = PRIMITIVES[prim.module]
            
            # Inject context (token is critical for Secrets/Storage)
            context = {
                "module_id": req.module_id,
                "user_id": req.user_id,
                "token": req.token,
            }
            # Instantiate with context if supported, else empty
            try:
                primitive = primitive_class(context=context)
            except TypeError:
                # Fallback for legacy primitives without context param
                primitive = primitive_class()
            
            # Get method
            if not hasattr(primitive, prim.method):
                raise ValueError(f"Unknown method: {prim.module}.{prim.method}")
            
            method = getattr(primitive, prim.method)
            
            # Merge config with result
            config = prim.config or {}
            args = {**config, **result}
            
            # Execute
            result = method(**args)
            
            # Track output file if generated
            if isinstance(result, dict) and "output_file" in result:
                output_file = result["output_file"]
        
        return ExecutionResponse(
            success=True,
            output=result if isinstance(result, dict) else {"result": result},
            output_file=output_file,
        )
        
    except Exception as e:
        return ExecutionResponse(
            success=False,
            error=str(e),
        )


@app.get("/primitives")
async def list_primitives():
    """List all available primitives and their methods"""
    info = {}
    for name, cls in PRIMITIVES.items():
        methods = [m for m in dir(cls) if not m.startswith("_")]
        info[name] = {
            "description": cls.__doc__ or "",
            "methods": methods,
        }
    return info


@app.post("/active/export/wasm", response_model=ExecutionResponse)
async def export_wasm(req: ExecutionRequest):
    """Export a Marimo notebook to WASM HTML"""
    try:
        # Simplification: We'll accept the script content directly in input['script']
        script_content = req.input.get("script")
        if not script_content:
            return ExecutionResponse(success=False, error="No script provided")
            
        import tempfile
        import subprocess
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            f.write(script_content)
            temp_path = f.name
            
        output_path = temp_path + ".html"
        
        # Run marimo export
        cmd = ["marimo", "export", "html-wasm", temp_path, "--output", output_path, "--mode", "edit"]
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            return ExecutionResponse(success=False, error=f"Export failed: {result.stderr}")
            
        # Read HTML
        with open(output_path, 'r', encoding='utf-8') as f:
            html = f.read()
            
        # Cleanup
        try:
            os.remove(temp_path)
            os.remove(output_path)
        except:
            pass
        
        return ExecutionResponse(success=True, output={"html": html})
        
    except Exception as e:
        return ExecutionResponse(success=False, error=str(e))



if __name__ == "__main__":
    port = int(os.getenv("MODULES_ENGINE_PORT", 8081))
    uvicorn.run(app, host="0.0.0.0", port=port)
