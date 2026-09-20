#!/usr/bin/env python3
"""
EVIDENCE.md Auto-Generator

Scans evidence/sessions/*.json and generates a clean, transparent EVIDENCE.md summary report.
Explicitly filters out demo seeds (S001, S002, is_demo_seed=True).
"""

import os
import glob
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SESSIONS_DIR = os.path.join(BASE_DIR, "evidence", "sessions")
EVIDENCE_MD_PATH = os.path.join(BASE_DIR, "EVIDENCE.md")


def generate_evidence_md():
    pattern = os.path.join(SESSIONS_DIR, "*.json")
    files = glob.glob(pattern)

    sessions = []
    for fp in sorted(files):
        try:
            with open(fp, "r", encoding="utf-8") as f:
                data = json.load(f)
                # Filter out demo seeds (S001, S002, is_demo_seed)
                if data.get("is_demo_seed") or "S00" in data.get("tester_alias", ""):
                    continue
                sessions.append(data)
        except Exception as e:
            print(f"Warning: Could not read {fp}: {e}")

    lines = []
    lines.append("# Real User Testing Evidence Report")
    lines.append("")
    lines.append("> **Note**: Seeded demo students (S001, S002) are excluded from this report.")
    lines.append("")
    lines.append(f"**Total Real Tester Sessions**: {len(sessions)}")
    lines.append(f"**Report Generated**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")
    lines.append("")

    if not sessions:
        lines.append("### Summary Table")
        lines.append("")
        lines.append("| Tester Alias | Task Description | Time (s) | Pre-Test Score | Post-Test Score | Skill Delta | Mastered? |")
        lines.append("| :--- | :--- | :---: | :---: | :---: | :---: | :---: |")
        lines.append("| *No tester sessions logged yet* | | | | | | |")
        lines.append("")
    else:
        avg_pre = sum(s.get("pre_test_diagnostic_score", 0) for s in sessions) / len(sessions)
        avg_post = sum(s.get("post_test_verification_score", 0) for s in sessions) / len(sessions)
        avg_delta = avg_post - avg_pre
        pass_count = sum(1 for s in sessions if s.get("concept_mastered"))
        pass_rate = (pass_count / len(sessions)) * 100.0

        lines.append("## Aggregated Performance Impact")
        lines.append(f"- **Average Pre-Test Diagnostic Score**: `{avg_pre:.1f}%`")
        lines.append(f"- **Average Post-Test Verification Score**: `{avg_post:.1f}%`")
        lines.append(f"- **Average Learning Score Delta**: `+{avg_delta:.1f}%`")
        lines.append(f"- **Verification Pass Rate**: `{pass_rate:.1f}%` ({pass_count}/{len(sessions)} mastered)")
        lines.append("")

        lines.append("## Tester Sessions Table")
        lines.append("")
        lines.append("| Tester Alias | Task Description | Time Spent | Pre-Test Score | Post-Test Score | Skill Delta | Status |")
        lines.append("| :--- | :--- | :---: | :---: | :---: | :---: | :---: |")

        for s in sessions:
            alias = s.get("tester_alias", "Anonymous")
            task = s.get("task_description", "Remediation")
            t_sec = f"{s.get('time_to_finish_seconds', 0)}s"
            pre = f"{s.get('pre_test_diagnostic_score', 0)}%"
            post = f"{s.get('post_test_verification_score', 0)}%"
            delta = f"+{s.get('learning_score_delta', 0)}%" if s.get('learning_score_delta', 0) >= 0 else f"{s.get('learning_score_delta', 0)}%"
            status = "✅ MASTERED" if s.get("concept_mastered") else "❌ IN PROGRESS"
            lines.append(f"| `{alias}` | {task} | {t_sec} | {pre} | {post} | **{delta}** | {status} |")

        lines.append("")

    with open(EVIDENCE_MD_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"Successfully generated EVIDENCE.md ({len(sessions)} real sessions logged).")


if __name__ == "__main__":
    generate_evidence_md()
