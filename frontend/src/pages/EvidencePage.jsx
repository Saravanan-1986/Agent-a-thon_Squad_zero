import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/AppLayout';
import Button from '../components/ui/Button';
import EvidenceTimeline from '../components/EvidenceTimeline';
import { getStudentDebts } from '../services/api';
import { RefreshCw, Search } from 'lucide-react';

export default function EvidencePage() {
  const { selectedStudentId } = useAuth();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResult, setFilterResult] = useState('ALL');

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const d = await getStudentDebts(selectedStudentId || '1');
      setDebts(d || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [selectedStudentId]);

  const allEvidence = debts.flatMap(d => (d.evidence || []).map(e => ({ ...e, concept: d.concept })));
  
  const filteredEvidence = allEvidence.filter(e => {
    const matchesSearch = !searchTerm || 
      (e.concept && e.concept.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.source && e.source.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (filterResult === 'PASS') return e.passed || e.score >= 80;
    if (filterResult === 'FAIL') return !e.passed && e.score < 80;
    return true;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2150] dark:text-[#F1F5F9] tracking-tight">
              Evidence Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-[#5F6788] dark:text-[#94A3B8] font-medium mt-1">
              Complete history of your quiz attempts and check-up scores evaluated against the 80% pass standard.
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={fetchEvidence} icon={RefreshCw}>
            Refresh Results
          </Button>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold">
            {['ALL', 'PASS', 'FAIL'].map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterResult(mode)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  filterResult === mode
                    ? 'bg-[#5B4BFF] text-white'
                    : 'bg-white dark:bg-[#22295E] text-[#5F6788] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10'
                }`}
              >
                {mode === 'ALL' ? 'All Results' : mode === 'PASS' ? 'Passed (80%+)' : 'Needs Practice'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C94B2]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic or test..."
              className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-[#22295E] border border-slate-200 dark:border-white/10 text-[#1B2150] dark:text-[#F1F5F9] focus-ring"
            />
          </div>
        </div>

        {/* Evidence Timeline */}
        <EvidenceTimeline evidenceList={filteredEvidence} />

      </div>
    </AppLayout>
  );
}
