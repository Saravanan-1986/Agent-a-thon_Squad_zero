# 🏆 Knowledge Debt Engine — Official 2-Minute Demo Walkthrough

> **Core Philosophy:**  
> *"LLM proposes. Human mentor reviews. Empirical evidence decides."*

This document provides the exact **click-by-click presenter script**, **2-minute timing benchmarks**, and **judge Q&A defense playbooks** for the Knowledge Debt Engine live demonstration.

---

## ⚡ 1. The 30-Second Pitch (Opening Hook)

> *"Every learning platform does the same thing: when a student fails a Linked Lists question, it says 'Wrong answer! Here is an explanation of Linked Lists.'*  
>  
> *That’s treating the symptom. In software engineering, when a bug appears downstream, you don't patch the surface—you trace the technical debt back to its root cause.*  
>  
> *The **Knowledge Debt Engine** is a graph-native, stateful multi-agent system that treats learning gaps like technical debt. By recursively traversing a 49-concept prerequisite DAG, our Diagnosis Agent discovers that student Rahul actually failed Linked Lists because of unresolved debt in **Pointer Dereferencing**. When passive text explanations fail, our agent dynamically adapts to an interactive RAM memory simulation. And most importantly: **mastery can never be self-reported or hallucinated by an LLM—only fresh empirical evidence can retire the debt**."*

---

## 🎬 2. The 5-Scene Click-by-Click Demo Playbook

Open **`http://localhost:5173/demo`** in your browser (or click **"Judge Pitch"** in the top navigation).

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
  │ Scene 1 │ ──► │ Scene 2 │ ──► │ Scene 3 │ ──► │ Scene 4 │ ──► │ Scene 5 │
  └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
    Student          Graph           Mentor           Agentic        Empirical
    Profile        Root Cause       Approval        Adaptation         Proof
  (Noise vs Debt)  (DAG vs RAG)    (Governance)     (RAM Model)     (& Rejection)
