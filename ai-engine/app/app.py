import os
from typing import List

from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, Field

from .model_service import global_feature_importance, load_or_train_model, predict


class PredictionInput(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    temperature: float = Field(ge=-40, le=80)
    rainfall: float = Field(ge=0, le=2000)
    humidity: float = Field(ge=0, le=100)
    past_cases: float = Field(default=0, ge=0, le=100000)
    disease_type: str = Field(default="Unknown", max_length=40)


class BatchPredictionPoint(PredictionInput):
    location_name: str = Field(default="Unknown")


class BatchPredictionRequest(BaseModel):
    points: List[BatchPredictionPoint] = Field(default_factory=list, max_length=300)


# API Key authentication
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(api_key: str = Depends(api_key_header)):
    """Verify API key from environment variable."""
    expected_key = os.getenv("API_KEY", "sk-ai-prod-9c7e3b8f4d2a1e6c9b5f3a8d7e2c4b1f")
    enable_auth = os.getenv("ENABLE_AUTH", "true").lower() == "true"
    
    # Skip auth in development if ENABLE_AUTH is false
    if not enable_auth:
        return True
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API Key. Include 'X-API-Key' header."
        )
    
    if api_key != expected_key:
        raise HTTPException(
            status_code=403,
            detail="Invalid or expired API Key."
        )
    
    return True


def create_app() -> FastAPI:
    app = FastAPI(
        title="OutbreakSense AI Engine",
        version="1.0.0",
        description="FastAPI service for multi-disease outbreak risk prediction and explainability",
    )
    model_bundle = load_or_train_model()

    @app.get("/health")
    def health():
        """Health check endpoint (no auth required)."""
        return {"status": "ok", "service": "outbreaksense-ai-engine"}

    @app.post("/predict")
    def predict_single(payload: PredictionInput, _: bool = Depends(verify_api_key)):
        """Single prediction endpoint (requires API key)."""
        result = predict(model_bundle, payload.model_dump())
        return result

    @app.post("/predict-batch")
    def predict_batch(payload: BatchPredictionRequest, _: bool = Depends(verify_api_key)):
        """Batch prediction endpoint (requires API key)."""
        if not payload.points:
            return {"points": []}

        predictions = []

        for point in payload.points:
            point_dict = point.model_dump()
            location_name = point_dict.pop("location_name", "Unknown")

            try:
                result = predict(model_bundle, point_dict)
                predictions.append(
                    {
                        "location_name": location_name,
                        **result,
                    }
                )
            except Exception as e:
                # Log the actual error instead of silently failing
                import traceback
                error_trace = traceback.format_exc()
                print(f"ERROR predicting {location_name}: {str(e)}\n{error_trace}")
                
                # Return error indication instead of fake prediction
                predictions.append(
                    {
                        "location_name": location_name,
                        "risk_score": None,
                        "risk_level": "ERROR",
                        "error": str(e),
                        "confidence": 0,  # Indicate low confidence
                        "explainability": None,
                    }
                )

        if len(predictions) != len(payload.points):
            raise HTTPException(status_code=500, detail="Batch prediction processing mismatch")

        return {"points": predictions}

    @app.get("/explain/model")
    def explain_model(_: bool = Depends(verify_api_key)):
        """Model explainability endpoint (requires API key)."""
        return global_feature_importance(model_bundle)

    return app
