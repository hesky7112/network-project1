import sys
sys.path.append("c:/Users/BISHOP/Desktop/networking-main1/modules-engine")

from primitives.super_compute import SuperCompute
from primitives.workflow_orchestrator import WorkflowOrchestrator
import time

def main():
    print("--- Starting Connection Test ---")

    # 1. Setup the Brain (SuperCompute)
    brain = SuperCompute()
    
    # 2. Setup the Hands (Workflow)
    hands = WorkflowOrchestrator()
    
    # Define a simple task for the hands to do
    def printer(trigger_data, **kwargs):
        print(f"!!! HANDS ACTIVATED !!!")
        print(f"Received from Brain: {trigger_data.get('findings')}")
        return {"status": "Handled"}

    workflow_steps = [{
        "name": "print_alert",
        "primitive": printer
    }]

    # 3. Connect them
    print("Connecting Hands to Brain...")
    hands.listen_to_nexus("data_insight", workflow_steps)

    # 4. Trigger the Brain
    print("Brain is thinking...")
    # This will trigger 'auto_insight' which emits to Nexus
    # We use a dummy CSV create for the test
    with open("test.csv", "w") as f:
        f.write("col1,col2\n1,2\n3,4")
        
    brain.auto_insight("test.csv")
    
    print("--- Test Complete ---")

if __name__ == "__main__":
    main()