```

---

### **Scene 1: Persistent Debt vs. Careless Slip (0:00 - 0:25)**
* **Action:** Click **"Scene 1"** tab.
* **On Screen:**
  - 4-Card student ledger for **Rahul Sharma**:
    - `Arrays`: **REPAID** (Passing verification: 95%).
    - `Pointers`: **ACTIVE DEBT** (Pulsing Red, High Severity, Quiz: 42%, Coding: 0%, Retake: 45%).
    - `Linked Lists`: **SUSPECTED** (Amber, 1 single slip: 35%).
    - `Trees`: **CLEAR** (Gray, no accumulated debt).
  - Scikit-Learn Knowledge Gap Risk Card: **76.7% (HIGH RISK)**.
  - Empirical Evidence Trail Table.
* **Presenter Script:**
  > *"Meet Rahul Sharma. Notice our first core differentiator: the system does NOT panic on a single wrong answer. When Rahul slipped on Linked Lists once, it was flagged as `SUSPECTED`—because one error could simply be a careless typo. But in Pointer Dereferencing, repeated empirical failures triggered our Scikit-Learn ML classifier to confirm real, high-severity Knowledge Debt."*

---

### **Scene 2: The 'WOW' Moment — Prerequisite DAG Traversal (0:25 - 0:50)**
* **Action:** Click **"Next: Scene 2 →"** button.
* **On Screen:**
  - Side-by-side comparison:
    - ❌ **Naive Vector RAG**: Surface text match $\rightarrow$ prescribes more Linked List videos $\rightarrow$ student gets frustrated and fails again.
    - ✅ **Knowledge Debt DAG**: Multi-hop recursive graph traversal:
      $$\text{Linked List Traversal ❌} \longrightarrow \text{Pointer Dereferencing ⚠️ (ROOT CAUSE)} \longrightarrow \text{Memory Model 🟢}$$
  - Live interactive **49-concept DAG**: Click the glowing **"Simulate Root-Cause Trace"** button to see the causal path glow across the curriculum.
* **Presenter Script:**
  > *"Now Rahul attempts Linked Lists and fails. A vector database or naive RAG platform matches text keywords and suggests more Linked List videos. But our Recursive Diagnosis Agent traverses the prerequisite DAG backwards. It confirms that the Memory Model foundation is solid, but isolates the true root cause: Pointer Dereferencing. We fix the foundation, not just the symptom."*

---

### **Scene 3: AI Proposes, Human Mentor Approves (0:50 - 1:15)**
* **Action:** Click **"Next: Scene 3 →"** button.
* **On Screen:**
  - AI-Proposed Intervention $V_1$ (Conceptual explanation + memory diagram + practice MCQs).
  - **Faculty Mentor Review Desk**: Approved by **Dr. Elena Vance** (Head of Systems & Algorithms).
  - Immutable audit trail record: `MENTOR_APPROVED`.
* **Presenter Script:**
  > *"Autonomous AI without governance is dangerous in education. In our architecture, the LLM generates a targeted remediation plan ($V_1$), but it is locked in `MENTOR_REVIEW`. Dr. Elena Vance verifies and approves the pedagogical strategy before it ever reaches the student. Zero unverified hallucinations."*

---

### **Scene 4: AI Fails & Adapts — Agentic Strategy Pivot (1:15 - 1:40)**
* **Action:** Click **"Next: Scene 4 →"** button.
* **On Screen:**
  - Verification attempt: Rahul scores **45% (FAIL)** on $V_1$.
  - Agentic Adaptation Banner: The system does **not** repeat the same lesson louder.
  - Live **Interactive Physical RAM Simulator**:
    - 32-bit hardware hex table (`0x1000`, `0x1004`, `0x1008`, `0x100C`).
    - Stack frames vs Heap objects `[ data: 42 | next ptr: 0x100C ]`.
    - Click **"Test Dangling Bug"** to show memory corruption / `SIGSEGV` warning!
    - Click **"Apply Fix"** to see defensive pointer nullification (`head = NULL`).
* **Presenter Script:**
  > *"Here is true agentic intelligence: Rahul attempts verification on $V_1$ and fails with 45%. Traditional LMS platforms repeat the exact same lesson louder. Our Intervention Agent detects the failure, injects the error context into Gemini, and dynamically pivots to Intervention $V_2$—an interactive physical RAM visualizer where Rahul inspects heap addresses and debugs dangling pointers interactively."*

---

### **Scene 5: Empirical Proof & The Adversarial Punchline (1:40 - 2:00)**
* **Action:** Click **"Next: Scene 5 →"** button.
* **On Screen:**
  - Fresh, unseen transfer question evaluated by the Verification Agent: **Score 88% PASS**.
  - State machine transition banner: `IN_INTERVENTION` $\rightarrow$ `FOLLOW_UP` $\rightarrow$ `VERIFYING` $\rightarrow$ **`REPAID ✓`**.
  - Philosophy banner: *"The AI didn't decide the student learned. The evidence did."*
  - **Live Adversarial Anti-Tamper Security Test**: Click the red button: **"Attempt Adversarial Forgery (Self-Report REPAID)"**.
  - Live backend **HTTP 400 rejection modal**:
    ```json
    {
      "status": "ATTACK_BLOCKED",
      "http_status": 400,
      "security_rule": "LLM proposes. Evidence decides.",
      "error_message": "InvalidStateTransitionError: Cannot transition to REPAID without passing empirical verification evidence."
    }
    ```
* **Presenter Script:**
  > *"Finally, Rahul takes a fresh unseen transfer challenge and scores 88%. The deterministic backend validates the empirical evidence and retires the debt to REPAID.  
  >  
  > To close: What happens if a student tries prompt injection or self-reports mastery? Watch this—I click 'Attempt Adversarial Forgery'. The backend immediately throws an HTTP 400 rejection. In the Knowledge Debt Engine, the LLM is an advisor; the evidence is the law."*

---

## 🛡️ 3. Judge Q&A Defense Playbook

### **Q1: "Why not just use LangChain with Vector RAG?"**
> **Answer:** *"Vector search matches semantic similarity in text space. When a student fails a Linked List question, vector search finds 'Linked List' documents and gives them more of the same. But learning is hierarchical, not semantic. A student failing linked lists is almost always failing because of upstream pointer indirection or memory management. A DAG captures causality; vector search only captures correlation."*

### **Q2: "What prevents the LLM from hallucinating that a student has mastered a topic?"**
> **Answer:** *"Our database repository has an architectural invariant: no LLM output has write access to the state column. Only the deterministic Python state machine can write `REPAID`, and it strictly requires an `evidence_id` pointing to a verified score $\ge 70\%$ on an unseen transfer question. If you ask Gemini to set `REPAID`, the backend throws `InvalidStateTransitionError`."*

### **Q3: "How does the system scale beyond DSA?"**
> **Answer:** *"The entire engine is domain-agnostic. The curriculum is defined by two JSON specifications: concepts and directed prerequisite edges. We already have schemas ready for Database Normalization (1NF $\rightarrow$ 2NF $\rightarrow$ 3NF $\rightarrow$ BCNF) and Operating Systems (Virtual Memory $\rightarrow$ Page Tables $\rightarrow$ TLB). Any subject with prerequisite dependencies drops right in."*

### **Q4: "What happens if Gemini or internet connectivity goes down during the demo?"**
> **Answer:** *"Our `MultiModelEngine` uses automatic multi-tier fallback: Google Gemini REST $\rightarrow$ OpenRouter $\rightarrow$ Local Deterministic Fallback Templates. The system operates with 100% zero-crash guarantee even fully offline."*

---

## 🚀 4. How to Launch the Demo in 2 Commands

```powershell
# Terminal 1: Backend API
$env:PYTHONPATH="."
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

* Navigate to: **`http://localhost:5173/demo`**
* Click **"Auto-Play Pitch"** for automated presentation mode, or step manually using the 15-second cues.
