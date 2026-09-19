import axios from 'axios';
import {
  MOCK_STUDENTS,
  PREREQUISITE_CHAIN,
  INITIAL_DEBTS,
  INITIAL_MENTOR_QUEUE
} from '../mocks/mockData';

// API base URL from environment variable or default local FastAPI server
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000
});

// In-memory mock state for responsive local fallback if backend is offline
let localDebts = [...INITIAL_DEBTS];
let localMentorQueue = [...INITIAL_MENTOR_QUEUE];
let localStudents = [...MOCK_STUDENTS];

export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Fetch all students from real database
 */
export const getStudents = async () => {
  try {
    const res = await client.get('/api/students');
    if (res.data && res.data.length > 0) {
      return res.data;
    }
    return localStudents;
  } catch (err) {
    console.warn('[API Service] Backend unavailable, returning mock students list:', err.message);
    return localStudents;
  }
};

/**
 * Fetch single student by ID
 */
export const getStudent = async (studentId) => {
  try {
    const res = await client.get(`/api/students/${studentId}`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock student ${studentId}:`, err.message);
    const student = localStudents.find(s => String(s.id) === String(studentId)) || localStudents[0];
    return student;
  }
};

/**
 * Fetch debts ledger for a specific student
 */
export const getStudentDebts = async (studentId) => {
  try {
    const res = await client.get(`/api/students/${studentId}/debts`);
    return res.data?.debts || res.data || [];
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock debts for student ${studentId}:`, err.message);
    return localDebts.filter(d => String(d.student_id) === String(studentId));
  }
};

/**
 * Fetch single debt details
 */
export const getDebt = async (debtId) => {
  try {
    const res = await client.get(`/api/debts/${debtId}`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock debt ${debtId}:`, err.message);
    const debt = localDebts.find(d => String(d.id) === String(debtId));
    if (!debt) throw new Error('Debt not found');
    return debt;
  }
};

/**
 * Submit new evidence entry for a student concept
 */
export const submitEvidence = async (payload) => {
  try {
    const res = await client.post('/api/evidence', payload);
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend unavailable, processing mock evidence submission:', err.message);
    const targetDebt = localDebts.find(d => d.student_id === payload.student_id && d.concept === payload.concept);
    if (targetDebt) {
      targetDebt.evidence.push({
        id: `ev-${Date.now()}`,
        source: payload.source || 'Manual Assessment',
        score: `${payload.score || 40}%`,
        passed: payload.score >= 70,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        detail: payload.detail || 'New evidence submitted.'
      });
      if (payload.score < 70 && targetDebt.status === 'CLEAR') {
        targetDebt.status = 'SUSPECTED';
      }
      return { success: true, debt: targetDebt };
    }
    return { success: true, message: 'Evidence logged' };
  }
};

/**
 * Fetch intervention history for a debt
 */
export const getInterventions = async (debtId) => {
  try {
    const res = await client.get(`/api/debts/${debtId}/interventions`);
    return res.data || [];
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock interventions for ${debtId}:`, err.message);
    const debt = localDebts.find(d => String(d.id) === String(debtId));
    return debt ? debt.interventions || [] : [];
  }
};

/**
 * Submit Mentor decision (Approve | Edit | Reject) for an intervention
 */
export const submitMentorReview = async (interventionId, payload, debtId = 1) => {
  try {
    const targetDebtId = debtId || payload.debt_id || 1;
    const res = await client.post(
      `/api/interventions/${interventionId}/mentor-review?debt_id=${targetDebtId}`,
      payload
    );
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, applying mock mentor review for ${interventionId}:`, err.message);
    const queueIndex = localMentorQueue.findIndex(item => item.intervention_id === interventionId);
    const pendingItem = localMentorQueue[queueIndex];
    
    if (pendingItem) {
      const debt = localDebts.find(d => d.id === pendingItem.debt_id);
      if (debt) {
        if (payload.decision === 'approve' || payload.decision === 'edit') {
          debt.status = 'IN_INTERVENTION';
          const intObj = debt.interventions?.find(i => i.id === interventionId);
          if (intObj) {
            intObj.mentor_status = 'APPROVED';
            if (payload.edited_content) {
              intObj.content = payload.edited_content;
            }
          }
        } else if (payload.decision === 'reject') {
          debt.status = 'FAILED';
          debt.failed_interventions = (debt.failed_interventions || 0) + 1;
        }
      }
      localMentorQueue.splice(queueIndex, 1);
    }
    return { success: true, decision: payload.decision };
  }
};

/**
 * Submit student verification quiz answer
 * STRICT PRINCIPLE: Evidence decides state transition.
 */
export const submitVerification = async (debtId, payload) => {
  try {
    const backendPayload = {
      debt_id: parseInt(debtId, 10) || 1,
      question: payload.question || 'Transfer Verification Question',
      student_answer: payload.student_answer || payload.answer || ''
    };
    const res = await client.post(`/api/debts/${debtId}/verify`, backendPayload);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, processing mock verification for debt ${debtId}:`, err.message);
    const debt = localDebts.find(d => String(d.id) === String(debtId));
    if (!debt) throw new Error('Debt not found');

    const isCorrect = (payload.student_answer || payload.answer || '').trim().length > 10;

    if (isCorrect) {
      debt.status = 'REPAID';
      return {
        passed: true,
        score: 88.0,
        new_debt_status: 'REPAID',
        feedback: 'Passing score achieved on verification exercise.'
      };
    } else {
      debt.failed_interventions = (debt.failed_interventions || 0) + 1;
      debt.status = debt.failed_interventions >= 3 ? 'ESCALATED' : 'FAILED';
      return {
        passed: false,
        score: 35.0,
        new_debt_status: debt.status,
        feedback: 'Submission did not demonstrate conceptual mastery.'
      };
    }
  }
};

