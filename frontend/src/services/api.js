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
  timeout: 4000 // Quick timeout to fallback to mock state seamlessly if backend is offline
});

// In-memory mock state for responsive local fallback
let localDebts = [...INITIAL_DEBTS];
let localMentorQueue = [...INITIAL_MENTOR_QUEUE];
let localStudents = [...MOCK_STUDENTS];

export const getApiBaseUrl = () => API_BASE_URL;

/**
 * Fetch all students
 */
export const getStudents = async () => {
  try {
    const res = await client.get('/students');
    return res.data;
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
    const res = await client.get(`/students/${studentId}`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock student ${studentId}:`, err.message);
    const student = localStudents.find(s => s.id === studentId) || localStudents[0];
    return student;
  }
};

/**
 * Fetch debts ledger for a specific student
 */
export const getStudentDebts = async (studentId) => {
  try {
    const res = await client.get(`/students/${studentId}/debts`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock debts for student ${studentId}:`, err.message);
    return localDebts.filter(d => d.student_id === studentId);
  }
};

/**
 * Fetch single debt details
 */
export const getDebt = async (debtId) => {
  try {
    const res = await client.get(`/debts/${debtId}`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock debt ${debtId}:`, err.message);
    const debt = localDebts.find(d => d.id === debtId);
    if (!debt) throw new Error('Debt not found');
    return debt;
  }
};

/**
 * Submit new evidence entry for a student concept
 */
export const submitEvidence = async (payload) => {
  try {
    const res = await client.post('/evidence', payload);
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
    const res = await client.get(`/debts/${debtId}/interventions`);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, returning mock interventions for ${debtId}:`, err.message);
    const debt = localDebts.find(d => d.id === debtId);
    return debt ? debt.interventions || [] : [];
  }
};

/**
 * Submit Mentor decision (Approve | Edit | Reject) for an intervention
 */
export const submitMentorReview = async (interventionId, payload) => {
  // payload format: { decision: 'approve' | 'edit' | 'reject', edited_content?: string }
  try {
    const res = await client.post(`/interventions/${interventionId}/mentor-review`, payload);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, applying mock mentor review for ${interventionId}:`, err.message);
    // Find in queue
    const queueIndex = localMentorQueue.findIndex(item => item.intervention_id === interventionId);
    const pendingItem = localMentorQueue[queueIndex];
    
    if (pendingItem) {
      // Find debt
      const debt = localDebts.find(d => d.id === pendingItem.debt_id);
      if (debt) {
        if (payload.decision === 'approve' || payload.decision === 'edit') {
          debt.status = 'IN_INTERVENTION';
          const intObj = debt.interventions.find(i => i.id === interventionId);
          if (intObj) {
            intObj.mentor_status = 'APPROVED';
            if (payload.edited_content) {
              intObj.content = payload.edited_content;
              intObj.version_note = (intObj.version_note ? intObj.version_note + ' ' : '') + '(Edited by Mentor)';
            }
          }
        } else if (payload.decision === 'reject') {
          debt.status = 'FAILED';
          debt.failed_interventions += 1;
        }
      }
      // Remove from pending queue
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
  // payload format: { question_id: string, answer: string }
  try {
    const res = await client.post(`/debts/${debtId}/verify`, payload);
    return res.data;
  } catch (err) {
    console.warn(`[API Service] Backend unavailable, processing mock verification for debt ${debtId}:`, err.message);
    const debt = localDebts.find(d => d.id === debtId);
    if (!debt) throw new Error('Debt not found');

    const isCorrect = debt.current_question && payload.answer.trim().toUpperCase() === debt.current_question.correct_answer.toUpperCase();

    if (isCorrect) {
      // State transition: ONLY VERIFICATION EVIDENCE CAN MARK AS REPAID
      debt.status = 'REPAID';
      debt.evidence.push({
        id: `ev-ver-pass-${Date.now()}`,
        source: 'Verification Quiz',
        score: '100%',
        passed: true,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        detail: 'PASSED verification question cleanly. Knowledge debt resolved.'
      });
      return {
        success: true,
        passed: true,
        new_status: 'REPAID',
        message: 'Knowledge Debt → REPAID. Concept mastery confirmed by evidence.',
        explanation: debt.current_question?.explanation || 'Correct answer provided.'
      };
    } else {
      // Failed verification -> Adapt loop
      debt.attempts += 1;
      debt.failed_interventions += 1;
      
      if (debt.failed_interventions >= 3) {
        debt.status = 'ESCALATED';
      } else {
        debt.status = 'FAILED'; // transient adapt loop state
      }

      debt.evidence.push({
        id: `ev-ver-fail-${Date.now()}`,
        source: 'Verification Quiz',
        score: '0%',
        passed: false,
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        detail: `FAILED verification attempt ${debt.attempts}. Triggers adaptive loop for new intervention.`
      });

      return {
        success: true,
        passed: false,
        new_status: debt.status,
        message: debt.status === 'ESCALATED' 
          ? 'Threshold reached (3 failures). Debt ESCALATED to human mentor.' 
          : 'Strategy will be revised — new intervention incoming.',
        explanation: debt.current_question?.explanation || 'Incorrect answer submitted.'
      };
    }
  }
};

/**
 * Fetch pending interventions awaiting mentor review
 */
export const getPendingReviews = async () => {
  try {
    const res = await client.get('/interventions/pending-review');
    return res.data;
  } catch (err) {
    console.warn('[API Service] Backend unavailable, returning mock pending mentor queue:', err.message);
    return localMentorQueue;
  }
};

/**
 * Reset local demo state back to seeded initial values
 */
export const resetDemoState = async () => {
  localDebts = JSON.parse(JSON.stringify(INITIAL_DEBTS));
  localMentorQueue = JSON.parse(JSON.stringify(INITIAL_MENTOR_QUEUE));
  localStudents = JSON.parse(JSON.stringify(MOCK_STUDENTS));
  console.log('[API Service] Demo state successfully reset to initial seed data.');
  return { success: true, message: 'Demo state reset' };
};

