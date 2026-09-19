// Initial mock dataset for Knowledge Debt Engine

export const MOCK_STUDENTS = [
  {
    id: "std-101",
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    major: "Computer Science",
    year: "Year 2",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    stats: { totalDebts: 3, activeDebts: 2, repaidDebts: 1, escalated: 0 }
  },
  {
    id: "std-102",
    name: "Priya Sharma",
    email: "priya.sharma@university.edu",
    major: "Software Engineering",
    year: "Year 1",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    stats: { totalDebts: 2, activeDebts: 1, repaidDebts: 1, escalated: 0 }
  },
  {
    id: "std-103",
    name: "Marcus Chen",
    email: "marcus.chen@university.edu",
    major: "Computer Science",
    year: "Year 2",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    stats: { totalDebts: 4, activeDebts: 2, repaidDebts: 1, escalated: 1 }
  }
];

export const PREREQUISITE_CHAIN = [
  { id: "c-1", name: "Programming Basics", level: 1, prerequisites: [] },
  { id: "c-2", name: "Arrays & Indexing", level: 2, prerequisites: ["c-1"] },
  { id: "c-3", name: "Pointers & Memory", level: 3, prerequisites: ["c-2"] },
  { id: "c-4", name: "Linked Lists", level: 4, prerequisites: ["c-3"] },
  { id: "c-5", name: "Trees & Graphs", level: 5, prerequisites: ["c-4"] },
];