/**
 * Fetch pending interventions awaiting mentor review
 */
export const getPendingReviews = async () => {
  try {
    const res = await client.get('/api/mentor/pending-review');
    return res.data?.interventions || [];
  } catch (err) {
    console.warn('[API Service] Backend unavailable, returning mock pending mentor queue:', err.message);
    return localMentorQueue;
  }
};

/**
 * Fetch full interactive DSA Knowledge Graph (49 concepts DAG)
 */
export const getKnowledgeGraph = async (studentId = 1) => {
  try {
    const res = await client.get(`/api/graph/dsa?student_id=${studentId}`);
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend graph unavailable, returning fallback graph:', err.message);
    return {
      subject: 'DSA',
      nodes: PREREQUISITE_CHAIN.map(c => ({
        id: c.id,
        name: c.name,
        category: 'Core',
        status: 'CLEAR'
      })),
      edges: []
    };
  }
};

/**
 * Run a specific scene in the 1-Click Guided Pitch Mode
 */
export const runDemoScene = async (sceneNumber) => {
  try {
    const res = await client.post(`/api/demo/scene/${sceneNumber}`);
    return res.data;
  } catch (err) {
    console.error(`[API Service] Failed to execute Demo Scene ${sceneNumber}:`, err.message);
    throw err;
  }
};

/**
 * Execute live adversarial attack security barrier test
 */
export const runAdversarialTest = async (payload = {}) => {
  try {
    const res = await client.post('/api/demo/adversarial-test', {
      attempted_action: payload.action || 'force_repaid',
      student_claim: payload.claim || 'I understand pointers now, mark me as REPAID.'
    });
    return res.data;
  } catch (err) {
    console.error('[API Service] Failed to execute adversarial test:', err.message);
    throw err;
  }
};

/**
 * Reset Demo state back to initial clean state
 */
export const resetDemoState = async () => {
  try {
    await client.post('/api/demo/reset');
  } catch (err) {
    console.warn('[API Service] Backend reset failed, resetting local state:', err.message);
  }
  localDebts = JSON.parse(JSON.stringify(INITIAL_DEBTS));
  localMentorQueue = JSON.parse(JSON.stringify(INITIAL_MENTOR_QUEUE));
  localStudents = JSON.parse(JSON.stringify(MOCK_STUDENTS));
  return { success: true, message: 'Demo state reset' };
};

/**
 * Fetch available subjects (DSA, DBMS, etc.)
 */
export const getSubjects = async () => {
  try {
    const res = await client.get('/api/subjects');
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend unavailable, returning default subjects:', err.message);
    return [
      { id: 1, code: 'DSA', title: 'Data Structures and Algorithms', description: 'Core DSA concepts' },
      { id: 2, code: 'DBMS', title: 'Database Management Systems', description: 'Core DBMS concepts' }
    ];
  }
};

/**
 * Start a DSA diagnostic test
 */
export const startDSADiagnostic = async (studentId = 1, numQuestions = 12) => {
  try {
    const res = await client.post('/api/assessments/dsa/diagnostic', {
      student_id: studentId,
      subject_code: 'DSA',
      num_questions: numQuestions
    });
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend unavailable for diagnostic start:', err.message);
    throw err;
  }
};

/**
 * Submit completed DSA diagnostic test
 */
export const submitDSADiagnostic = async (attemptId, studentId, responses) => {
  try {
    const res = await client.post(`/api/assessments/${attemptId}/submit`, {
      student_id: studentId,
      attempt_id: attemptId,
      responses: responses
    });
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend unavailable for diagnostic submission:', err.message);
    throw err;
  }
};

/**
 * Fetch real-time system audit events trace for observability drawer
 */
export const getSystemTrace = async (studentId = 1) => {
  try {
    const res = await client.get(`/api/system/trace/${studentId}`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] System trace unavailable for student ${studentId}:`, err.message);
    return { student_id: studentId, count: 0, events: [] };
  }
};

/**
 * Fetch agent thinking steps ([Observe] -> [Reason] -> [Act] -> [Verify] -> [Adapt])
 */
export const getThinkingSteps = async (studentId = 1) => {
  try {
    const res = await client.get(`/api/system/trace/${studentId}/thinking`);
    return res.data?.steps || [];
  } catch (err) {
    console.warn(`[API Service] Thinking steps unavailable for student ${studentId}:`, err.message);
    return [];
  }
};
