"""Train InjectionGuard AI from the illustrative CSV seed data."""
import csv
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = ROOT / "data" / "processed" / "dataset.csv"
MODEL_PATH = Path(__file__).with_name("model.joblib")


def load_rows() -> tuple[list[str], list[str]]:
    with DATA_PATH.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    return [row["payload"] for row in rows], [row["label"] for row in rows]


def main() -> None:
    texts, labels = load_rows()
    train_texts, test_texts, train_labels, test_labels = train_test_split(texts, labels, test_size=0.25, random_state=42, stratify=labels)
    # Character n-grams tolerate encoded and punctuation-heavy payloads better than word features.
    model = Pipeline([("tfidf", TfidfVectorizer(analyzer="char", ngram_range=(2, 5), min_df=1)), ("classifier", LogisticRegression(max_iter=1000, class_weight="balanced"))])
    model.fit(train_texts, train_labels)
    predictions = model.predict(test_texts)
    print(f"Accuracy: {accuracy_score(test_labels, predictions):.3f}")
    print(classification_report(test_labels, predictions, zero_division=0))
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
