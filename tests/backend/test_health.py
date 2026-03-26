import importlib
import sys
import types
from base64 import b64encode
from pathlib import Path

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


def test_capture_requires_image_payload():
    backend_main = load_backend_app()
    client = TestClient(backend_main.app)

    response = client.post(
        "/captures",
        json={"image": "", "expression": "happy", "score": 1},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Missing image data"}


def test_capture_persists_image_and_returns_url(tmp_path: Path):
    backend_main = load_backend_app()
    backend_main.CAPTURES_DIR = tmp_path
    client = TestClient(backend_main.app)
    raw_bytes = b"fake-image-bytes"
    encoded = b64encode(raw_bytes).decode("ascii")

    response = client.post(
        "/captures",
        json={
            "image": f"data:image/jpeg;base64,{encoded}",
            "expression": "surprise",
            "score": 4,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["filename"].startswith("04-surprise-")
    assert payload["url"].endswith(f"/api/images/{payload['filename']}")
    assert (tmp_path / payload["filename"]).read_bytes() == raw_bytes
