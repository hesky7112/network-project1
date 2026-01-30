"""
UI Renderer Primitive
Marimo widget generation for mini-apps
"""

from typing import Dict, Any, List, Optional


class UIRenderer:
    """Master primitive for generating Marimo UI components"""
    
    def __init__(self):
        pass
    
    def render_form(
        self,
        fields: List[Dict],
        submit_label: str = "Submit",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate form definition for Marimo"""
        form_fields = []
        
        for field in fields:
            field_type = field.get("type", "text")
            field_name = field.get("name", "field")
            field_label = field.get("label", field_name.title())
            
            marimo_widget = self._map_field_to_widget(field_type, field)
            
            form_fields.append({
                "name": field_name,
                "label": field_label,
                "widget": marimo_widget,
                "required": field.get("required", False),
                "default": field.get("default"),
            })
        
        return {
            "success": True,
            "form_type": "marimo_form",
            "fields": form_fields,
            "submit_label": submit_label,
        }
    
    def render_table(
        self,
        data: List[Dict],
        columns: List[str] = None,
        sortable: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate table definition for Marimo"""
        if not data:
            return {"success": True, "table_type": "marimo_table", "data": [], "columns": []}
        
        if not columns:
            columns = list(data[0].keys())
        
        return {
            "success": True,
            "table_type": "marimo_table",
            "data": data,
            "columns": columns,
            "sortable": sortable,
            "row_count": len(data),
        }
    
    def render_chart(
        self,
        data: Dict[str, Any],
        chart_type: str = "bar",
        x_axis: str = None,
        y_axis: str = None,
        title: str = "Chart",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chart definition for Marimo (using Plotly/Altair)"""
        return {
            "success": True,
            "chart_type": chart_type,
            "data": data,
            "config": {
                "x_axis": x_axis,
                "y_axis": y_axis,
                "title": title,
            },
        }
    
    def render_file_upload(
        self,
        accept: str = "*",
        multiple: bool = False,
        label: str = "Upload File",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate file upload widget"""
        return {
            "success": True,
            "widget_type": "file_upload",
            "accept": accept,
            "multiple": multiple,
            "label": label,
        }
    
    def render_dashboard(
        self,
        widgets: List[Dict],
        layout: str = "grid",
        columns: int = 2,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate dashboard layout with multiple widgets"""
        return {
            "success": True,
            "dashboard_type": "marimo_dashboard",
            "layout": layout,
            "columns": columns,
            "widgets": widgets,
        }
    
    def render_metric_card(
        self,
        title: str,
        value: Any,
        change: float = None,
        icon: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate metric/KPI card"""
        return {
            "success": True,
            "widget_type": "metric_card",
            "title": title,
            "value": value,
            "change": change,
            "change_direction": "up" if change and change > 0 else "down" if change else None,
            "icon": icon,
        }
    
    def render_progress_bar(
        self,
        value: float,
        max_value: float = 100,
        label: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate progress bar"""
        percentage = (value / max_value) * 100 if max_value else 0
        
        return {
            "success": True,
            "widget_type": "progress_bar",
            "value": value,
            "max_value": max_value,
            "percentage": percentage,
            "label": label or f"{percentage:.1f}%",
        }
    
    def render_alert(
        self,
        message: str,
        type: str = "info",
        dismissible: bool = True,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate alert/notification"""
        return {
            "success": True,
            "widget_type": "alert",
            "message": message,
            "alert_type": type,  # info, success, warning, error
            "dismissible": dismissible,
        }
    
    def render_tabs(
        self,
        tabs: List[Dict],
        **kwargs
    ) -> Dict[str, Any]:
        """Generate tabbed interface"""
        return {
            "success": True,
            "widget_type": "tabs",
            "tabs": tabs,  # [{label: "Tab 1", content: {...}}, ...]
        }
    
    def render_react_schema(
        self,
        component_type: str,
        props: Dict[str, Any],
        **kwargs
    ) -> Dict[str, Any]:
        """Generate a React-friendly JSON schema for rendering results"""
        return {
            "success": True,
            "component_type": component_type,
            "props": props,
            "metadata": kwargs
        }

    def generate_marimo_code(
        self,
        widgets: List[Dict],
        **kwargs
    ) -> Dict[str, Any]:
        """Generate actual Marimo Python code from widget definitions"""
        code_lines = [
            "import marimo as mo",
            "",
        ]
        
        for i, widget in enumerate(widgets):
            widget_type = widget.get("widget_type", "text")
            var_name = f"widget_{i}"
            
            if widget_type == "file_upload":
                code_lines.append(
                    f'{var_name} = mo.ui.file_upload(label="{widget.get("label", "Upload")}")'
                )
            elif widget_type == "text_input":
                code_lines.append(
                    f'{var_name} = mo.ui.text(label="{widget.get("label", "Input")}")'
                )
            elif widget_type == "dropdown":
                options = widget.get("options", [])
                code_lines.append(
                    f'{var_name} = mo.ui.dropdown(options={options})'
                )
            elif widget_type == "button":
                code_lines.append(
                    f'{var_name} = mo.ui.button(label="{widget.get("label", "Submit")}")'
                )
        
        return {
            "success": True,
            "code": "\n".join(code_lines),
        }
    
    def _map_field_to_widget(self, field_type: str, field: Dict) -> str:
        """Map form field type to Marimo widget"""
        widget_map = {
            "text": "mo.ui.text",
            "number": "mo.ui.number",
            "email": "mo.ui.text",
            "password": "mo.ui.text",
            "textarea": "mo.ui.text_area",
            "select": "mo.ui.dropdown",
            "checkbox": "mo.ui.checkbox",
            "date": "mo.ui.date",
            "file": "mo.ui.file_upload",
            "slider": "mo.ui.slider",
        }
        
        return widget_map.get(field_type, "mo.ui.text")
