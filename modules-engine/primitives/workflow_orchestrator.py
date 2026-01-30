"""
Workflow Orchestrator Primitive
Chain primitives together for complex workflows
"""

from typing import Dict, Any, List, Callable, Optional


class WorkflowOrchestrator:
    """Master primitive for chaining primitives into workflows"""
    
    def __init__(self):
        self.steps = []
        self.results = {}
    
    def add_step(
        self,
        name: str,
        primitive: Callable,
        config: Dict = None,
        depends_on: List[str] = None,
    ):
        """Add a step to the workflow"""
        self.steps.append({
            "name": name,
            "primitive": primitive,
            "config": config or {},
            "depends_on": depends_on or [],
        })
    
    def execute(
        self,
        input_data: Dict[str, Any],
        steps: List[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute all steps sequentially"""
        try:
            result = input_data.copy()
            step_results = {}
            
            workflow_steps = steps or self.steps
            
            for step in workflow_steps:
                step_name = step.get("name", "unnamed")
                primitive = step.get("primitive")
                config = step.get("config", {})
                
                # Merge config with current result
                args = {**config, **result}
                
                # Execute step
                if callable(primitive):
                    step_result = primitive(**args)
                elif isinstance(primitive, str):
                    # Lazy load primitive
                    step_result = self._execute_primitive(primitive, step.get("method", ""), args)
                else:
                    step_result = {"error": f"Invalid primitive for step {step_name}"}
                
                step_results[step_name] = step_result
                
                # Update result for next step
                if isinstance(step_result, dict):
                    result.update(step_result)
            
            return {
                "success": True,
                "final_result": result,
                "step_results": step_results,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def execute_parallel(
        self,
        input_data: Dict[str, Any],
        steps: List[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Execute independent steps in parallel"""
        import concurrent.futures
        
        try:
            workflow_steps = steps or self.steps
            step_results = {}
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = {}
                
                for step in workflow_steps:
                    step_name = step.get("name", "unnamed")
                    primitive = step.get("primitive")
                    config = step.get("config", {})
                    
                    args = {**config, **input_data}
                    
                    if callable(primitive):
                        futures[step_name] = executor.submit(primitive, **args)
                
                for step_name, future in futures.items():
                    try:
                        step_results[step_name] = future.result(timeout=60)
                    except Exception as e:
                        step_results[step_name] = {"error": str(e)}
            
            return {
                "success": True,
                "step_results": step_results,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def execute_conditional(
        self,
        input_data: Dict[str, Any],
        condition_field: str,
        branches: Dict[str, List[Dict]],
        **kwargs
    ) -> Dict[str, Any]:
        """Execute different branches based on condition"""
        try:
            condition_value = input_data.get(condition_field)
            
            if condition_value in branches:
                return self.execute(input_data, steps=branches[condition_value])
            elif "default" in branches:
                return self.execute(input_data, steps=branches["default"])
            else:
                return {"success": False, "error": f"No branch for condition: {condition_value}"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def execute_loop(
        self,
        items: List[Any],
        steps: List[Dict],
        **kwargs
    ) -> Dict[str, Any]:
        """Execute steps for each item in a list"""
        try:
            results = []
            
            for i, item in enumerate(items):
                input_data = {"item": item, "index": i}
                result = self.execute(input_data, steps=steps)
                results.append(result)
            
            return {
                "success": True,
                "results": results,
                "item_count": len(items),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _execute_primitive(self, module_name: str, method_name: str, args: Dict) -> Dict:
        """Dynamically load and execute a primitive"""
        try:
            # Import primitive module
            module = __import__(f"primitives.{module_name.lower()}", fromlist=[module_name])
            primitive_class = getattr(module, module_name)
            
            # Instantiate and call method
            instance = primitive_class()
            method = getattr(instance, method_name)
            
            return method(**args)
            
        except Exception as e:
            return {"error": str(e)}
    
    def clear(self):
        """Clear all steps"""
        self.steps = []
        self.results = {}
