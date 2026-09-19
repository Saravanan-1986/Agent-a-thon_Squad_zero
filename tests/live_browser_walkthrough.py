"""
Live End-to-End Browser Walkthrough Test Suite
Tests all pages, interactive components, 5-Scene Judge Demo,
Memory Simulator, Adversarial Security Barrier, and API persistence
using real Google Chrome via Playwright.
"""

import os
import sys
import time

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
from playwright.sync_api import sync_playwright, expect

def _find_frontend():
    import urllib.request
    for port in [3000, 3001]:
        try:
            with urllib.request.urlopen(f"http://localhost:{port}", timeout=1) as resp:
                if resp.status == 200:
                    return f"http://localhost:{port}"
        except Exception:
            continue
    return "http://localhost:3000"

FRONTEND_URL = _find_frontend()
BACKEND_URL = "http://localhost:8000"
SCREENSHOTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

def run_walkthrough():
    console_messages = []
    page_errors = []
    network_errors = []

    print("================================================================")
    print("🚀 STARTING LIVE BROWSER WALKTHROUGH WITH GOOGLE CHROME")
    print("================================================================")
    print(f"Frontend URL: {FRONTEND_URL}")
    print(f"Backend URL:  {BACKEND_URL}")
    print(f"Chrome Path:  {CHROME_PATH}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--disable-web-security", "--allow-running-insecure-content"]
        )
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            color_scheme="dark"
        )
        page = context.new_page()

        # Event Listeners
        page.on("console", lambda msg: console_messages.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        def handle_response(response):
            if "/api/" in response.url:
                # 400 is expected for adversarial attack test!
                if response.status >= 400 and "/api/demo/adversarial-test" not in response.url:
                    network_errors.append(f"{response.request.method} {response.url} -> {response.status}")

        page.on("response", handle_response)

        # -------------------------------------------------------------
        # TEST 1: LANDING PAGE
        # -------------------------------------------------------------
        print("\n[Step 1/8] 🌐 Testing Public Landing Page (/)")
        page.goto(f"{FRONTEND_URL}/", wait_until="networkidle")
        time.sleep(1)
        
        assert "Knowledge Debt Engine" in page.title()
        expect(page.locator("text=Stop Teaching to Mistakes.")).to_be_visible()
        expect(page.locator("text=Judge Demo").first).to_be_visible()
        
        screenshot_1 = os.path.join(SCREENSHOTS_DIR, "01_landing_page.png")
        page.screenshot(path=screenshot_1)
        print(f"  ✓ Landing page loaded successfully. Screenshot saved: {screenshot_1}")

        # -------------------------------------------------------------
        # TEST 2: DEMO CONTROLLER - SCENE 1
        # -------------------------------------------------------------
        print("\n[Step 2/8] 🎬 Testing Judge Demo - Scene 1: Persistent Debt vs. Careless Slip")
        page.goto(f"{FRONTEND_URL}/demo", wait_until="networkidle")
        time.sleep(1)

        expect(page.locator("text=Scene 1: Persistent Debt vs. Careless Slip").first).to_be_visible()
        expect(page.locator("text=Student Rahul").first).to_be_visible()
        expect(page.locator("text=Pointer Dereferencing").first).to_be_visible()

        screenshot_2 = os.path.join(SCREENSHOTS_DIR, "02_demo_scene1.png")
        page.screenshot(path=screenshot_2)
        print(f"  ✓ Scene 1 verified. Screenshot: {screenshot_2}")

        # -------------------------------------------------------------
        # TEST 3: DEMO CONTROLLER - SCENE 2
        # -------------------------------------------------------------
        print("\n[Step 3/8] 🔍 Testing Judge Demo - Scene 2: Prerequisite DAG Diagnosis")
        btn_scene2 = page.locator("button:has-text('Next: Scene 2')").first
        btn_scene2.wait_for(state="visible", timeout=10000)
        btn_scene2.click()
        time.sleep(1.5)

        expect(page.locator("text=The 'WOW' Moment").first).to_be_visible(timeout=10000)
        expect(page.locator("text=Root-Cause Isolated").first).to_be_visible(timeout=10000)

        screenshot_3 = os.path.join(SCREENSHOTS_DIR, "03_demo_scene2.png")
        page.screenshot(path=screenshot_3)
        print(f"  ✓ Scene 2 verified (Root cause isolated). Screenshot: {screenshot_3}")

        # -------------------------------------------------------------
        # TEST 4: DEMO CONTROLLER - SCENE 3
        # -------------------------------------------------------------
        print("\n[Step 4/8] 👨‍🏫 Testing Judge Demo - Scene 3: AI Proposes, Human Mentor Approves")
        btn_scene3 = page.locator("button:has-text('Next: Scene 3')").first
        btn_scene3.wait_for(state="visible", timeout=10000)
        btn_scene3.click()
        time.sleep(1.5)

        expect(page.locator("text=Scene 3: AI Proposes, Human Mentor Approves").first).to_be_visible(timeout=10000)
        expect(page.locator("text=Dr. Elena Vance").first).to_be_visible(timeout=10000)
        expect(page.locator("text=Constitutional Invariant").first).to_be_visible(timeout=10000)

        screenshot_4 = os.path.join(SCREENSHOTS_DIR, "04_demo_scene3.png")
        page.screenshot(path=screenshot_4)
        print(f"  ✓ Scene 3 verified (Human-in-the-loop mentor check). Screenshot: {screenshot_4}")

        # -------------------------------------------------------------
        # TEST 5: DEMO CONTROLLER - SCENE 4 & MEMORY SIMULATOR
        # -------------------------------------------------------------
        print("\n[Step 5/8] 🧠 Testing Judge Demo - Scene 4: Agentic Adaptation & Interactive Memory Model")
        btn_scene4 = page.locator("button:has-text('Next: Scene 4')").first
        btn_scene4.wait_for(state="visible", timeout=10000)
        btn_scene4.click()
        time.sleep(1.5)

        expect(page.locator("text=Intervention V1 Failed Verification").first).to_be_visible(timeout=10000)
        expect(page.locator("text=Interactive RAM Memory Layout").first).to_be_visible()

        screenshot_5a = os.path.join(SCREENSHOTS_DIR, "05_demo_scene4_initial.png")
        page.screenshot(path=screenshot_5a)
        print(f"  ✓ Scene 4 loaded with Memory Simulator. Screenshot: {screenshot_5a}")

        # Test Memory Simulator Interactive Dangling Bug
        print("  - Interacting with Memory Simulator: Triggering Dangling Bug...")
        test_dangling_btn = page.locator("button:has-text('Test Dangling Bug')").first
        test_dangling_btn.click()
        time.sleep(1)

        expect(page.locator("text=CRITICAL FAULT: Pointer variable 'head' is dangling").first).to_be_visible()
        screenshot_5b = os.path.join(SCREENSHOTS_DIR, "05_demo_scene4_dangling_fault.png")
        page.screenshot(path=screenshot_5b)
        print(f"  ✓ Dangling bug triggered & detected. Screenshot: {screenshot_5b}")

        # Apply Fix in Memory Simulator
        print("  - Interacting with Memory Simulator: Applying Fix (head = NULL)...")
        apply_fix_btn = page.locator("button:has-text('Apply Fix: head = NULL →')").first
        apply_fix_btn.click()
        time.sleep(1)

        expect(page.locator("text=DEFENSIVE NULL SAFETY VERIFIED").first).to_be_visible()
        screenshot_5c = os.path.join(SCREENSHOTS_DIR, "05_demo_scene4_fix_applied.png")
        page.screenshot(path=screenshot_5c)
        print(f"  ✓ Fix applied successfully. Screenshot: {screenshot_5c}")

        # Step Forward
        print("  - Stepping through memory simulation...")
        next_step_btn = page.locator("button:has-text('Next Step →')").first
        if next_step_btn.is_visible():
            next_step_btn.click()
            time.sleep(0.5)

        # -------------------------------------------------------------
        # TEST 6: DEMO CONTROLLER - SCENE 5 & ADVERSARIAL FORGERY BARRIER
        # -------------------------------------------------------------
        print("\n[Step 6/8] 🛡️ Testing Judge Demo - Scene 5: Empirical Proof & Adversarial Barrier")
        btn_scene5 = page.locator("button:has-text('Next: Scene 5')").first
        btn_scene5.wait_for(state="visible", timeout=10000)
        btn_scene5.click()
        time.sleep(1.5)

        expect(page.locator("text=Knowledge Debt → REPAID").first).to_be_visible(timeout=10000)
        expect(page.locator("button:has-text('Attempt Adversarial Forgery (Self-Report REPAID)')").first).to_be_visible(timeout=10000)

        screenshot_6a = os.path.join(SCREENSHOTS_DIR, "06_demo_scene5_repaid.png")
        page.screenshot(path=screenshot_6a)
        print(f"  ✓ Scene 5 loaded. Screenshot: {screenshot_6a}")

        # Click the red adversarial forgery button
        print("  - Triggering live Adversarial Security Barrier Test...")
        adversarial_btn = page.locator("button:has-text('Attempt Adversarial Forgery (Self-Report REPAID)')").first
        adversarial_btn.click()
        time.sleep(1.5)

        # Verify the security barrier blocked it and returned 400
        expect(page.locator("text=STATUS: ATTACK_BLOCKED (HTTP 400)").first).to_be_visible()
        expect(page.locator("text=InvalidStateTransitionError: Cannot transition to REPAID without passing empirical verification evidence.").first).to_be_visible()
        expect(page.locator("text=Integrity Guarantee: Neither student nor LLM prompt injection can mutate academic mastery state directly.").first).to_be_visible()

        screenshot_6b = os.path.join(SCREENSHOTS_DIR, "06_demo_scene5_adversarial_rejected.png")
        page.screenshot(path=screenshot_6b)
        print(f"  ✓ Live Adversarial attack successfully intercepted and rejected (HTTP 400)! Screenshot: {screenshot_6b}")

        # -------------------------------------------------------------
        # TEST 7: AUTHENTICATION & DASHBOARD
        # -------------------------------------------------------------
        print("\n[Step 7/8] 📊 Testing Authentication & Dashboard (/dashboard)")
        page.goto(f"{FRONTEND_URL}/login", wait_until="networkidle")
        time.sleep(1)

        # Sign In
        page.fill("input[placeholder*='arun@example.com']", "arun@example.com")
        page.fill("input[placeholder='••••••••']", "password123")
        page.click("button:has-text('Sign In')")
        time.sleep(2)

        # Should be redirected to /dashboard
        expect(page.locator("text=Knowledge Debt Score").first).to_be_visible()
        expect(page.locator("text=Active Debt").first).to_be_visible()

        screenshot_7 = os.path.join(SCREENSHOTS_DIR, "07_dashboard.png")
        page.screenshot(path=screenshot_7)
        print(f"  ✓ Dashboard loaded with real debts from SQLite backend. Screenshot: {screenshot_7}")

        # -------------------------------------------------------------
        # TEST 8: STUDENT DETAIL & PREREQUISITE DAG GRAPH VIEW
        # -------------------------------------------------------------
        print("\n[Step 8/8] 🕸️ Testing Student Detail & Interactive Concept Graph (/student/1)")
        page.goto(f"{FRONTEND_URL}/student/1", wait_until="networkidle")
        time.sleep(1.5)

        expect(page.locator("text=Student Ledger: Rahul Sharma").first).to_be_visible()
        expect(page.locator("text=Pointer Dereferencing").first).to_be_visible()

        # Switch to Prerequisite DAG view
        print("  - Switching view to Prerequisite DAG...")
        page.click("button:has-text('Prerequisite DAG')")
        time.sleep(2)

        # Verify DebtGraph container exists
        expect(page.locator("text=Live Prerequisite Dependency DAG (49 Concepts").first).to_be_visible()
        screenshot_8 = os.path.join(SCREENSHOTS_DIR, "08_student_dag_graph.png")
        page.screenshot(path=screenshot_8)
        print(f"  ✓ 49-Concept Interactive DAG rendered live. Screenshot: {screenshot_8}")

        # Also check Evidence trail
        page.goto(f"{FRONTEND_URL}/evidence", wait_until="networkidle")
        time.sleep(1.5)
        expect(page.locator("text=Comprehensive Evidence Signal Trail").first).to_be_visible()
        screenshot_9 = os.path.join(SCREENSHOTS_DIR, "09_evidence_trail.png")
        page.screenshot(path=screenshot_9)
        print(f"  ✓ Evidence Ledger rendered live. Screenshot: {screenshot_9}")

        # Also check Interventions page
        page.goto(f"{FRONTEND_URL}/interventions", wait_until="networkidle")
        time.sleep(1.5)
        expect(page.locator("text=Intervention Strategies").first).to_be_visible()
        expect(page.locator("text=AI Remediation").first).to_be_visible()
        screenshot_10 = os.path.join(SCREENSHOTS_DIR, "10_interventions_page.png")
        page.screenshot(path=screenshot_10)
        print(f"  ✓ Interventions page rendered live. Screenshot: {screenshot_10}")

        browser.close()

    # Reset demo state to Scene 1 pristine baseline
    import httpx
    try:
        httpx.post(f"{BACKEND_URL}/api/demo/reset", timeout=5.0)
        print("\n  ✓ Demo state reset back to pristine Scene 1 baseline.")
    except Exception as e:
        print(f"\n  ! Warning: could not reset demo state: {e}")

    print("\n================================================================")
    print("🎯 LIVE WALKTHROUGH TEST AUDIT SUMMARY")
    print("================================================================")
    print(f"Total Page Runtime Errors: {len(page_errors)}")
    if page_errors:
        for err in page_errors:
            print(f"  - ERROR: {err}")
    
    print(f"Total Unexpected Backend Network Errors: {len(network_errors)}")
    if network_errors:
        for err in network_errors:
            print(f"  - NETWORK ERROR: {err}")

    assert len(page_errors) == 0, f"Page errors detected: {page_errors}"
    assert len(network_errors) == 0, f"Backend network errors detected: {network_errors}"

    print("\n✨ ALL 8 LIVE TESTING STEPS COMPLETED WITH 100% SUCCESS!")
    print("All views rendered cleanly, interactive components worked, API calls succeeded,")
    print("and the Adversarial Security Barrier successfully protected data integrity live.")

if __name__ == "__main__":
    run_walkthrough()
