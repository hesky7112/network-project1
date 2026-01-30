"""
Modules Engine - CLI Executor fallback
Used by Go Spawner to execute modules via subprocess
"""

import sys
import json
import os
from pathlib import Path

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

def execute():
    try:
        # Read request from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"success": False, "error": "No input provided"}))
            return

        req = json.loads(input_data)
        module_id = req.get("module_id")
        primitives_list = req.get("primitives", [])
        input_dict = req.get("input", {})

        result = input_dict
        output_file = None

        for prim in primitives_list:
            module_name = prim.get("module")
            method_name = prim.get("method")
            config = prim.get("config", {})

            if module_name not in PRIMITIVES:
                raise ValueError(f"Unknown primitive: {module_name}")

            primitive_class = PRIMITIVES[module_name]
            
            # Inject context
            context = {
                "module_id": module_id,
                "user_id": req.get("user_id"),
                "token": req.get("token"),
            }
            try:
                primitive = primitive_class(context=context)
            except TypeError:
                primitive = primitive_class()

            if not hasattr(primitive, method_name):
                raise ValueError(f"Unknown method: {module_name}.{method_name}")

            method = getattr(primitive, method_name)
            
            # Combine config and previous result
            args = {**config, **result}
            
            # Execute
            result = method(**args)

            if isinstance(result, dict) and "output_file" in result:
                output_file = result["output_file"]

        print(json.dumps({
            "success": True,
            "output": result if isinstance(result, dict) else {"result": result},
            "output_file": output_file
        }))

    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e)
        }))

if __name__ == "__main__":
    execute()
