"""
RandomForestClassifier Model Training Pipeline for DSA Knowledge Gap Detection.

Loads synthetic training dataset (data/ml/dsa_training.csv), splits train/test,
trains a Decision Tree Ensemble (Random Forest), computes metrics (Accuracy, Precision, Recall, F1, ROC-AUC),
and saves the trained model artifact to models/dsa_knowledge_gap.joblib.

Usage:
  python -m ml.train_dsa_model
"""

from __future__ import annotations

import csv
import json
import math
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Tuple


# Feature column names
FEATURE_NAMES = [
    "accuracy",
    "recent_accuracy",
    "attempt_count",
    "failure_count",
    "avg_response_time",
    "difficulty_adjusted_accuracy",
    "recent_trend",
    "prerequisite_performance",
]

TARGET_NAME = "knowledge_gap"


class DecisionTreeNode:
    def __init__(
        self,
        feature_idx: int = -1,
        threshold: float = 0.0,
        left=None,
        right=None,
        prob_gap: float = 0.0,
        is_leaf: bool = False,
    ):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.prob_gap = prob_gap
        self.is_leaf = is_leaf

    def predict_prob(self, x: List[float]) -> float:
        if self.is_leaf:
            return self.prob_gap
        if x[self.feature_idx] <= self.threshold:
            return self.left.predict_prob(x)
        return self.right.predict_prob(x)

    def to_dict(self) -> dict:
        if self.is_leaf:
            return {"is_leaf": True, "prob_gap": self.prob_gap}
        return {
            "is_leaf": False,
            "feature_idx": self.feature_idx,
            "threshold": self.threshold,
            "left": self.left.to_dict(),
            "right": self.right.to_dict(),
        }

    @classmethod
    def from_dict(cls, d: dict):
        if d["is_leaf"]:
            return cls(is_leaf=True, prob_gap=d["prob_gap"])
        node = cls(
            is_leaf=False,
            feature_idx=d["feature_idx"],
            threshold=d["threshold"],
        )
        node.left = cls.from_dict(d["left"])
        node.right = cls.from_dict(d["right"])
        return node


def gini_impurity(y: List[int]) -> float:
    if not y:
        return 0.0
    p1 = sum(y) / len(y)
    p0 = 1.0 - p1
    return 1.0 - (p0**2 + p1**2)


def build_tree(
    X: List[List[float]],
    y: List[int],
    max_depth: int = 6,
    min_samples_split: int = 5,
    max_features: int = 3,
    depth: int = 0,
) -> DecisionTreeNode:
    num_samples = len(X)
    num_features = len(X[0]) if num_samples > 0 else 0

    if num_samples == 0:
        return DecisionTreeNode(is_leaf=True, prob_gap=0.0)

    prob_gap = sum(y) / num_samples

    if (
        depth >= max_depth
        or num_samples < min_samples_split
        or prob_gap == 0.0
        or prob_gap == 1.0
    ):
        return DecisionTreeNode(is_leaf=True, prob_gap=prob_gap)

    # Random feature subset selection
    feature_indices = random.sample(range(num_features), k=min(max_features, num_features))

    best_gini = float("inf")
    best_feat = -1
    best_thresh = 0.0

    current_gini = gini_impurity(y)

    for feat_idx in feature_indices:
        values = sorted(set(x[feat_idx] for x in X))
        if len(values) <= 1:
            continue
        # Check candidate thresholds
        for i in range(len(values) - 1):
            thresh = (values[i] + values[i + 1]) / 2.0
            left_y = [y[k] for k in range(num_samples) if X[k][feat_idx] <= thresh]
            right_y = [y[k] for k in range(num_samples) if X[k][feat_idx] > thresh]

            if not left_y or not right_y:
                continue

            w_left = len(left_y) / num_samples
            w_right = len(right_y) / num_samples
            g_split = w_left * gini_impurity(left_y) + w_right * gini_impurity(right_y)

            if g_split < best_gini:
                best_gini = g_split
                best_feat = feat_idx
                best_thresh = thresh

    if best_feat == -1 or (current_gini - best_gini) < 1e-4:
        return DecisionTreeNode(is_leaf=True, prob_gap=prob_gap)

    # Split dataset
    left_X, left_y, right_X, right_y = [], [], [], []
    for k in range(num_samples):
        if X[k][best_feat] <= best_thresh:
            left_X.append(X[k])
            left_y.append(y[k])
        else:
            right_X.append(X[k])
            right_y.append(y[k])

    left_child = build_tree(
        left_X, left_y, max_depth, min_samples_split, max_features, depth + 1
    )
    right_child = build_tree(
        right_X, right_y, max_depth, min_samples_split, max_features, depth + 1
    )

    return DecisionTreeNode(
        feature_idx=best_feat,
        threshold=best_thresh,
        left=left_child,
        right=right_child,
        is_leaf=False,
    )


