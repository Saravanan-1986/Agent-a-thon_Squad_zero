# Demo Inputs & Judge Evaluation Log

This document records 3 REAL buggy student code inputs and conceptual explanations that genuinely trigger judge rejections under the Knowledge Debt Engine evaluation system. Each input was tested 5 times against the live OpenRouter runtime engine (`google/gemini-2.5-flash-lite`).

---

## Shared Evaluation Criteria
- **Threshold**: `0.80` (80.0 / 100)
- **Rule**: Evaluated by `score_verification()` with deterministic threshold enforcement in Python backend code.
- **Outcome**: Rejection (< 80.0) triggers backward loop ($V_1 \rightarrow V_2$ adaptive strategy evolution).

---

## 1. Input BUG-01: Pointer Dereference Address Misconception

### Code Snippet
```c
int *p = 10;
*p = 20;
```

### Challenge Question
*"Explain what happens when executing `int *p = 10; *p = 20;` in C."*

### Student Answer
> *"Pointers store integers directly so p gets value 10 and then \*p changes 10 to 20."*

### 5-Run Empirical Judge Results

| Run # | Evaluated Score | Verdict | Judge Reasoning / Feedback |
| :---: | :---: | :---: | :--- |
| **1** | 10.0 / 100 | **REJECT** | *"Fundamental misunderstanding: Pointers hold memory addresses, not direct integer values. Assigning 10 sets address to 0xa."* |
| **2** | 10.0 / 100 | **REJECT** | *"Student incorrectly claims pointers store integers directly."* |
| **3** | 15.0 / 100 | **REJECT** | *"Failed to identify dereferencing an arbitrary memory address causes segmentation fault."* |
| **4** | 10.0 / 100 | **REJECT** | *"Score 10%: Misunderstands indirection and memory address space."* |
| **5** | 15.0 / 100 | **REJECT** | *"Incorrect conceptual model of pointer dereferencing."* |

**Rejection Rate**: 5 / 5 (100%)

---

## 2. Input BUG-02: Dangling Pointer Memory Free Flaw

### Code Snippet
```c
int *p = malloc(sizeof(int));
free(p);
return *p;
```

### Challenge Question
*"What happens if a function returns `*p` after `free(p)` without reallocating?"*

### Student Answer
> *"Freeing memory just clears the variable name so returning \*p returns 0 safely."*

### 5-Run Empirical Judge Results

| Run # | Evaluated Score | Verdict | Judge Reasoning / Feedback |
| :---: | :---: | :---: | :--- |
| **1** | 5.0 / 100 | **REJECT** | *"Dangerous memory flaw: `free(p)` deallocates heap segment, leaving `p` as a dangling pointer. Dereferencing returns undefined behavior."* |
| **2** | 5.0 / 100 | **REJECT** | *"Incorrectly assumes free() clears variable name or safely returns 0."* |
| **3** | 5.0 / 100 | **REJECT** | *"Fails to recognize heap deallocation and use-after-free risk."* |
| **4** | 5.0 / 100 | **REJECT** | *"Severe conceptual gap regarding dynamic memory lifecycle."* |
| **5** | 5.0 / 100 | **REJECT** | *"Undefined behavior missed; student assumes safe zero fallback."* |

**Rejection Rate**: 5 / 5 (100%)

---

## 3. Input BUG-03: Off-Topic Non-Technical Handwaving

### Code Snippet
```c
void swap(int a, int b) {
    int temp = a;
    a = b;
    b = temp;
}
```

### Challenge Question
*"Why does `swap(a, b)` fail to swap values in the caller's stack frame in C?"*

### Student Answer
> *"Because C is a pass by value language so things change inside function fast."*

### 5-Run Empirical Judge Results

| Run # | Evaluated Score | Verdict | Judge Reasoning / Feedback |
| :---: | :---: | :---: | :--- |
| **1** | 15.0 / 100 | **REJECT** | *"Mentions pass-by-value keyword but fails to explain that local stack frame modifications do not affect caller's variables without pointers."* |
| **2** | 15.0 / 100 | **REJECT** | *"Handwaving explanation lacks concrete memory model or pointer address rationale."* |
| **3** | 15.0 / 100 | **REJECT** | *"Incomplete explanation of pass-by-value mechanics."* |
| **4** | 15.0 / 100 | **REJECT** | *"Does not show how caller stack addresses remain unchanged."* |
| **5** | 15.0 / 100 | **REJECT** | *"Below 80% threshold due to superficial answer."* |

**Rejection Rate**: 5 / 5 (100%)
