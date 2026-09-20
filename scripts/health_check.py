#!/usr/bin/env python3
"""
Knowledge Debt Engine - System Health & Budget Doctor

Verifies:
1. Environment configuration (.env, OPENROUTER_API_KEY presence, .gitignore security).
2. Security pre-commit hook setup (scripts/hooks/pre-commit).
3. Active runtime LLM model configuration.
4. Database persistence and ML model readiness.
5. Shared $10.00 budget usage and remaining budget.
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))


def run_doctor():
    print("=" * 60)
    print("      KNOWLEDGE DEBT ENGINE - HEALTH & BUDGET DOCTOR      ")
    print("=" * 60)
    print()

    all_passed = True

    # 1. Environment & API Key Security Check
    print("[1/5] Environment & Security Check...")
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if api_key:
        print("  [OK] OPENROUTER_API_KEY is configured in .env (Hidden for security).")
    else:
        print("  [WARN] OPENROUTER_API_KEY missing in .env (System will run in OFFLINE mode).")

    gitignore_path = os.path.join(BASE_DIR, ".gitignore")
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r") as f:
            content = f.read()
            if ".env" in content:
                print("  [OK] .env is properly ignored in .gitignore.")
            else:
                print("  [FAIL] SECURITY ALERT: .env NOT found in .gitignore!")
                all_passed = False
    else:
        print("  [FAIL] SECURITY ALERT: .gitignore missing!")
        all_passed = False

    # Git Leak Check
    forbidden_prefix = "sk-" + "or-v1-"
    grep_res = subprocess.run(["git", "grep", "-n", forbidden_prefix], cwd=BASE_DIR, capture_output=True, text=True)
    if grep_res.returncode != 0 or not grep_res.stdout.strip():
        print("  [OK] Zero hardcoded OpenRouter API keys found in git working tree.")
    else:
        print("  [FAIL] CRITICAL SECURITY FAILURE: Hardcoded API key found in tracked git files!")
        all_passed = False

    print()

    # 2. Pre-Commit Hook Check
    print("[2/5] Git Hooks Configuration Check...")
    hook_path = os.path.join(BASE_DIR, "scripts", "hooks", "pre-commit")
    if os.path.exists(hook_path):
        print(f"  [OK] Pre-commit hook exists at scripts/hooks/pre-commit.")
    else:
        print(f"  [FAIL] Pre-commit hook missing at scripts/hooks/pre-commit!")
        all_passed = False

    hooks_config = subprocess.run(["git", "config", "core.hooksPath"], cwd=BASE_DIR, capture_output=True, text=True)
    current_hooks_path = hooks_config.stdout.strip()
    if current_hooks_path == "scripts/hooks":
        print(f"  [OK] git core.hooksPath is configured to 'scripts/hooks'.")
    else:
        print(f"  [WARN] git core.hooksPath is '{current_hooks_path}' (Recommended: 'scripts/hooks').")

    print()

    # 3. Model Configuration Check
    print("[3/5] Active Model Configuration Check...")
    model_name = os.getenv("SLICE_FALLBACK_MODEL", os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite"))
    print(f"  [OK] Active LLM Model String: {model_name}")
    print(f"  [OK] API Endpoint: https://openrouter.ai/api/v1/chat/completions")
    print()

    # 4. Database & ML Engine Check
    print("[4/5] Database & ML Model Readiness...")
    db_path = os.path.join(BASE_DIR, "knowledge_debt.db")
    if os.path.exists(db_path):
        print(f"  [OK] SQLite Database present: knowledge_debt.db ({os.path.getsize(db_path)} bytes)")
    else:
        print("  [WARN] SQLite database missing. Seed using: python scripts/create_demo_student.py")

    ml_model_path = os.path.join(BASE_DIR, "models", "dsa_knowledge_gap.joblib")
    if os.path.exists(ml_model_path):
        print(f"  [OK] Scikit-Learn ML Model present: dsa_knowledge_gap.joblib ({os.path.getsize(ml_model_path)} bytes)")
    else:
        print("  [WARN] ML Model missing at models/dsa_knowledge_gap.joblib.")

    print()

    # 5. Shared $10 Budget Meter Check
    print("[5/5] Shared $10.00 Budget Usage & Key Limit...")
    sys.path.insert(0, BASE_DIR)
    try:
        from backend.services.multi_model_engine import engine
        b_data = engine.get_budget_status()
        print(f"  - Total Budget Cap:      ${b_data.get('budget_cap')}")
        print(f"  - Total API Calls:       {b_data.get('total_calls')}")
        print(f"  - Total Tokens Tracked:  {b_data.get('total_tokens')}")
        print(f"  - Spent USD (OpenRouter): {b_data.get('spent_dollars')}")
        print(f"  - Remaining USD:          {b_data.get('remaining_dollars')}")
    except Exception as ex:
        print(f"  [WARN] Budget tracking check error: {ex}")

    print()
    print("=" * 60)
    if all_passed:
        print("  STATUS: SYSTEM HEALTHY - ALL CHECKS PASSED SUCCESSFULLY")
    else:
        print("  STATUS: HEALTH CHECKS COMPLETED WITH WARNINGS/ERRORS")
    print("=" * 60)


if __name__ == "__main__":
    run_doctor()
