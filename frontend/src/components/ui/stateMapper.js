/**
 * Display-only state mapping helper functions.
 * STRICT RULE: Does NOT mutate underlying DB enums or state machine values.
 */

export const STATE_LABELS = {
  CLEAR: 'Healthy',
  SUSPECTED: 'Spotted',
  CONFIRMED_DEBT: 'Fix needed',
  INTERVENTION_PROPOSED: 'Fix proposed',
  MENTOR_REVIEW: 'Mentor checking',
  IN_INTERVENTION: 'Fix in progress',
  FOLLOW_UP: 'Prove it',
  VERIFYING: 'Verifying',
  REPAID: 'Cleared',
  ESCALATED: 'Mentor will help',
};

export const STATE_DESCRIPTIONS = {
  CLEAR: 'You have mastered this concept with solid evidence.',
  SUSPECTED: 'We noticed a single error. We are keeping an eye on it.',
  CONFIRMED_DEBT: 'Multiple persistent gaps confirmed. A target fix is needed.',
  INTERVENTION_PROPOSED: 'An AI lesson plan has been created and is ready for mentor check.',
  MENTOR_REVIEW: 'Your mentor is reviewing the AI lesson strategy before you start.',
  IN_INTERVENTION: 'You are currently working through your tailored lesson plan.',
  FOLLOW_UP: 'Time to prove what you learned with a short check-up quiz!',
  VERIFYING: 'Checking your recent quiz answers to confirm the debt is cleared.',
  REPAID: 'Great job! You passed the verification and cleared this topic.',
  ESCALATED: 'Multiple attempts needed extra support. Your mentor will work with you directly.',
};

export const STATE_COLORS = {
  CLEAR: { bg: 'bg-[#E8FDF2] dark:bg-[#12B76A]/15', text: 'text-[#027A48] dark:text-[#34D399]', border: 'border-[#A6F4C5] dark:border-[#12B76A]/30', dot: 'bg-[#12B76A]' },
  SUSPECTED: { bg: 'bg-[#FEF6E7] dark:bg-[#F79009]/15', text: 'text-[#B54708] dark:text-[#FBBF24]', border: 'border-[#FDECAB] dark:border-[#F79009]/30', dot: 'bg-[#F79009]' },
  CONFIRMED_DEBT: { bg: 'bg-[#FEE4E2] dark:bg-[#F04438]/15', text: 'text-[#B42318] dark:text-[#F87171]', border: 'border-[#FECDCA] dark:border-[#F04438]/30', dot: 'bg-[#F04438]' },
  INTERVENTION_PROPOSED: { bg: 'bg-[#EFF8FF] dark:bg-[#2E90FA]/15', text: 'text-[#175CD3] dark:text-[#60A5FA]', border: 'border-[#B2DDFF] dark:border-[#2E90FA]/30', dot: 'bg-[#2E90FA]' },
  MENTOR_REVIEW: { bg: 'bg-[#EEECFF] dark:bg-[#5B4BFF]/15', text: 'text-[#4A3AE0] dark:text-[#818CF8]', border: 'border-[#C7D2FE] dark:border-[#5B4BFF]/30', dot: 'bg-[#5B4BFF]' },
  IN_INTERVENTION: { bg: 'bg-[#EFF8FF] dark:bg-[#2E90FA]/15', text: 'text-[#175CD3] dark:text-[#60A5FA]', border: 'border-[#B2DDFF] dark:border-[#2E90FA]/30', dot: 'bg-[#2E90FA]' },
  FOLLOW_UP: { bg: 'bg-[#FEF6E7] dark:bg-[#F79009]/15', text: 'text-[#B54708] dark:text-[#FBBF24]', border: 'border-[#FDECAB] dark:border-[#F79009]/30', dot: 'bg-[#F79009]' },
  VERIFYING: { bg: 'bg-[#EFF8FF] dark:bg-[#2E90FA]/15', text: 'text-[#175CD3] dark:text-[#60A5FA]', border: 'border-[#B2DDFF] dark:border-[#2E90FA]/30', dot: 'bg-[#2E90FA]' },
  REPAID: { bg: 'bg-[#E8FDF2] dark:bg-[#12B76A]/15', text: 'text-[#027A48] dark:text-[#34D399]', border: 'border-[#A6F4C5] dark:border-[#12B76A]/30', dot: 'bg-[#12B76A]' },
  ESCALATED: { bg: 'bg-[#FEE4E2] dark:bg-[#F04438]/15', text: 'text-[#B42318] dark:text-[#F87171]', border: 'border-[#FECDCA] dark:border-[#F04438]/30', dot: 'bg-[#F04438]' },
};

/**
 * Returns plain-language label for display
 */
export function stateLabel(state) {
  return STATE_LABELS[state] || state || 'Unknown';
}

/**
 * Returns plain-language description for display
 */
export function stateDescription(state) {
  return STATE_DESCRIPTIONS[state] || 'Tracking topic progress.';
}

/**
 * Maps state enum to Debt Trail 5-stop step index (1-based, 1 to 5)
 */
export function getTrailStepIndex(state) {
  switch (state) {
    case 'SUSPECTED':
    case 'CONFIRMED_DEBT':
      return 1; // Spotted
    case 'INTERVENTION_PROPOSED':
    case 'IN_INTERVENTION':
      return 2; // Fix it
    case 'MENTOR_REVIEW':
      return 3; // Mentor OK
    case 'FOLLOW_UP':
    case 'VERIFYING':
      return 4; // Prove it
    case 'REPAID':
    case 'CLEAR':
      return 5; // Cleared
    case 'ESCALATED':
      return 2; // Loop back to Fix/Mentor
    default:
      return 1;
  }
}
