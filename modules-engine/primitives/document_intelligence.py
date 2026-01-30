"""
Document Intelligence Primitive
Handles OCR, PDF parsing, and document extraction using DeepSeek OCR / PDF Craft
"""

import os
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional


class DocumentIntelligence:
    """Master primitive for document processing (OCR, PDF extraction, classification)"""
    
    def __init__(self, ocr_size: str = "gundam", local_only: bool = True):
        self.ocr_size = ocr_size
        self.local_only = local_only
    
    def extract_text(self, pdf_bytes: bytes = None, pdf_path: str = None, **kwargs) -> Dict[str, Any]:
        """
        Extract text from PDF using PyMuPDF (Lightweight)
        Returns structured content
        """
        try:
            import fitz
            
            # Handle input
            if pdf_bytes:
                temp_file = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
                temp_file.write(pdf_bytes)
                temp_file.close()
                pdf_path = temp_file.name
            
            if not pdf_path:
                return {"error": "No PDF provided", "success": False}
            
            # Run extraction using fitz
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            
            # Clean up temp file if created
            if pdf_bytes and os.path.exists(pdf_path):
                os.remove(pdf_path)

            return {
                "success": True,
                "content": text,
                "method": "pymupdf_lightweight"
            }
            
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def extract_tables(self, pdf_bytes: bytes = None, pdf_path: str = None, **kwargs) -> Dict[str, Any]:
        """Extract tables from PDF as structured data"""
        try:
            # Use PDF Craft with table focus
            result = self.extract_text(pdf_bytes=pdf_bytes, pdf_path=pdf_path)
            
            if not result.get("success"):
                return result
            
            # Parse markdown tables
            content = result.get("content", "")
            tables = self._parse_markdown_tables(content)
            
            return {
                "success": True,
                "tables": tables,
                "raw_content": content,
            }
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def extract_forms(self, pdf_bytes: bytes = None, pdf_path: str = None, **kwargs) -> Dict[str, Any]:
        """Extract form fields from PDF"""
        # Form extraction logic
        result = self.extract_text(pdf_bytes=pdf_bytes, pdf_path=pdf_path)
        
        if not result.get("success"):
            return result
        
        # Simple key-value extraction
        content = result.get("content", "")
        fields = self._extract_form_fields(content)
        
        return {
            "success": True,
            "fields": fields,
        }
    
    def classify_document(self, content: str = None, **kwargs) -> Dict[str, Any]:
        """Classify document type (invoice, receipt, contract, etc.)"""
        if not content:
            return {"error": "No content provided", "success": False}
        
        # Simple keyword-based classification with dynamic confidence
        content_lower = content.lower()
        
        categories = {
            "invoice": ["invoice", "bill to", "total due", "purchase order", "amount due"],
            "receipt": ["receipt", "total paid", "change due", "thank you", "cashier"],
            "contract": ["agreement", "hereby", "parties", "terms and conditions", "signature"],
            "church_ledger": ["tithe", "offering", "church", "pastor", "ministry"],
            "academic": ["student", "grade", "exam", "transcript", "admission"]
        }
        
        doc_type = "unknown"
        max_matches = 0
        
        for cat, keywords in categories.items():
            matches = sum(1 for word in keywords if word in content_lower)
            if matches > max_matches:
                max_matches = matches
                doc_type = cat
        
        # Calculate confidence based on matches (normalized)
        confidence = min(0.95, max_matches * 0.25) if max_matches > 0 else 0.1
        
        return {
            "success": True,
            "document_type": doc_type,
            "confidence": round(confidence, 2),
            "content": content
        }
    
    def _parse_markdown_tables(self, content: str) -> list:
        """Parse markdown tables into list of dicts"""
        tables = []
        # Simple table detection (can be enhanced)
        lines = content.split("\n")
        current_table = []
        in_table = False
        
        for line in lines:
            if "|" in line:
                in_table = True
                current_table.append(line)
            elif in_table:
                if current_table:
                    tables.append(self._parse_single_table(current_table))
                current_table = []
                in_table = False
        
        return tables
    
    def _parse_single_table(self, lines: list) -> Dict[str, Any]:
        """Parse a single markdown table"""
        if len(lines) < 2:
            return {"rows": []}
        
        # Parse header
        header = [cell.strip() for cell in lines[0].split("|") if cell.strip()]
        
        # Parse rows (skip separator line)
        rows = []
        for line in lines[2:]:
            cells = [cell.strip() for cell in line.split("|") if cell.strip()]
            if len(cells) == len(header):
                rows.append(dict(zip(header, cells)))
        
        return {"headers": header, "rows": rows}
    
    def _extract_form_fields(self, content: str) -> Dict[str, str]:
        """Extract key-value pairs that look like form fields"""
        fields = {}
        lines = content.split("\n")
        
        for line in lines:
            if ":" in line:
                parts = line.split(":", 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    if key and value and len(key) < 50:
                        fields[key] = value
        
        return fields
    
    def perform_ocr(self, pdf_bytes: bytes = None, pdf_path: str = None, img_bytes: bytes = None, **kwargs) -> Dict[str, Any]:
        """
        Perform OCR using RapidOCR (ONNX).
        Includes 'Smart Sort' to reconstruct reading order (Surya-like behavior).
        """
        try:
            from rapidocr_onnxruntime import RapidOCR
            import fitz # PyMuPDF for rendering PDF to image
            import numpy as np
            import cv2
            
            # Initialize engine (instantiating here for safety, in prod cache this)
            engine = RapidOCR()
            
            images = []
            
            # 1. Convert Input to Images
            if pdf_bytes or pdf_path:
                if pdf_bytes:
                    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
                else:
                    doc = fitz.open(pdf_path)
                
                for page in doc:
                    pix = page.get_pixmap(dpi=200) # 200 DPI is good balance
                    # Convert to numpy array for OpenCV/RapidOCR
                    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.h, pix.w, pix.n)
                    if pix.n == 4: # RGBA -> RGB
                        img_data = cv2.cvtColor(img_data, cv2.COLOR_RGBA2RGB)
                    images.append(img_data)
                doc.close()
                
            elif img_bytes:
                 # Decode image bytes
                 nparr = np.frombuffer(img_bytes, np.uint8)
                 img_data = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                 images.append(img_data)
            else:
                return {"success": False, "error": "No input provided"}

            final_text = ""
            pages_data = []

            # 2. Run OCR on each page
            for i, img in enumerate(images):
                result, elapse = engine(img)
                if not result:
                    continue
                
                # result follows: [[coords], text, confidence]
                # Coords: [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
                
                # 3. Smart Sort (The "Buff")
                # Sort boxes by Y (top to bottom), then X (left to right) with tolerance
                # This mimics human reading order better than raw output
                sorted_res = self._smart_sort_ocr(result)
                
                page_text = "\n".join([line[1] for line in sorted_res])
                final_text += f"\n--- Page {i+1} ---\n{page_text}"
                
                pages_data.append({
                    "page": i + 1,
                    "text": page_text,
                    "blocks": [
                        {"text": r[1], "confidence": float(r[2]), "box": r[0]} 
                        for r in sorted_res
                    ]
                })

            return {
                "success": True,
                "content": final_text.strip(),
                "pages": pages_data,
                "method": "rapidocr_onnx",
                "engine": "RapidOCR"
            }

        except Exception as e:
            return {"success": False, "error": str(e)}

    def _smart_sort_ocr(self, dt_boxes, tolerance=10):
        """
        Sort OCR result boxes by reading order (Top->Bottom, Left->Right).
        Y-tolerance allows handling slightly skewed lines.
        """
        # Calculate centroids and standard bounds
        boxes = []
        for item in dt_boxes:
            box = item[0]
            # y_min of the box
            y_min = min(p[1] for p in box)
            boxes.append({"data": item, "y": y_min, "x": min(p[0] for p in box)})
            
        # Sort primarily by Y
        boxes.sort(key=lambda b: b["y"])
        
        # Group by lines (using tolerance)
        lines = []
        current_line = []
        if boxes:
            current_line.append(boxes[0])
            last_y = boxes[0]["y"]
            
            for box in boxes[1:]:
                if abs(box["y"] - last_y) < tolerance:
                    current_line.append(box)
                else:
                    # New line starts, sort previous line by X
                    current_line.sort(key=lambda b: b["x"])
                    lines.extend(current_line)
                    current_line = [box]
                    last_y = box["y"]
            
            # Flush last line
            if current_line:
                current_line.sort(key=lambda b: b["x"])
                lines.extend(current_line)
                
        return [l["data"] for l in lines]
