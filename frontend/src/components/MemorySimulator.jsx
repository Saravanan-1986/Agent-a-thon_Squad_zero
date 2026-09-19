import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  ArrowRight, 
  CornerDownRight, 
  ShieldCheck, 
  Flame, 
  Layers,
  HelpCircle,
  Zap,
  Activity
} from 'lucide-react';
import Button from './ui/Button';

export default function MemorySimulator({ initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [crashTriggered, setCrashTriggered] = useState(false);

  const STEPS = [
    {
      step: 1,
      title: "1. Pointer Declaration & Heap Allocation",
      code: "Node* head = (Node*)malloc(sizeof(Node));\nhead->data = 42;\nhead->next = NULL;",
      explanation: "Pointer variable 'head' lives on the STACK at 0x7FFE. malloc() requests 8 bytes from the OS on the HEAP at 0x1004. 'head' stores 0x1004 as its value.",
      stack: [
        { name: "head", address: "0x7FFE", value: "0x1004", target: "0x1004", active: true }
      ],
      nodes: [
        { address: "0x1004", data: 42, next: "NULL (0x0)", target: null, allocated: true, active: true }
      ],
      ramGrid: [
        { addr: "0x1000", val: "0x00000000", tag: "System Reserved", status: "idle" },
        { addr: "0x1004", val: "0x0000002A", tag: "head->data (42)", status: "allocated" },
        { addr: "0x1008", val: "0x00000000", tag: "head->next (NULL)", status: "allocated" },
        { addr: "0x100C", val: "0x00000000", tag: "Unallocated Heap", status: "idle" }
      ],
      status: "SAFE",
      statusLabel: "NORMAL ALLOCATION"
    },
    {
      step: 2,
      title: "2. Second Node Allocation & Pointer Linking",
      code: "Node* second = (Node*)malloc(sizeof(Node));\nsecond->data = 99;\nhead->next = second; // Store address 0x100C into head->next",
      explanation: "A second node is created at 0x100C. Dereferencing 'head->next' updates the pointer field at 0x1008 with address 0x100C, physically connecting the two nodes.",
      stack: [
        { name: "head", address: "0x7FFE", value: "0x1004", target: "0x1004", active: false },
        { name: "second", address: "0x7FF6", value: "0x100C", target: "0x100C", active: true }
      ],
      nodes: [
        { address: "0x1004", data: 42, next: "0x100C", target: "0x100C", allocated: true, active: false },
        { address: "0x100C", data: 99, next: "NULL (0x0)", target: null, allocated: true, active: true }
      ],
      ramGrid: [
        { addr: "0x1000", val: "0x00000000", tag: "System Reserved", status: "idle" },
        { addr: "0x1004", val: "0x0000002A", tag: "head->data (42)", status: "allocated" },
        { addr: "0x1008", val: "0x0000100C", tag: "head->next (0x100C)", status: "pointer" },
        { addr: "0x100C", val: "0x00000063", tag: "second->data (99)", status: "allocated" }
      ],
      status: "SAFE",
      statusLabel: "NODES LINKED (0x1004 -> 0x100C)"
    },
    {
      step: 3,
      title: "3. Traversal Pointer Dereferencing",
      code: "Node* curr = head;\ncurr = curr->next; // Dereference next pointer (0x100C)",
      explanation: "Pointer 'curr' is assigned 0x1004. Evaluating 'curr->next' dereferences address 0x1008 to read 0x100C, advancing 'curr' to the second node.",
      stack: [
        { name: "head", address: "0x7FFE", value: "0x1004", target: "0x1004", active: false },
        { name: "second", address: "0x7FF6", value: "0x100C", target: "0x100C", active: false },
        { name: "curr", address: "0x7FEE", value: "0x100C", target: "0x100C", active: true }
      ],
      nodes: [
        { address: "0x1004", data: 42, next: "0x100C", target: "0x100C", allocated: true, active: false },
        { address: "0x100C", data: 99, next: "NULL (0x0)", target: null, allocated: true, active: true }
      ],
      ramGrid: [
        { addr: "0x1000", val: "0x00000000", tag: "System Reserved", status: "idle" },
        { addr: "0x1004", val: "0x0000002A", tag: "head->data (42)", status: "allocated" },
        { addr: "0x1008", val: "0x0000100C", tag: "head->next (0x100C)", status: "pointer" },
        { addr: "0x100C", val: "0x00000063", tag: "curr->data (99)", status: "active" }
      ],
      status: "SAFE",
      statusLabel: "DEREFERENCE SUCCESSFUL"
    },
    {
      step: 4,
      title: "4. The Fatal Bug: Deallocation Without Nulling (Dangling Pointer)",
      code: "free(head); // Memory returned to OS\n// BUT: 'head' on stack STILL holds 0x1004!\n// *head dereference now causes Undefined Behavior / Crash!",
      explanation: "THE ROOT CAUSE OF RAHUL'S DEBT: free(head) deallocates heap at 0x1004. But 'head' on the stack NEVER changes! It still points to 0x1004. Accessing head->data is now undefined memory corruption!",
      stack: [
        { name: "head (DANGLING!)", address: "0x7FFE", value: "0x1004", target: "0x1004", active: true, error: true },
        { name: "curr", address: "0x7FEE", value: "0x100C", target: "0x100C", active: false }
      ],
      nodes: [
        { address: "0x1004", data: "GARBAGE", next: "0x????", target: null, allocated: false, active: true, error: true },
        { address: "0x100C", data: 99, next: "NULL (0x0)", target: null, allocated: true, active: false }
      ],
      ramGrid: [
        { addr: "0x1000", val: "0x00000000", tag: "System Reserved", status: "idle" },
        { addr: "0x1004", val: "0xDEADBEEF", tag: "FREED (GARBAGE DATA)", status: "freed" },
        { addr: "0x1008", val: "0x00000000", tag: "FREED HEAP BLOCK", status: "freed" },
        { addr: "0x100C", val: "0x00000063", tag: "second->data (99)", status: "allocated" }
      ],
      status: "DANGLING_POINTER",
      statusLabel: "CRITICAL: DANGLING POINTER"
    },
    {
      step: 5,
      title: "5. The Fix: Defensive Pointer Nullification & Null Safety Check",
      code: "head = NULL; // Defend pointer against dangling access\nif (head != NULL) {\n    printf(\"%d\\n\", head->data); // Guarded safe access\n}",
      explanation: "REPAIRED MASTERY: By explicitly assigning 'head = NULL' immediately after free, the pointer is neutralized. Any subsequent check 'if (head != NULL)' safely halts invalid dereferencing.",
      stack: [
        { name: "head", address: "0x7FFE", value: "NULL (0x0)", target: null, active: true, safe: true },
        { name: "curr", address: "0x7FEE", value: "0x100C", target: "0x100C", active: false }
      ],
      nodes: [
        { address: "0x100C", data: 99, next: "NULL (0x0)", target: null, allocated: true, active: false }
      ],
      ramGrid: [
        { addr: "0x1000", val: "0x00000000", tag: "System Reserved", status: "idle" },
        { addr: "0x1004", val: "0x00000000", tag: "OS Free List", status: "idle" },
        { addr: "0x1008", val: "0x00000000", tag: "OS Free List", status: "idle" },
        { addr: "0x100C", val: "0x00000063", tag: "second->data (99)", status: "allocated" }
      ],
      status: "REPAIRED",
      statusLabel: "DEFENSIVE NULL SAFETY VERIFIED"
    }
  ];

  const state = STEPS[currentStep];

  const handleTriggerCrash = () => {
    setCurrentStep(3); // Step 4 (index 3)
    setCrashTriggered(true);
  };

  const handleApplyFix = () => {
    setCurrentStep(4); // Step 5 (index 4)
    setCrashTriggered(false);
  };

  return (
    <div className="bg-white dark:bg-obsidian-950/90 text-slate-900 dark:text-white rounded-3xl border border-slate-200 dark:border-obsidian-750 p-6 shadow-md dark:shadow-2xl space-y-4 font-mono text-xs relative overflow-hidden">
      {/* Top Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-obsidian-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-cyber-500/10 border border-blue-200 dark:border-cyber-500/40 flex items-center justify-center shadow-2xs dark:shadow-glow">
            <Cpu className="w-5 h-5 text-blue-600 dark:text-cyber-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide flex items-center gap-2 font-display">
              Interactive RAM Memory Layout & Pointer Dereferencing Simulator
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
              Visual hardware simulation: Stack addresses, Heap allocation, and Dangling Pointer detection.
            </p>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold border flex items-center gap-1.5 ${
            state.status === 'DANGLING_POINTER'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse shadow-glow-rose'
              : state.status === 'REPAIRED'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-glow-emerald'
              : 'bg-cyber-950/90 text-cyber-300 border-cyber-600 shadow-glow'
          }`}>
            {state.status === 'DANGLING_POINTER' ? (
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            ) : state.status === 'REPAIRED' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-cyber-400" />
            )}
            {state.statusLabel}
          </span>
        </div>
      </div>

      {/* Step Description Banner */}
      <div className="space-y-1.5 bg-slate-50 dark:bg-obsidian-900/90 p-4 rounded-2xl border border-slate-200 dark:border-obsidian-800">
        <div className="font-bold text-blue-700 dark:text-cyber-300 text-xs flex items-center gap-2 font-display">
          <Layers className="w-4 h-4 text-blue-600 dark:text-cyber-400" />
          {state.title}
        </div>
        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed font-sans">{state.explanation}</p>
      </div>

      {/* Code Snippet with Syntax Highlighting */}
      <div className="bg-slate-900 dark:bg-obsidian-950 p-4 rounded-2xl border border-slate-800 text-emerald-400 font-mono text-[11px] overflow-x-auto shadow-inner custom-scrollbar">
        <pre className="leading-relaxed">{state.code}</pre>
      </div>

      {/* Visual Hardware Model: Stack Frames vs Heap Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Stack Frame */}
        <div className="bg-slate-50 dark:bg-obsidian-950/90 rounded-2xl p-4 border border-slate-200 dark:border-obsidian-800 space-y-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-2">
            <span>Stack Frame (Local Scope)</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Auto Lifetime</span>
          </div>

          <div className="space-y-2 pt-1">
            {state.stack.map((v, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                  v.error 
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 shadow-glow-rose' 
                    : v.safe
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/40 shadow-glow-emerald'
                    : v.active 
                    ? 'bg-cyber-950/70 border-cyber-500 text-white ring-1 ring-cyber-500/50 shadow-glow' 
                    : 'bg-obsidian-900/80 border-obsidian-800 text-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-cyber-300 flex items-center gap-1.5 font-display">
                    {v.name}
                    {v.error && <Flame className="w-3.5 h-3.5 text-rose-400 animate-bounce" />}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{v.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 uppercase font-mono">holds address:</div>
                  <span className={`font-bold font-mono text-xs ${
                    v.error ? 'text-rose-400 underline decoration-wavy' : v.safe ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {v.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 2: Visual Heap Nodes (data | next) */}
        <div className="bg-slate-50 dark:bg-obsidian-950/90 rounded-2xl p-4 border border-slate-200 dark:border-obsidian-800 space-y-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-2">
            <span>Heap Objects [data | next]</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">malloc() Heap</span>
          </div>

          <div className="space-y-2 pt-1">
            {state.nodes.map((node, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl border transition-all ${
                  node.error 
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-200 ring-1 ring-rose-400 dark:ring-rose-500' 
                    : node.active 
                    ? 'bg-blue-50 dark:bg-cyber-950/50 border-blue-400 dark:border-cyber-500 text-blue-900 dark:text-white ring-1 ring-blue-400 dark:ring-cyber-500' 
                    : 'bg-white dark:bg-obsidian-900/80 border-slate-200 dark:border-obsidian-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] border-b border-slate-200 dark:border-obsidian-800 pb-1.5 mb-2 text-slate-500 dark:text-slate-400">
                  <span>Address: <strong className="text-amber-600 dark:text-amber-300 font-mono">{node.address}</strong></span>
                  <span className={node.allocated ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                    {node.allocated ? '● ALLOCATED' : '○ FREED / DANGLING'}
                  </span>
                </div>

                {/* Node representation: [ data | next ] */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-obsidian-950 p-2 rounded-xl border border-slate-200 dark:border-obsidian-850 text-center font-mono">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase">data</span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{node.data}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-obsidian-900 border border-slate-200 dark:border-obsidian-800">
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block uppercase">next ptr</span>
                    <span className="font-bold text-xs text-blue-600 dark:text-cyber-300 font-mono">{node.next}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Column 3: Physical RAM Word Grid */}
        <div className="bg-slate-50 dark:bg-obsidian-950/90 rounded-2xl p-4 border border-slate-200 dark:border-obsidian-800 space-y-2.5">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-200 dark:border-obsidian-800 pb-2">
            <span>Physical RAM Grid (32-Bit)</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">Hex Word Address</span>
          </div>

          <div className="space-y-2 pt-1">
            {state.ramGrid.map((cell, i) => (
              <div 
                key={i}
                className={`p-2 px-2.5 rounded-xl border font-mono flex items-center justify-between text-[11px] transition-colors ${
                  cell.status === 'freed'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300'
                    : cell.status === 'pointer'
                    ? 'bg-blue-50 dark:bg-cyber-950/50 border-blue-300 dark:border-cyber-500 text-blue-700 dark:text-cyber-200'
                    : cell.status === 'active' || cell.status === 'allocated'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-200'
                    : 'bg-white dark:bg-obsidian-900/60 border-slate-200 dark:border-obsidian-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400">{cell.addr}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-obsidian-950 text-slate-600 dark:text-slate-300 truncate max-w-[90px] border border-slate-200 dark:border-obsidian-800">
                    {cell.tag}
                  </span>
                </div>
                <span className="font-bold text-[10px]">{cell.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Crash Warning Alert Banner if in Step 4 */}
      {state.status === 'DANGLING_POINTER' && (
        <motion.div 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 dark:bg-rose-950/90 border border-rose-400 dark:border-rose-500 p-4 rounded-2xl flex items-center justify-between text-xs text-rose-800 dark:text-rose-200 animate-pulse"
        >
          <div className="flex items-center gap-2.5 font-bold font-mono">
            <Flame className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0 animate-bounce" />
            <span>CRITICAL FAULT: Pointer variable 'head' is dangling at address 0x1004.</span>
          </div>
          <button
            onClick={handleApplyFix}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white dark:text-obsidian-950 text-xs font-bold font-mono transition-all cursor-pointer"
          >
            Apply Fix: head = NULL →
          </button>
        </motion.div>
      )}

      {/* Interactive Controls & Step-by-Step Navigator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-obsidian-800">
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => { setCurrentStep(0); setCrashTriggered(false); }} 
            icon={RotateCcw}
          >
            Reset
          </Button>

          <button
            onClick={handleTriggerCrash}
            className="px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Flame className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            Test Dangling Bug
          </button>
        </div>

        {/* Step Numbers */}
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentStep(idx); setCrashTriggered(false); }}
              className={`w-7 h-7 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer ${
                currentStep === idx
                  ? 'bg-blue-600 dark:bg-cyber-500 text-white dark:text-obsidian-950 font-extrabold scale-105'
                  : 'bg-slate-100 dark:bg-obsidian-850 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-obsidian-800 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-obsidian-750'
              }`}
            >
              {s.step}
            </button>
          ))}
        </div>

        <Button 
          variant="primary" 
          size="sm" 
          onClick={() => setCurrentStep(c => (c < STEPS.length - 1 ? c + 1 : 0))}
          icon={Play}
          iconPosition="right"
        >
          {currentStep === STEPS.length - 1 ? 'Start Over' : 'Next Step →'}
        </Button>
      </div>
    </div>
  );
}

