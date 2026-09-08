import logging
import re
from pathlib import Path

from app.schemas.detection import DetectionResponse

LOGGER = logging.getLogger(__name__)
MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "model.joblib"
SEVERITY = {"command_injection": 1.0, "sql_injection": 0.9, "path_traversal": 0.8, "ldap_injection": 0.75, "xss": 0.7, "none": 0.0}
PATTERNS = {
    "command_injection": re.compile(r"(?:;|\||&&|`|\$\().*(?:curl|wget|bash|sh|powershell|cmd|nc|rm\s+-)", re.I),
    "sql_injection": re.compile(r"(?:union\s+select|select\s+.*\s+from|or\s+['\"]?1['\"]?\s*=|drop\s+table|sleep\s*\()", re.I),
    "xss": re.compile(r"(?:<\s*script|javascript:|on(?:error|load|click)\s*=|<\s*iframe)", re.I),
    "ldap_injection": re.compile(r"(?:\*\)|\([^)]*=\*|\|\s*\(|&\s*\(|\x00)", re.I),
    "path_traversal": re.compile(r"(?:\.\./|\.\\|%2e%2e|/etc/passwd|boot\.ini)", re.I),
}

class Detector:
    def __init__(self) -> None:
        self.model = None
        if MODEL_PATH.exists():
            try:
                import joblib
                self.model = joblib.load(MODEL_PATH)
            except Exception:
                LOGGER.warning("Unable to load model; using heuristic detector", exc_info=True)
        else:
            LOGGER.warning("model.joblib is missing; using heuristic detector")

    def detect(self, value: str) -> DetectionResponse:
        matches = [(name, pattern) for name, pattern in PATTERNS.items() if pattern.search(value)]
        prediction = "malicious" if matches else "benign"
        confidence = 0.96 if not matches else min(0.99, 0.82 + (0.04 * len(matches)))
        if self.model is not None:
            try:
                prediction = str(self.model.predict([value])[0])
                probabilities = self.model.predict_proba([value])[0]
                confidence = float(max(probabilities))
            except Exception:
                LOGGER.warning("Model inference failed; using heuristic result", exc_info=True)
        if not matches and prediction == "benign":
            return DetectionResponse(input=value, prediction="benign", attack_type="none", confidence=confidence, risk_score=0, explanation="No known injection indicators matched.")
        if not matches:
            return DetectionResponse(input=value, prediction="malicious", attack_type="none", confidence=confidence, risk_score=round(confidence * 35), explanation="The trained classifier flagged this input for review.")
        attack_type = matches[0][0]
        # risk_score = confidence * 100 * attack severity, capped to 100.
        risk_score = round(confidence * 100 * SEVERITY[attack_type])
        return DetectionResponse(input=value, prediction="malicious", attack_type=attack_type, confidence=confidence, risk_score=risk_score, explanation=f"Matched {attack_type.replace('_', ' ')} indicators.")

detector = Detector()
