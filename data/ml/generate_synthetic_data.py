"""
Synthetic Training Dataset Generator for DSA Knowledge Gap Model.

Labels data clearly: TRAINING DATA — SYNTHETIC.
Generates 1200 realistic evidence feature vectors to train the RandomForest classifier.
"""

import csv
import random
from pathlib import Path

# Set random seed for reproducibility
random.seed(42)

HEADER = [
    "# TRAINING DATA — SYNTHETIC",
    "accuracy",
    "recent_accuracy",
    "attempt_count",
    "failure_count",
    "avg_response_time",
    "difficulty_adjusted_accuracy",
    "recent_trend",
    "prerequisite_performance",
    "knowledge_gap"
]


def generate_dataset(num_samples: int = 1200) -> list:
    rows = []
    for _ in range(num_samples):
        # Determine hidden true latent mastery state (0 = Mastered, 1 = Knowledge Gap)
        is_gap = random.random() < 0.40

        if is_gap:
            # Low accuracy, high failures, negative trend, weak prerequisites
            accuracy = round(random.uniform(0.0, 0.45), 3)
            recent_accuracy = round(max(0.0, accuracy + random.uniform(-0.15, 0.10)), 3)
            attempt_count = random.randint(2, 6)
            failure_count = random.randint(int(attempt_count * 0.5), attempt_count)
            avg_response_time = round(random.uniform(55.0, 120.0), 1)
            diff_adj_acc = round(accuracy * random.uniform(0.7, 0.9), 3)
            recent_trend = round(recent_accuracy - accuracy, 3)
            prereq_perf = round(random.uniform(0.1, 0.6), 3)
            label = 1
        else:
            # High accuracy, low failures, positive/stable trend, strong prerequisites
            accuracy = round(random.uniform(0.70, 1.0), 3)
            recent_accuracy = round(min(1.0, accuracy + random.uniform(-0.05, 0.15)), 3)
            attempt_count = random.randint(1, 5)
            failure_count = random.randint(0, min(1, attempt_count - 1))
            avg_response_time = round(random.uniform(15.0, 45.0), 1)
            diff_adj_acc = round(min(1.0, accuracy * random.uniform(1.0, 1.1)), 3)
            recent_trend = round(recent_accuracy - accuracy, 3)
            prereq_perf = round(random.uniform(0.65, 1.0), 3)
            label = 0

        rows.append([
            accuracy,
            recent_accuracy,
            attempt_count,
            failure_count,
            avg_response_time,
            diff_adj_acc,
            recent_trend,
            prereq_perf,
            label
        ])

    return rows


def main():
    root_dir = Path(__file__).resolve().parents[2]
    out_dir = root_dir / "data" / "ml"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "dsa_training.csv"

    rows = generate_dataset(1200)

    with open(out_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["# TRAINING DATA — SYNTHETIC"])
        writer.writerow([
            "accuracy",
            "recent_accuracy",
            "attempt_count",
            "failure_count",
            "avg_response_time",
            "difficulty_adjusted_accuracy",
            "recent_trend",
            "prerequisite_performance",
            "knowledge_gap"
        ])
        writer.writerows(rows)

    print(f"Generated {len(rows)} synthetic training rows in {out_file}")


if __name__ == "__main__":
    main()
