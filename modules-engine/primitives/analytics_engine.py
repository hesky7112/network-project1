"""
Analytics Engine Primitive
Metrics, dashboards, insights generation
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta


class AnalyticsEngine:
    """Master primitive for analytics (metrics, dashboards, insights)"""
    
    def __init__(self):
        pass
    
    def calculate_metrics(
        self,
        data: List[Dict],
        metrics: List[str] = None,
        group_by: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Calculate KPIs and aggregations"""
        import pandas as pd
        import numpy as np
        
        try:
            df = pd.DataFrame(data)
            
            if df.empty:
                return {"success": True, "metrics": {}}
            
            result = {}
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            if group_by and group_by in df.columns:
                grouped = df.groupby(group_by)
                
                for col in numeric_cols:
                    result[col] = {
                        "sum": grouped[col].sum().to_dict(),
                        "mean": grouped[col].mean().to_dict(),
                        "count": grouped[col].count().to_dict(),
                    }
            else:
                for col in numeric_cols:
                    result[col] = {
                        "sum": float(df[col].sum()),
                        "mean": float(df[col].mean()),
                        "min": float(df[col].min()),
                        "max": float(df[col].max()),
                        "count": int(df[col].count()),
                    }
            
            return {"success": True, "metrics": result}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def detect_trends(
        self,
        data: List[Dict],
        value_col: str,
        date_col: str = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Detect trends in time-series data"""
        import pandas as pd
        import numpy as np
        
        try:
            df = pd.DataFrame(data)
            
            if value_col not in df.columns:
                return {"success": False, "error": f"Column '{value_col}' not found"}
            
            values = df[value_col].values
            n = len(values)
            
            if n < 2:
                return {"success": True, "trend": "insufficient_data"}
            
            # Linear trend
            x = np.arange(n)
            slope, intercept = np.polyfit(x, values, 1)
            
            # Determine trend direction
            if slope > 0.1:
                trend = "increasing"
            elif slope < -0.1:
                trend = "decreasing"
            else:
                trend = "stable"
            
            # Calculate change percentage
            if values[0] != 0:
                change_pct = ((values[-1] - values[0]) / values[0]) * 100
            else:
                change_pct = 0
            
            return {
                "success": True,
                "trend": trend,
                "slope": float(slope),
                "change_percentage": float(change_pct),
                "start_value": float(values[0]),
                "end_value": float(values[-1]),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def segment_users(
        self,
        data: List[Dict],
        criteria: Dict[str, Any] = None,
        n_segments: int = 4,
        **kwargs
    ) -> Dict[str, Any]:
        """Segment users based on criteria"""
        import pandas as pd
        import numpy as np
        
        try:
            df = pd.DataFrame(data)
            
            if criteria:
                # Rule-based segmentation
                segments = []
                for _, row in df.iterrows():
                    segment = "default"
                    for seg_name, rules in criteria.items():
                        match = True
                        for field, condition in rules.items():
                            if field in row:
                                if isinstance(condition, dict):
                                    if "min" in condition and row[field] < condition["min"]:
                                        match = False
                                    if "max" in condition and row[field] > condition["max"]:
                                        match = False
                                elif row[field] != condition:
                                    match = False
                        if match:
                            segment = seg_name
                            break
                    segments.append(segment)
                
                df["segment"] = segments
            else:
                # Auto-segmentation using quantiles
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) > 0:
                    df["segment"] = pd.qcut(
                        df[numeric_cols[0]], 
                        q=n_segments, 
                        labels=[f"Segment_{i+1}" for i in range(n_segments)]
                    )
                else:
                    df["segment"] = "default"
            
            # Calculate segment stats
            segment_counts = df["segment"].value_counts().to_dict()
            
            return {
                "success": True,
                "segments": segment_counts,
                "total": len(df),
                "data": df.to_dict(orient="records"),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_dashboard(
        self,
        widgets: List[Dict],
        **kwargs
    ) -> Dict[str, Any]:
        """Create dashboard configuration"""
        dashboard_config = {
            "title": kwargs.get("title", "Dashboard"),
            "refresh_interval": kwargs.get("refresh_interval", 60),
            "layout": kwargs.get("layout", "grid"),
            "widgets": widgets,
        }
        
        return {"success": True, "dashboard": dashboard_config}
    
    def generate_insights(
        self,
        data: List[Dict],
        focus_areas: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate AI-powered insights from data"""
        import pandas as pd
        import numpy as np
        
        try:
            df = pd.DataFrame(data)
            insights = []
            
            # Numeric column insights
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            
            for col in numeric_cols:
                values = df[col].dropna()
                
                if len(values) < 2:
                    continue
                
                mean_val = values.mean()
                std_val = values.std()
                
                # High variance insight
                if std_val / mean_val > 0.5 if mean_val != 0 else False:
                    insights.append({
                        "type": "high_variance",
                        "column": col,
                        "message": f"{col} shows high variability (CV: {std_val/mean_val:.2f})",
                        "severity": "info",
                    })
                
                # Outlier detection
                q1, q3 = values.quantile([0.25, 0.75])
                iqr = q3 - q1
                outliers = values[(values < q1 - 1.5*iqr) | (values > q3 + 1.5*iqr)]
                
                if len(outliers) > 0:
                    insights.append({
                        "type": "outliers",
                        "column": col,
                        "message": f"{col} has {len(outliers)} outlier(s)",
                        "severity": "warning",
                    })
                
                # Trend insight (if sorted by index)
                if len(values) >= 5:
                    recent = values.tail(5).mean()
                    historical = values.head(len(values) - 5).mean()
                    
                    if historical != 0:
                        change = (recent - historical) / historical * 100
                        if abs(change) > 10:
                            insights.append({
                                "type": "trend",
                                "column": col,
                                "message": f"{col} {'increased' if change > 0 else 'decreased'} by {abs(change):.1f}% recently",
                                "severity": "info",
                            })
            
            return {
                "success": True,
                "insights": insights,
                "insight_count": len(insights),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def calculate_retention(
        self,
        data: List[Dict],
        user_id_col: str,
        date_col: str,
        period: str = "week",
        **kwargs
    ) -> Dict[str, Any]:
        """Calculate user retention metrics"""
        import pandas as pd
        
        try:
            df = pd.DataFrame(data)
            df[date_col] = pd.to_datetime(df[date_col])
            
            # Get first activity per user
            first_activity = df.groupby(user_id_col)[date_col].min().reset_index()
            first_activity.columns = [user_id_col, "first_date"]
            
            df = df.merge(first_activity, on=user_id_col)
            
            # Calculate cohort
            if period == "week":
                df["cohort"] = df["first_date"].dt.isocalendar().week
                df["period"] = df[date_col].dt.isocalendar().week
            else:
                df["cohort"] = df["first_date"].dt.to_period("M")
                df["period"] = df[date_col].dt.to_period("M")
            
            # Calculate retention
            cohort_size = df.groupby("cohort")[user_id_col].nunique()
            retention = df.groupby(["cohort", "period"])[user_id_col].nunique().unstack()
            
            retention_rate = retention.divide(cohort_size, axis=0) * 100
            
            return {
                "success": True,
                "retention_matrix": retention_rate.to_dict(),
                "cohort_sizes": cohort_size.to_dict(),
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}

    def predict_load_balance(
        self,
        metrics: List[Dict],
        resource_key: str = "cpu_usage",
        threshold_up: float = 80.0,
        threshold_down: float = 20.0,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Predict resource scaling needs based on load history.
        Implements simple predictive autoscaling logic.
        """
        import pandas as pd
        import numpy as np

        try:
            df = pd.DataFrame(metrics)
            
            if resource_key not in df.columns:
                 return {"success": False, "error": f"Resource key '{resource_key}' not found in metrics"}

            values = df[resource_key].values
            
            # Simple Moving Average for trend
            window = kwargs.get("window", 3)
            if len(values) >= window:
                sma = np.convolve(values, np.ones(window)/window, mode='valid')
                current_trend = sma[-1]
            else:
                current_trend = np.mean(values)

            # Basic Linear Extrapolation for next 5 steps
            x = np.arange(len(values))
            slope, intercept = np.polyfit(x, values, 1)
            next_5_steps = [slope * (len(values) + i) + intercept for i in range(1, 6)]
            predicted_peak = max(next_5_steps)

            recommendation = "MAINTAIN"
            confidence = 0.5
            reason = "Load is stable within operational limits."

            # Logic
            if predicted_peak > threshold_up:
                recommendation = "SCALE_UP"
                confidence = 0.85
                reason = f"Predicted peak load ({predicted_peak:.1f}%) exceeds threshold ({threshold_up}%)."
            elif predicted_peak < threshold_down:
                recommendation = "SCALE_DOWN"
                confidence = 0.70
                reason = f"Predicted load ({predicted_peak:.1f}%) is minimal. Save resources."
            elif slope > 0.5: # Steep increase
                 recommendation = "PREPARE_SCALE_UP"
                 confidence = 0.60
                 reason = "Rapid load increase detected. Monitoring closely."

            return {
                "success": True,
                "recommendation": recommendation,
                "confidence": confidence,
                "reason": reason,
                "current_trend": float(current_trend),
                "predicted_peak_5_steps": float(predicted_peak),
                "slope": float(slope)
            }

        except Exception as e:
            return {"success": False, "error": str(e)}
