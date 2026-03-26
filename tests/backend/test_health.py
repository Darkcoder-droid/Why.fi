import importlib
import sys
import types

from fastapi.testclient import TestClient


def load_backend_app():
    fake_ml_engine = types.ModuleType("backend.ml_engine")

    class FakeFaceAnalyzer:
        def get_status(self):
            return {"ready": True, "error": None}

        def process_frame(self, _data):
            return {
                "emoji": "happy",
                "why_meter": {
                    "why_score": 100,
                    "boredom": 0,
                    "confusion": 0,
                    "dread": 0,
                },
            }

    fake_ml_engine.FaceAnalyzer = FakeFaceAnalyzer
    sys.modules["backend.ml_engine"] = fake_ml_engine
    sys.modules.pop("backend.main", None)
    return importlib.import_module("backend.main")


def test_health_endpoint_returns_ok_status():
    backend_main = load_backend_app()
    client = TestClient(backend_main.app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "analyzer": {"ready": True, "error": None},
    }
