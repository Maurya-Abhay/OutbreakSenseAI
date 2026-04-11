import os
from dataclasses import dataclass
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split

load_dotenv()

FEATURES = [
    "latitude",
    "longitude",
    "temperature",
    "rainfall",
    "humidity",
    "past_cases",
]


@dataclass
class ModelBundle:
    model: object
    feature_means: Dict[str, float]
    feature_stds: Dict[str, float]
    feature_importances: Dict[str, float]
    model_type: str


def _score_to_level(score: float) -> str:
    if score >= 0.7:
        return "High"
    if score >= 0.4:
        return "Medium"
    return "Low"


def _clamp(value: float, min_value: float = 0.0, max_value: float = 1.0) -> float:
    return max(min_value, min(max_value, value))


def _load_dataset(dataset_path: str) -> pd.DataFrame:
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset not found at {dataset_path}")

    data = pd.read_csv(dataset_path)
    required = set(FEATURES + ["risk_score"])
    missing = required.difference(data.columns)
    if missing:
        raise ValueError(f"Dataset missing required columns: {sorted(missing)}")

    return data


def _train_model(data: pd.DataFrame, model_type: str):
    x = data[FEATURES]
    y = data["risk_score"]

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

    model_type = model_type.lower().strip()
    model = None

    if model_type == "xgboost":
        try:
            from xgboost import XGBRegressor

            model = XGBRegressor(
                n_estimators=200,
                max_depth=5,
                learning_rate=0.08,
                subsample=0.9,
                colsample_bytree=0.8,
                objective="reg:squarederror",
                random_state=42,
            )
        except Exception as ex:
            print(f"XGBoost unavailable, fallback to Random Forest: {ex}")
            model_type = "random_forest"

    if model is None:
        model = RandomForestRegressor(
            n_estimators=250,
            max_depth=12,
            min_samples_split=4,
            random_state=42,
        )

    model.fit(x_train, y_train)
    score = model.score(x_test, y_test)
    print(f"Model trained ({model_type}) R2={score:.3f}")

    return model, model_type


def _build_model_bundle(model, data: pd.DataFrame, model_type: str) -> ModelBundle:
    means = data[FEATURES].mean().to_dict()
    stds = data[FEATURES].std().replace(0, 1).fillna(1).to_dict()

    importances = model.feature_importances_.tolist()
    feature_importances = {
        feature: float(importance) for feature, importance in zip(FEATURES, importances)
    }

    return ModelBundle(
        model=model,
        feature_means={k: float(v) for k, v in means.items()},
        feature_stds={k: float(v) for k, v in stds.items()},
        feature_importances=feature_importances,
        model_type=model_type,
    )


def load_or_train_model() -> ModelBundle:
    model_path = os.getenv("MODEL_PATH", "model/risk_model.joblib")
    dataset_path = os.getenv("DATASET_PATH", "data/training_data.csv")
    model_type = os.getenv("MODEL_TYPE", "random_forest")

    if os.path.exists(model_path):
        saved_bundle = joblib.load(model_path)
        if isinstance(saved_bundle, dict):
            return ModelBundle(
                model=saved_bundle["model"],
                feature_means=saved_bundle["feature_means"],
                feature_stds=saved_bundle["feature_stds"],
                feature_importances=saved_bundle["feature_importances"],
                model_type=saved_bundle.get("model_type", "random_forest"),
            )

    data = _load_dataset(dataset_path)
    model, trained_type = _train_model(data, model_type)
    bundle = _build_model_bundle(model, data, trained_type)

    model_dir = os.path.dirname(model_path)
    if model_dir:
        os.makedirs(model_dir, exist_ok=True)
    joblib.dump(
        {
            "model": bundle.model,
            "feature_means": bundle.feature_means,
            "feature_stds": bundle.feature_stds,
            "feature_importances": bundle.feature_importances,
            "model_type": bundle.model_type,
        },
        model_path,
    )

    return bundle


def _prepare_input(input_data: Dict) -> List[float]:
    row = []
    for feature in FEATURES:
        value = input_data.get(feature)
        if value is None:
            raise ValueError(f"Missing feature: {feature}")
        row.append(float(value))
    return row


def _local_explainability(bundle: ModelBundle, input_data: Dict) -> List[Dict]:
    raw_scores: List[Tuple[str, float]] = []

    for feature in FEATURES:
        importance = bundle.feature_importances.get(feature, 0.0)
        mean = bundle.feature_means.get(feature, 0.0)
        std = bundle.feature_stds.get(feature, 1.0) or 1.0
        value = float(input_data.get(feature, mean))

        # A simple local explanation: weighted distance from typical feature behavior.
        z_score_distance = abs((value - mean) / std)
        contribution = importance * z_score_distance
        raw_scores.append((feature, contribution))

    total = sum(score for _, score in raw_scores) or 1.0
    normalized = [
        {"factor": feature, "contribution": round(score / total, 3)}
        for feature, score in raw_scores
    ]

    normalized.sort(key=lambda x: x["contribution"], reverse=True)
    return normalized[:3]


def predict(bundle: ModelBundle, payload: Dict) -> Dict:
    prepared = _prepare_input(payload)
    raw_prediction = float(bundle.model.predict(np.array([prepared]))[0])
    risk_score = round(_clamp(raw_prediction), 3)

    explainability = {
        "top_factors": _local_explainability(bundle, payload),
        "model_type": bundle.model_type,
    }

    return {
        "risk_score": risk_score,
        "risk_level": _score_to_level(risk_score),
        "explainability": explainability,
    }


def global_feature_importance(bundle: ModelBundle) -> Dict:
    ranked = sorted(
        bundle.feature_importances.items(), key=lambda item: item[1], reverse=True
    )
    return {
        "model_type": bundle.model_type,
        "feature_importance": [
            {"feature": feature, "importance": round(float(importance), 4)}
            for feature, importance in ranked
        ],
    }
