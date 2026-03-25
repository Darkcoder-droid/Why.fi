import base64
from collections import Counter, deque
import numpy as np
import cv2
import mediapipe as mp
import math

def euclidean_distance(p1, p2):
    return math.hypot(p1.x - p2.x, p1.y - p2.y)


def _load_face_mesh_module():
    if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
        return mp.solutions.face_mesh

    # Some mediapipe builds expose the legacy solutions API only under the
    # internal python package path.
    try:
        from mediapipe.python.solutions import face_mesh

        return face_mesh
    except ImportError:
        installed_version = getattr(mp, "__version__", "unknown")
        has_tasks_api = hasattr(mp, "tasks")
        raise RuntimeError(
            "MediaPipe FaceMesh is unavailable in the installed mediapipe package "
            f"(version {installed_version}). This environment appears to have a tasks-only "
            "MediaPipe build without the legacy FaceMesh solution. Use a supported Python "
            "runtime such as 3.10-3.12 and reinstall dependencies, or run the backend via "
            "the provided Dockerfile (python:3.10-slim). "
            f"tasks_api_present={has_tasks_api}"
        )

class FaceAnalyzer:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(FaceAnalyzer, cls).__new__(cls, *args, **kwargs)
            cls._instance.face_mesh = None
            cls._instance.initialization_error = None
            cls._instance.logged_runtime_error = False
            cls._instance.emoji_history = deque(maxlen=5)
        return cls._instance

    def _empty_result(self):
        return {
            "emoji": "none",
            "why_meter": {"why_score": 0, "boredom": 0, "confusion": 0, "dread": 0},
        }

    def _ensure_face_mesh(self):
        if self.face_mesh is not None:
            return self.face_mesh

        if self.initialization_error is not None:
            raise RuntimeError(self.initialization_error)

        try:
            face_mesh_module = _load_face_mesh_module()
            self.face_mesh = face_mesh_module.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
            )
            return self.face_mesh
        except Exception as exc:
            self.initialization_error = str(exc)
            raise

    def _get_mar(self, landmarks):
        top = landmarks.landmark[13]
        bottom = landmarks.landmark[14]
        left = landmarks.landmark[78]
        right = landmarks.landmark[308]
        vert = euclidean_distance(top, bottom)
        horz = euclidean_distance(left, right)
        return vert / horz if horz > 0 else 0

    def _get_ear(self, landmarks):
        l_top = landmarks.landmark[159]
        l_bottom = landmarks.landmark[145]
        l_left = landmarks.landmark[33]
        l_right = landmarks.landmark[133]
        
        r_top = landmarks.landmark[386]
        r_bottom = landmarks.landmark[374]
        r_left = landmarks.landmark[362]
        r_right = landmarks.landmark[263]
        
        left_ear = euclidean_distance(l_top, l_bottom) / euclidean_distance(l_left, l_right)
        right_ear = euclidean_distance(r_top, r_bottom) / euclidean_distance(r_left, r_right)
        
        return (left_ear + right_ear) / 2.0

    def _get_eyebrow_raise(self, landmarks):
        l_eye_top = landmarks.landmark[159]
        l_eyebrow = landmarks.landmark[105]
        r_eye_top = landmarks.landmark[386]
        r_eyebrow = landmarks.landmark[334]
        
        left_dist = euclidean_distance(l_eye_top, l_eyebrow)
        right_dist = euclidean_distance(r_eye_top, r_eyebrow)
        
        return (left_dist + right_dist) / 2.0, abs(left_dist - right_dist)

    def _extract_features(self, landmarks):
        face_left = landmarks.landmark[234]
        face_right = landmarks.landmark[454]
        face_top = landmarks.landmark[10]
        face_bottom = landmarks.landmark[152]
        face_width = max(euclidean_distance(face_left, face_right), 1e-6)
        face_height = max(euclidean_distance(face_top, face_bottom), 1e-6)

        left_corner = landmarks.landmark[61]
        right_corner = landmarks.landmark[291]
        upper_lip = landmarks.landmark[13]
        lower_lip = landmarks.landmark[14]
        mouth_center_y = (upper_lip.y + lower_lip.y) / 2.0
        mouth_width = euclidean_distance(left_corner, right_corner) / face_width
        mouth_open = self._get_mar(landmarks)
        eye_open = self._get_ear(landmarks)
        brow_raise, brow_asymmetry = self._get_eyebrow_raise(landmarks)

        left_inner_brow = landmarks.landmark[105]
        right_inner_brow = landmarks.landmark[334]
        brow_distance = euclidean_distance(left_inner_brow, right_inner_brow) / face_width
        corner_drop = (((left_corner.y + right_corner.y) / 2.0) - mouth_center_y) / face_height
        lip_to_nose = (upper_lip.y - landmarks.landmark[2].y) / face_height

        return {
            "mouth_open": mouth_open,
            "mouth_width": mouth_width,
            "eye_open": eye_open,
            "brow_raise": brow_raise,
            "brow_asymmetry": brow_asymmetry,
            "brow_distance": brow_distance,
            "corner_drop": corner_drop,
            "lip_to_nose": lip_to_nose,
        }

    def _smooth_emoji(self, emoji):
        self.emoji_history.append(emoji)
        return Counter(self.emoji_history).most_common(1)[0][0]

    def classify_emoji(self, landmarks):
        features = self._extract_features(landmarks)
        mouth_open = features["mouth_open"]
        mouth_width = features["mouth_width"]
        eye_open = features["eye_open"]
        brow_raise = features["brow_raise"]
        brow_asymmetry = features["brow_asymmetry"]
        brow_distance = features["brow_distance"]
        corner_drop = features["corner_drop"]
        lip_to_nose = features["lip_to_nose"]

        is_surprised = (
            eye_open > 0.30
            and brow_raise > 0.08
            and mouth_open > 0.16
        )
        is_happy = (
            mouth_width > 0.42
            and corner_drop < -0.015
            and mouth_open < 0.22
        )
        is_angry = (
            brow_raise < 0.07
            and brow_distance < 0.42
            and brow_asymmetry < 0.018
            and mouth_open < 0.16
        )
        is_sad = (
            corner_drop > 0.012
            and mouth_open < 0.24
            and brow_raise > 0.07
            and lip_to_nose > 0.08
        )

        if is_surprised:
            return self._smooth_emoji("surprise")
        if is_happy:
            return self._smooth_emoji("happy")
        if is_angry:
            return self._smooth_emoji("angry")
        if is_sad:
            return self._smooth_emoji("sad")
        return self._smooth_emoji("neutral")

    def calculate_why_meter(self, landmarks, emoji):
        features = self._extract_features(landmarks)
        mouth_open = features["mouth_open"]
        eye_open = features["eye_open"]
        brow_raise = features["brow_raise"]
        brow_asymmetry = features["brow_asymmetry"]
        corner_drop = features["corner_drop"]

        boredom = max(0, min(100, ((0.23 - eye_open) * 380) + ((0.04 - abs(corner_drop)) * 420)))
        confusion = max(0, min(100, (brow_asymmetry * 2400) + (mouth_open * 90)))
        dread = max(0, min(100, ((eye_open - 0.27) * 320) + (max(0, brow_raise - 0.075) * 1100) - (mouth_open * 80)))

        if emoji == "neutral":
            boredom = min(100, boredom + 8)
        elif emoji == "sad":
            dread = min(100, dread + 6)
        elif emoji == "surprise":
            confusion = min(100, confusion + 8)

        why_score = (boredom * 0.4) + (confusion * 0.3) + (dread * 0.3)
        
        return {
            "boredom": round(boredom, 1),
            "confusion": round(confusion, 1),
            "dread": round(dread, 1),
            "why_score": round(why_score, 1)
        }

    def process_frame(self, base64_string: str):
        if ',' in base64_string:
            base64_string = base64_string.split(',', 1)[1]
            
        try:
            face_mesh = self._ensure_face_mesh()
            img_bytes = base64.b64decode(base64_string)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            
            if img is None:
                return self._empty_result()
                
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(img_rgb)
            
            if results.multi_face_landmarks:
                landmarks = results.multi_face_landmarks[0]
                emoji = self.classify_emoji(landmarks)
                why_meter = self.calculate_why_meter(landmarks, emoji)
                return {
                    "emoji": emoji,
                    "why_meter": why_meter
                }
                
            self.emoji_history.clear()
            return self._empty_result()
        except RuntimeError as e:
            if not self.logged_runtime_error:
                print(f"Error processing frame: {e}")
                self.logged_runtime_error = True
            self.emoji_history.clear()
            return self._empty_result()
        except Exception as e:
            print(f"Error processing frame: {e}")
            self.emoji_history.clear()
            return self._empty_result()

    def is_ready(self) -> bool:
        try:
            self._ensure_face_mesh()
            return True
        except Exception:
            return False

    def get_status(self) -> dict:
        return {
            "ready": self.is_ready(),
            "error": self.initialization_error,
        }
