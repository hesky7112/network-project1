"""
Report Generation Primitive
PDF, Excel, CSV, QR code, and barcode generation
"""

import os
import tempfile
from typing import Dict, Any, List, Optional
from datetime import datetime
import io


class ReportGeneration:
    """Master primitive for report creation (PDF, Excel, CSV, QR, Barcode)"""
    
    def __init__(self):
        self.output_dir = os.getenv("REPORTS_OUTPUT_DIR", tempfile.gettempdir())
    
    def generate_pdf(
        self,
        data: Dict[str, Any],
        template: str = "default",
        title: str = "Report",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate PDF report with charts and tables"""
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.units import inch
            
            # Create output path
            output_path = os.path.join(
                self.output_dir, 
                f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            )
            
            doc = SimpleDocTemplate(output_path, pagesize=A4)
            styles = getSampleStyleSheet()
            elements = []
            
            # Title
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                spaceAfter=30,
            )
            elements.append(Paragraph(title, title_style))
            elements.append(Spacer(1, 12))
            
            # Add template-specific content
            if template == "church_ledger":
                elements.extend(self._church_ledger_content(data, styles))
            elif template == "tax_return":
                elements.extend(self._tax_return_content(data, styles))
            elif template == "medical_report":
                elements.extend(self._medical_report_content(data, styles))
            else:
                elements.extend(self._default_content(data, styles))
            
            # Build PDF
            doc.build(elements)
            
            return {
                "success": True,
                "output_file": output_path,
                "template": template,
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_excel(
        self,
        data: List[Dict],
        filename: str = None,
        sheet_name: str = "Sheet1",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate Excel file from data"""
        try:
            import pandas as pd
            
            df = pd.DataFrame(data)
            
            output_path = os.path.join(
                self.output_dir,
                filename or f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            )
            
            df.to_excel(output_path, sheet_name=sheet_name, index=False)
            
            return {
                "success": True,
                "output_file": output_path,
                "row_count": len(df),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_csv(
        self,
        data: List[Dict],
        filename: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate CSV file from data"""
        try:
            import pandas as pd
            
            df = pd.DataFrame(data)
            
            output_path = os.path.join(
                self.output_dir,
                filename or f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            )
            
            df.to_csv(output_path, index=False)
            
            return {
                "success": True,
                "output_file": output_path,
                "row_count": len(df),
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_qr_code(
        self,
        data: str,
        filename: str = None,
        size: int = 10,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate QR code image"""
        try:
            import qrcode
            
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=size,
                border=4,
            )
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            
            output_path = os.path.join(
                self.output_dir,
                filename or f"qr_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            )
            
            img.save(output_path)
            
            return {
                "success": True,
                "output_file": output_path,
                "data_encoded": data,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_barcode(
        self,
        data: str,
        format: str = "CODE128",
        filename: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate barcode image"""
        try:
            import barcode
            from barcode.writer import ImageWriter
            
            barcode_class = barcode.get_barcode_class(format.lower())
            
            output_path = os.path.join(
                self.output_dir,
                filename or f"barcode_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            )
            
            bc = barcode_class(data, writer=ImageWriter())
            saved_path = bc.save(output_path)
            
            return {
                "success": True,
                "output_file": saved_path,
                "format": format,
                "data_encoded": data,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_chart(
        self,
        data: Dict[str, Any],
        chart_type: str = "bar",
        title: str = "Chart",
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chart image using Plotly"""
        try:
            import plotly.express as px
            import pandas as pd
            
            df = pd.DataFrame(data)
            
            if chart_type == "bar":
                fig = px.bar(df, title=title)
            elif chart_type == "line":
                fig = px.line(df, title=title)
            elif chart_type == "pie":
                fig = px.pie(df, title=title)
            elif chart_type == "scatter":
                fig = px.scatter(df, title=title)
            else:
                fig = px.bar(df, title=title)
            
            output_path = os.path.join(
                self.output_dir,
                f"chart_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            )
            
            fig.write_image(output_path)
            
            return {
                "success": True,
                "output_file": output_path,
                "chart_type": chart_type,
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # Template-specific content generators
    def _church_ledger_content(self, data: Dict, styles) -> List:
        """Generate church ledger specific content"""
        from reportlab.platypus import Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        
        elements = []
        
        # Summary
        elements.append(Paragraph("Offering Summary", styles["Heading2"]))
        elements.append(Spacer(1, 12))
        
        if "transactions" in data:
            table_data = [["Date", "Type", "Amount", "Method"]]
            for t in data["transactions"][:20]:  # Limit to 20
                table_data.append([
                    t.get("date", ""),
                    t.get("type", ""),
                    f"KES {t.get('amount', 0):,.2f}",
                    t.get("method", ""),
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table)
        
        return elements
    
    def _tax_return_content(self, data: Dict, styles) -> List:
        """Generate tax return specific content"""
        from reportlab.platypus import Paragraph, Spacer
        
        elements = []
        elements.append(Paragraph("Tax Return Summary", styles["Heading2"]))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"PIN: {data.get('pin', 'N/A')}", styles["Normal"]))
        elements.append(Paragraph(f"Period: {data.get('period', 'N/A')}", styles["Normal"]))
        return elements
    
    def _medical_report_content(self, data: Dict, styles) -> List:
        """Generate medical report specific content"""
        from reportlab.platypus import Paragraph, Spacer
        
        elements = []
        elements.append(Paragraph("Medical Analysis Report", styles["Heading2"]))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(f"Findings: {data.get('findings', 'No findings')}", styles["Normal"]))
        elements.append(Paragraph(f"Confidence: {data.get('confidence', 0):.1%}", styles["Normal"]))
        return elements
    
    def _default_content(self, data: Dict, styles) -> List:
        """Generate default report content"""
        from reportlab.platypus import Paragraph, Spacer
        
        elements = []
        elements.append(Paragraph("Report Data", styles["Heading2"]))
        elements.append(Spacer(1, 12))
        
        for key, value in data.items():
            elements.append(Paragraph(f"<b>{key}:</b> {value}", styles["Normal"]))
            elements.append(Spacer(1, 6))
        
        return elements
