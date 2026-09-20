import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitCommit, 
  Filter, 
  Sparkles, 
  Search,
  Activity,
  History,
  ChevronRight,
  Zap,
  Info
} from 'lucide-react';
import { getKnowledgeGraph } from '../services/api';
import { stateLabel } from './ui/stateMapper';

export default function DebtGraph({ studentId = 1, activeCausalPath = null }) {
  const [graphData, setGraphData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [simulatedPath, setSimulatedPath] = useState(activeCausalPath);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGraph() {
      setLoading(true);
      try {
        const data = await getKnowledgeGraph(studentId);
        setGraphData(data);
      } catch (err) {
        console.error('Failed to load knowledge graph:', err);
      } finally {
        setLoading(false);
      }
    }
    loadGraph();
  }, [studentId]);

  useEffect(() => {
    if (activeCausalPath) {
      setSimulatedPath(activeCausalPath);
    }
  }, [activeCausalPath]);

  if (loading || !graphData) {
    return (
      <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-8 border border-slate-200/80 dark:border-white/10 text-center text-xs text-[#5F6788] dark:text-[#94A3B8]">
        <GitCommit className="w-8 h-8 mx-auto text-[#FF6A2B] animate-spin mb-2" />
        <p>Loading Prerequisite Knowledge Graph...</p>
      </div>
    );
  }

  const { nodes = [], edges = [], categories = [] } = graphData;

  const filteredNodes = nodes.filter((n) => {
    const matchesCategory = selectedCategory === 'All' || n.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isNodeInCausalPath = (nodeName) => {
    if (!simulatedPath || !Array.isArray(simulatedPath)) return false;
    return simulatedPath.some(p => 
      p.toLowerCase().includes(nodeName.toLowerCase()) || 
      nodeName.toLowerCase().includes(p.toLowerCase())
    );
  };

  return (
    <div className="bg-card-light dark:bg-card-dark rounded-[20px] p-6 border border-slate-200/80 dark:border-white/10 shadow-soft space-y-5 text-[#1B2150] dark:text-[#F1F5F9]">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div>
          <h3 className="text-base font-bold text-[#1B2150] dark:text-[#F1F5F9] flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-[#FF6A2B]" />
            Prerequisite Topic Flow ({nodes.length} Topics)
          </h3>
          <p className="text-xs text-[#5F6788] dark:text-[#94A3B8] mt-0.5">
            Red arrows highlight prerequisite topics where errors flow downstream to dependent concepts.
          </p>
        </div>
      </div>

      {/* Domain Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[#8C94B2] font-semibold text-xs shrink-0 mr-1">Domain:</span>
          {['All', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-bold cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#5B4BFF] text-white'
                  : 'bg-white dark:bg-[#22295E] text-[#5F6788] dark:text-[#94A3B8] hover:text-[#1B2150] dark:hover:text-white border border-slate-200 dark:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-52">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94B2]" />
          <input
            type="text"
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
          />
        </div>
      </div>

      {/* Topics Grid */}
      <div className="p-4 rounded-[20px] bg-slate-100/70 dark:bg-[#121633] border border-slate-200/50 dark:border-white/5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredNodes.map((node) => {
            const isRepaid = node.status === 'REPAID' || node.status === 'CLEAR';
            const isActiveDebt = ['CONFIRMED_DEBT', 'IN_INTERVENTION', 'VERIFYING', 'FAILED', 'ESCALATED'].includes(node.status);
            const inCausalPath = isNodeInCausalPath(node.name);

            let cardBg = 'bg-white dark:bg-[#22295E] border-slate-200 dark:border-white/10';
            if (isRepaid) cardBg = 'bg-[#E8FDF2] border-[#12B76A] text-[#027A48]';
            if (isActiveDebt) cardBg = 'bg-[#FEE4E2] border-[#F04438] text-[#B42318]';
            if (inCausalPath) cardBg = 'bg-[#FFF0EA] border-[#FF6A2B] ring-2 ring-[#FF6A2B]';

            return (
              <div
                key={node.id}
                onClick={() => setSelectedConcept(node)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${cardBg}`}
              >
                <span className="text-[10px] font-bold text-[#8C94B2] block uppercase tracking-wider mb-1">
                  {node.category}
                </span>

                <div className="text-xs font-bold leading-snug line-clamp-2">
                  {node.name}
                </div>

                <div className="mt-2 text-[10px] font-bold">
                  {stateLabel(node.status)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
