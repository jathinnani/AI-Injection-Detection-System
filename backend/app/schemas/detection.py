from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_INPUT_LENGTH = 4096
AttackType = Literal[
    "sql_injection", "xss", "command_injection", "ldap_injection", "path_traversal", "none"
]

class DetectionRequest(BaseModel):
    input: str = Field(min_length=1, max_length=MAX_INPUT_LENGTH)

    @field_validator("input")
    @classmethod
    def reject_control_text(cls, value: str) -> str:
        if any(ord(char) < 9 for char in value):
            raise ValueError("input contains unsupported control characters")
        return value

class BatchDetectionRequest(BaseModel):
    inputs: list[str] = Field(min_length=1, max_length=100)

    @field_validator("inputs")
    @classmethod
    def validate_inputs(cls, values: list[str]) -> list[str]:
        if any(not value or len(value) > MAX_INPUT_LENGTH for value in values):
            raise ValueError("each input must contain 1-4096 characters")
        return values

class DetectionResponse(BaseModel):
    input: str
    prediction: Literal["malicious", "benign"]
    attack_type: AttackType
    confidence: float = Field(ge=0, le=1)
    risk_score: int = Field(ge=0, le=100)
    explanation: str
