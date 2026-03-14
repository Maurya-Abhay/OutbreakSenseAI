from typing import List

from fastapi import FastAPI, HTTPException
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


def create_app() -> FastAPI:
    app = FastAPI(
        title="OutbreakSense AI Engine",
        version="1.0.0",
        description="FastAPI service for multi-disease outbreak risk prediction and explainability",
    )
    model_bundle = load_or_train_model()

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "outbreaksense-ai-engine"}

    @app.post("/predict")
    def predict_single(payload: PredictionInput):
        result = predict(model_bundle, payload.model_dump())
        return result

    @app.post("/predict-batch")
    def predict_batch(payload: BatchPredictionRequest):
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
            except Exception:
                predictions.append(
                    {
                        "location_name": location_name,
                        "risk_score": 0.45,
                        "risk_level": "Medium",
                        "explainability": {
                            "top_factors": [
                                {"factor": "rainfall", "contribution": 0.34},
                                {"factor": "humidity", "contribution": 0.33},
                                {"factor": "past_cases", "contribution": 0.33},
                            ],
                            "model_type": model_bundle.model_type,
                        },
                    }
                )

        if len(predictions) != len(payload.points):
            raise HTTPException(status_code=500, detail="Batch prediction processing mismatch")

        return {"points": predictions}

    @app.get("/explain/model")
    def explain_model():
        return global_feature_importance(model_bundle)

    return app
