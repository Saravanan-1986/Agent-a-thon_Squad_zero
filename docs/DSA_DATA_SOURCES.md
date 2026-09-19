# DSA Educational Dataset & Knowledge Graph Specification

## Overview
The Data Structures & Algorithms (DSA) dataset forms the core educational domain of the Knowledge Debt Engine vertical slice.

## Files Structure
- `data/dsa/subjects.json`: Subject metadata for Data Structures & Algorithms.
- `data/dsa/concepts.json`: 46 core DSA concepts categorized into 13 groups.
- `data/dsa/prerequisites.json`: 38 directed prerequisite dependency edges with strength weights.
- `data/dsa/questions.json`: 41 questions across 5 taxonomy types.

## 13 Concept Categories
1. **Foundations & Math:** Time/Space Complexity, Big-O Notation, Recursion Fundamentals.
2. **Arrays & Strings:** 1D Arrays, 2D Arrays/Matrices, String Manipulation, Two Pointers, Sliding Window.
3. **Linked Lists:** Singly Linked Lists, Doubly Linked Lists, Circular Linked Lists, Fast & Slow Pointers.
4. **Stacks & Queues:** Stack Operations, Monotonic Stack, Queue Operations, Deque, Priority Queue.
5. **Trees:** Binary Trees, Binary Search Trees (BST), Tree Traversals (In/Pre/Post/Level), Balanced Trees (AVL/Red-Black).
6. **Heaps:** Min Heap, Max Heap, Heapify & Heap Sort.
7. **Hashing:** Hash Functions, Collision Resolution, Hash Maps & Hash Sets.
8. **Graphs:** Graph Representation (Adj Matrix/List), BFS, DFS, Topological Sort, Dijkstra's Algorithm.
9. **Sorting & Searching:** Binary Search, Quick Sort, Merge Sort, Counting/Radix Sort.
10. **Dynamic Programming:** 1D DP, 2D DP, Knapsack Problem, Longest Common Subsequence.
11. **Greedy Algorithms:** Greedy Choice Property, Interval Scheduling, Huffman Coding.
12. **Backtracking:** N-Queens, Subsets & Permutations, Sudoku Solver.
13. **Advanced Structures:** Trie, Disjoint Set Union (DSU), Segment Tree.

## Question Taxonomy Types
- `MCQ`: Standard multiple choice testing conceptual definitions.
- `SCENARIO`: Problem scenario asking for optimal algorithm selection.
- `TRACE`: Code execution state tracing (evaluating variable values after loops/pointer changes).
- `CODE_READING`: Identifying bugs or output of code snippets.
- `CODING`: Freeform logic or code snippet construction.