class RandomForestClassifierModel:
    def __init__(self, n_estimators: int = 25, max_depth: int = 6):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.trees: List[DecisionTreeNode] = []

    def fit(self, X: List[List[float]], y: List[int]):
        self.trees = []
        n_samples = len(X)
        max_features = max(1, int(math.sqrt(len(FEATURE_NAMES))))

        for _ in range(self.n_estimators):
            # Bootstrap sample
            boot_indices = [random.randint(0, n_samples - 1) for _ in range(n_samples)]
            boot_X = [X[idx] for idx in boot_indices]
            boot_y = [y[idx] for idx in boot_indices]

            tree = build_tree(
                boot_X,
                boot_y,
                max_depth=self.max_depth,
                min_samples_split=4,
                max_features=max_features,
            )
            self.trees.append(tree)

    def predict_proba(self, X: List[List[float]]) -> List[float]:
        probs = []
        for x in X:
            tree_probs = [tree.predict_prob(x) for tree in self.trees]
            probs.append(sum(tree_probs) / len(tree_probs))
        return probs

    def predict(self, X: List[List[float]], threshold: float = 0.5) -> List[int]:
        probs = self.predict_proba(X)
        return [1 if p >= threshold else 0 for p in probs]

    def to_dict(self) -> dict:
        return {
            "model_type": "RandomForestClassifier",
            "n_estimators": len(self.trees),
            "feature_names": FEATURE_NAMES,
            "trees": [tree.to_dict() for tree in self.trees],
        }

    @classmethod
    def from_dict(cls, d: dict):
        model = cls(n_estimators=d["n_estimators"])
        model.trees = [DecisionTreeNode.from_dict(t) for t in d["trees"]]
        return model


def compute_metrics(y_true: List[int], y_prob: List[float], threshold: float = 0.5) -> Dict[str, float]:
    y_pred = [1 if p >= threshold else 0 for p in y_prob]

    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)

    total = len(y_true)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    # Trapezoidal ROC-AUC calculation
    paired = sorted(zip(y_prob, y_true), key=lambda item: item[0], reverse=True)
    positives = sum(y_true)
    negatives = total - positives

    if positives == 0 or negatives == 0:
        roc_auc = 0.5
    else:
        num_neg_above = 0
        sum_ranks = 0.0
        for i, (p, label) in enumerate(paired):
            if label == 1:
                sum_ranks += (i + 1)
        # Mann-Whitney U test statistic for AUC
        u_stat = sum_ranks - (positives * (positives + 1)) / 2.0
        roc_auc = 1.0 - (u_stat / (positives * negatives))

    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "roc_auc": round(abs(roc_auc), 4),
    }


def train_model() -> Dict[str, Any]:
    root_dir = Path(__file__).resolve().parents[1]
    csv_file = root_dir / "data" / "ml" / "dsa_training.csv"
    models_dir = root_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    artifact_file = models_dir / "dsa_knowledge_gap.joblib"

    if not csv_file.exists():
        raise FileNotFoundError(f"Training data not found at {csv_file}")

    print(f"1. Loading dataset from {csv_file}...")
    X, y = [], []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        for row in reader:
            if not row or row[0].startswith("#") or row[0] == "accuracy":
                continue
            feats = [float(v) for v in row[:8]]
            target = int(float(row[8]))
            X.append(feats)
            y.append(target)

    print(f"   Loaded {len(X)} samples with {len(FEATURE_NAMES)} features.")

    # Train / Test Split (80% train, 20% test)
    random.seed(42)
    indices = list(range(len(X)))
    random.shuffle(indices)

    split_idx = int(len(X) * 0.8)
    train_idx, test_idx = indices[:split_idx], indices[split_idx:]

    X_train = [X[i] for i in train_idx]
    y_train = [y[i] for i in train_idx]
    X_test = [X[i] for i in test_idx]
    y_test = [y[i] for i in test_idx]

    print("2. Training RandomForestClassifier model...")
    rf = RandomForestClassifierModel(n_estimators=30, max_depth=6)
    rf.fit(X_train, y_train)

    print("3. Evaluating model performance on test set...")
    test_probs = rf.predict_proba(X_test)
    metrics = compute_metrics(y_test, test_probs)

    print("   Empirical Test Metrics:")
    print(f"     Accuracy:  {metrics['accuracy']}")
    print(f"     Precision: {metrics['precision']}")
    print(f"     Recall:    {metrics['recall']}")
    print(f"     F1 Score:  {metrics['f1_score']}")
    print(f"     ROC-AUC:   {metrics['roc_auc']}")

    # Package model payload
    model_payload = {
        "model": rf.to_dict(),
        "metrics": metrics,
        "features": FEATURE_NAMES,
        "version": "1.0.0",
        "trained_samples": len(X_train),
        "test_samples": len(X_test),
    }

    # Save artifact using json representation (compatible with joblib loader interface)
    with open(artifact_file, "w", encoding="utf-8") as f:
        json.dump(model_payload, f, indent=2)

    print(f"4. Model artifact saved successfully to {artifact_file}")
    return metrics


if __name__ == "__main__":
    train_model()
