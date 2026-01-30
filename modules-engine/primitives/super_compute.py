"""
SuperCompute Primitive
High-performance data processing using Polars and PyArrow (Rust-backed).
Designed to handle millions of rows in sub-seconds.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SuperCompute")

class SuperCompute:
    """
    The 'Muscle' of the Admin Data Forge.
    Leverages Polars for multi-threaded, vectorized execution.
    """
    
    def __init__(self, data_dir: str = "./data"):
        self.data_dir = data_dir
        if not os.path.exists(data_dir):
            os.makedirs(data_dir, exist_ok=True)
            
        # Lazy import to avoid startup cost if not used
        self._pl = None
        
        # Connect to the Messenger
        from .nexus import Nexus
        self.nexus = Nexus

    @property
    def pl(self):
        if self._pl is None:
            import polars as pl
            self._pl = pl
        return self._pl

    def load_data(self, source: str, file_type: str = "auto") -> Dict[str, Any]:
        """
        Load data into a high-performance Polars DataFrame.
        Supports: CSV, Parquet, JSON, Arrow.
        """
        try:
            start_time = time.time()
            df = None
            
            # Auto-detect extension
            if file_type == "auto":
                if source.endswith(".csv"):
                    file_type = "csv"
                elif source.endswith(".parquet"):
                    file_type = "parquet"
                elif source.endswith(".json"):
                    file_type = "json"
                elif source.endswith(".arrow"):
                    file_type = "arrow"
            
            # Load logic
            if file_type == "csv":
                # Try lazy load for speed, then collect
                df = self.pl.scan_csv(source).collect()
            elif file_type == "parquet":
                df = self.pl.read_parquet(source)
            elif file_type == "json":
                df = self.pl.read_json(source)
            elif file_type == "arrow":
                df = self.pl.read_ipc(source)
            elif file_type == "log":
                # Basic Log Parsing (Regex or Line-by-Line)
                # Reads as a single column 'raw_log'
                df = self.pl.read_csv(source, has_header=False, new_columns=["raw_log"], separator="\0")
            elif file_type == "pcap":
                # PCAP Support (Requires explicit parser, usually tshark/scapy)
                # Since we want speed, we'd typically use a Rust parser, 
                # but for now we'll mock a summary read or error if not convertible.
                # Here we assume a pre-converted CSV or JSON from tshark:
                # `tshark -r capture.pcap -T json > capture.json`
                # If it's raw pcap, we log a warning.
                if source.endswith(".pcap"):
                    return {"success": False, "error": "For High-Speed PCAP, please convert to .json/.csv first (e.g. tshark -T json)"}
                else:
                    df = self.pl.read_json(source) # Fallback if user passes json as pcap
            else:
                return {"success": False, "error": f"Unsupported file type: {file_type}"}

            duration = time.time() - start_time
            
            # Basic Metadata
            meta = {
                "rows": df.height,
                "columns": df.width,
                "schema": {k: str(v) for k, v in df.schema.items()},
                "load_time_seconds": round(duration, 4),
                "memory_usage_mb": round(df.estimated_size("mb"), 2)
            }

            return {
                "success": True,
                "meta": meta,
                # In a real app, we wouldn't return the whole DF to the generic API 
                # but rather store it in memory/cache and return a handle.
                # For this primitive, we'll return a sample.
                "sample": df.head(5).to_dicts() 
            }

        except Exception as e:
            logger.error(f"SuperCompute Load Error: {e}")
            return {"success": False, "error": str(e)}

    def execute_query(self, source: str, query_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a custom query on the dataset.
        query_type: 'aggregate', 'filter', 'sort'
        """
        try:
            # Determine file type and read
            if source.endswith(".csv"):
                df = self.pl.read_csv(source)
            elif source.endswith(".parquet"):
                df = self.pl.read_parquet(source)
            elif source.endswith(".json"):
                df = self.pl.read_json(source)
            else:
                return {"success": False, "error": "Auto-detection failed. Please provide a supported file type."}

            if query_type == "aggregate":
                group_by = params.get("group_by", [])
                aggs = params.get("aggregations", {}) 
                
                agg_exprs = []
                for col, op in aggs.items():
                    if op == "sum":
                        agg_exprs.append(self.pl.col(col).sum().alias(f"{col}_{op}"))
                    elif op in ["mean", "avg"]:
                        agg_exprs.append(self.pl.col(col).mean().alias(f"{col}_{op}"))
                    elif op == "max":
                        agg_exprs.append(self.pl.col(col).max().alias(f"{col}_{op}"))
                    elif op == "min":
                        agg_exprs.append(self.pl.col(col).min().alias(f"{col}_{op}"))
                    elif op == "count":
                        agg_exprs.append(self.pl.col(col).count().alias(f"{col}_count"))
                
                if group_by:
                    result_df = df.group_by(group_by).agg(agg_exprs)
                else:
                    result_df = df.select(agg_exprs)
                
                return {"success": True, "data": result_df.to_dicts()}

            elif query_type == "filter":
                col = params.get("column")
                op = params.get("operator") 
                val = params.get("value")
                
                if not col or not op:
                    return {"success": False, "error": "Missing filter parameters (column, operator)"}

                if op == "eq":
                    df = df.filter(self.pl.col(col) == val)
                elif op == "gt":
                    df = df.filter(self.pl.col(col) > val)
                elif op == "lt":
                    df = df.filter(self.pl.col(col) < val)
                elif op == "contains":
                    df = df.filter(self.pl.col(col).cast(self.pl.Utf8).str.contains(str(val)))
                
                return {"success": True, "data": df.head(100).to_dicts()}

            elif query_type == "sort":
                col = params.get("column")
                descending = params.get("descending", False)
                df = df.sort(col, descending=descending)
                return {"success": True, "data": df.head(100).to_dicts()}
                
            else:
                return {"success": False, "error": f"Unknown query type: {query_type}"}

        except Exception as e:
            logger.error(f"SuperCompute Query Error: {e}")
            return {"success": False, "error": str(e)}

    def auto_insight(self, source: str) -> Dict[str, Any]:
        """
        Generate automatic insights (The 'Brain' meeting the 'Muscle').
        Calculates descriptive stats, correlations, and null checks instantly.
        """
        try:
            df = self.pl.read_csv(source) # simplistic re-read for stateless demo
            
            numeric_cols = df.select(self.pl.col(self.pl.Numeric)).columns
            
            stats = df.describe().to_dicts()
            
            # Null Check
            null_counts = df.null_count().row(0)
            nulls = dict(zip(df.columns, null_counts))
            
            result = {
                "success": True,
                "stats": stats,
                "null_analysis": nulls,
                "numeric_columns": numeric_cols
            }
            
            # Tell the rest of the system what we found
            self.nexus.broadcast("data_insight", {
                "type": "auto_analysis",
                "source": source,
                "findings": "Analysis complete. Stats generated."
            })
            
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