export const INITIAL_DEBTS = [
  {
    id: "debt-101-1",
    student_id: "std-101",
    concept_id: "c-4",
    concept: "Linked Lists",
    status: "VERIFYING", // In-progress verification
    severity: "HIGH",
    attempts: 2,
    failed_interventions: 1,
    root_cause: "Incomplete understanding of pointer re-assignment during node deletion causing dangling pointers.",
    last_updated: "2026-09-19 10:15",
    evidence: [
      { id: "ev-1", source: "Lab Assignment 3", score: "35%", passed: false, timestamp: "2026-09-15 14:20", detail: "Segmentation fault during list traversal." },
      { id: "ev-2", source: "Midterm Q4", score: "40%", passed: false, timestamp: "2026-09-17 09:00", detail: "Failed to update head pointer in linked list insertion." },
      { id: "ev-3", source: "Quiz 2 Retake", score: "60%", passed: false, timestamp: "2026-09-18 11:30", detail: "Correct logic for static array, failed dynamic pointer updates." }
    ],
    interventions: [
      {
        id: "int-101-1-v1",
        version: 1,
        content: "### Visualizing Pointer Shifts\nImagine pointers as actual memory addresses. When deleting a node `B` between `A` and `C`, you must connect `A->next` directly to `C` before freeing `B`.",
        strategy: "Visual Diagram & Step-by-Step Traversal",
        mentor_status: "APPROVED",
        created_at: "2026-09-17 16:00"
      },
      {
        id: "int-101-1-v2",
        version: 2,
        version_note: "V2 — Changed strategy after V1 failed verification quiz",
        content: "### Interactive Memory Simulation\nLet's trace execution step-by-step using pseudo-code. Draw memory addresses on paper: address 0x100 points to 0x108. What happens if 0x108 is cleared without reassigning 0x100?",
        strategy: "Memory Trace Simulation",
        mentor_status: "APPROVED",
        created_at: "2026-09-19 08:30"
      }
    ],
    current_question: {
      id: "q-101-ver",
      question: "In C/C++, given a singly linked list `A -> B -> C`, if you delete node `B` without modifying `A->next`, what type of memory error occurs when trying to access `A->next->next`?",
      options: [
        "A) Memory Leak",
        "B) Dangling Pointer / Undefined Behavior",
        "C) Stack Overflow",
        "D) Null Pointer Exception"
      ],
      correct_answer: "B",
      explanation: "`A->next` still points to `B`'s deallocated memory address, creating a dangling pointer."
    }
  },
  {
    id: "debt-101-2",
    student_id: "std-101",
    concept_id: "c-3",
    concept: "Pointers & Memory",
    status: "MENTOR_REVIEW",
    severity: "MEDIUM",
    attempts: 1,
    failed_interventions: 0,
    root_cause: "Confusion between reference operator (`&`) and dereference operator (`*`).",
    last_updated: "2026-09-19 11:00",
    evidence: [
      { id: "ev-4", source: "Lab Assignment 2", score: "45%", passed: false, timestamp: "2026-09-14 16:10", detail: "Passed value instead of pointer reference to helper function." }
    ],
    interventions: [
      {
        id: "int-101-2-v1",
        version: 1,
        content: "### Understanding Pointers vs Values\nAn envelope has an address written on it, and a letter inside. `&x` is the address on the envelope; `*p` is reading the letter inside.",
        strategy: "Analogy-Based Explanation",
        mentor_status: "PENDING",
        created_at: "2026-09-19 10:45"
      }
    ]
  },
  {
    id: "debt-101-3",
    student_id: "std-101",
    concept_id: "c-1",
    concept: "Programming Basics",
    status: "REPAID",
    severity: "LOW",
    attempts: 1,
    failed_interventions: 0,
    root_cause: "Initial syntax confusion with loop conditions.",
    last_updated: "2026-09-10 14:00",
    evidence: [
      { id: "ev-5", source: "Quiz 1", score: "50%", passed: false, timestamp: "2026-09-02 10:00", detail: "Off-by-one error in for-loop." },
      { id: "ev-6", source: "Verification Test 1", score: "100%", passed: true, timestamp: "2026-09-10 14:00", detail: "Correctly solved loop bounds verification quiz." }
    ],
    interventions: [
      {
        id: "int-101-3-v1",
        version: 1,
        content: "Loop conditions evaluate before each iteration body.",
        strategy: "Code Tracing",
        mentor_status: "APPROVED",
        created_at: "2026-09-05 11:00"
      }
    ]
  },
  {
    id: "debt-103-1",
    student_id: "std-103",
    concept_id: "c-5",
    concept: "Trees & Graphs",
    status: "ESCALATED",
    severity: "CRITICAL",
    attempts: 4,
    failed_interventions: 3,
    root_cause: "Persistent difficulty understanding recursive depth-first search base cases after 3 failed interventions.",
    last_updated: "2026-09-18 17:40",
    evidence: [
      { id: "ev-7", source: "Assignment 5", score: "20%", passed: false, timestamp: "2026-09-12 11:00", detail: "Infinite recursion in DFS tree search." },
      { id: "ev-8", source: "Quiz 4", score: "30%", passed: false, timestamp: "2026-09-14 15:30", detail: "Failed tree traversal verification twice." },
      { id: "ev-9", source: "Verification Quiz 3", score: "25%", passed: false, timestamp: "2026-09-18 17:40", detail: "Third automated verification attempt failed." }
    ],
    interventions: [
      {
        id: "int-103-1-v3",
        version: 3,
        version_note: "V3 — Repeated automated failure. ESCALATED to Human Mentor 1-on-1 tutoring.",
        content: "### Human Intervention Required\nThis concept has hit the retry threshold limit (3 automated interventions failed). A 1-on-1 mentor session is required before further automated attempts.",
        strategy: "Human Tutor Escalation",
        mentor_status: "ESCALATED",
        created_at: "2026-09-18 17:45"
      }
    ]
  },
  {
    id: "debt-102-1",
    student_id: "std-102",
    concept_id: "c-2",
    concept: "Arrays & Indexing",
    status: "SUSPECTED",
    severity: "LOW",
    attempts: 1,
    failed_interventions: 0,
    root_cause: "Suspicious pattern: 0-indexed bounds error on array slicing.",
    last_updated: "2026-09-19 09:12",
    evidence: [
      { id: "ev-10", source: "Coding Practice 2", score: "68%", passed: false, timestamp: "2026-09-19 09:12", detail: "Accessed array index out of bounds by 1 element." }
    ],
    interventions: []
  },
  {
    id: "debt-102-2",
    student_id: "std-102",
    concept_id: "c-3",
    concept: "Pointers & Memory",
    status: "REGRESSED",
    severity: "HIGH",
    attempts: 2,
    failed_interventions: 1,
    root_cause: "Previously repaid concept weakened after encountering dynamic allocation in Advanced Data Structures.",
    last_updated: "2026-09-19 10:50",
    evidence: [
      { id: "ev-11", source: "Lab Assignment 4", score: "40%", passed: false, timestamp: "2026-09-19 10:50", detail: "Memory leak detected via Valgrind test." }
    ],
    interventions: [
      {
        id: "int-102-2-v1",
        version: 1,
        version_note: "Regression Intervention — Re-addressing dynamic memory allocation (malloc/free).",
        content: "### Managing Dynamic Memory (Heap vs Stack)\nWhen `malloc` is called, memory is allocated on the Heap. You must pair every `malloc` with a corresponding `free`.",
        strategy: "Memory Lifecycle Refresher",
        mentor_status: "PENDING",
        created_at: "2026-09-19 11:00"
      }
    ]
  }
];

export const INITIAL_MENTOR_QUEUE = [
  {
    intervention_id: "int-101-2-v1",
    debt_id: "debt-101-2",
    student_name: "Alex Rivera",
    concept: "Pointers & Memory",
    version: 1,
    strategy: "Analogy-Based Explanation",
    generated_content: "An envelope has an address written on it, and a letter inside. `&x` is the address on the envelope; `*p` is reading the letter inside. When passing pointers to functions, you give the function the envelope address so it can change the letter inside directly.",
    created_at: "2026-09-19 10:45",
    evidence_summary: "Failed 1 lab assignment (45% score) by passing value instead of reference."
  },
  {
    intervention_id: "int-102-2-v1",
    debt_id: "debt-102-2",
    student_name: "Priya Sharma",
    concept: "Pointers & Memory (Regression)",
    version: 1,
    strategy: "Memory Lifecycle Refresher",
    generated_content: "When using dynamic memory allocation in C (`malloc`), memory allocated on the Heap remains allocated until explicitly released with `free()`. Memory leak occurs when pointer to heap allocation is lost without freeing.",
    created_at: "2026-09-19 11:00",
    evidence_summary: "Valgrind detected 128 bytes leaked in Lab Assignment 4."
  }
];
