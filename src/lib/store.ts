import { create } from 'zustand';
import type { ExecutionTrace, BugFinding, LearningSession } from '../types';
import { DEMO_CODE_BUGGY } from './demoData';

interface AppState {
  // Code editor
  code: string;
  setCode: (code: string) => void;

  // Execution
  trace: ExecutionTrace | null;
  setTrace: (trace: ExecutionTrace | null) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isExecuting: boolean;
  setIsExecuting: (v: boolean) => void;

  // Bug autopsy
  bugFinding: BugFinding | null;
  setBugFinding: (bf: BugFinding | null) => void;
  fixedCode: string;
  setFixedCode: (code: string) => void;
  showFixed: boolean;
  setShowFixed: (v: boolean) => void;

  // What-if
  originalCode: string;
  setOriginalCode: (code: string) => void;
  modifiedCode: string;
  setModifiedCode: (code: string) => void;

  // Learning
  learningSession: LearningSession;
  updateLearningSession: (update: Partial<LearningSession>) => void;

  // Demo mode
  isDemo: boolean;
  setIsDemo: (v: boolean) => void;

  // Reset
  reset: () => void;
}

const defaultLearningSession: LearningSession = {
  questionsAnswered: 0,
  correctAnswers: 0,
  conceptsEncountered: [],
  misconceptionsTriggered: [],
  teachBackAttempts: [],
};

export const useAppStore = create<AppState>((set) => ({
  code: DEMO_CODE_BUGGY,
  setCode: (code) => set({ code }),

  trace: null,
  setTrace: (trace) => set({ trace }),
  currentStep: 0,
  setCurrentStep: (currentStep) => set({ currentStep }),
  isExecuting: false,
  setIsExecuting: (isExecuting) => set({ isExecuting }),

  bugFinding: null,
  setBugFinding: (bugFinding) => set({ bugFinding }),
  fixedCode: '',
  setFixedCode: (fixedCode) => set({ fixedCode }),
  showFixed: false,
  setShowFixed: (showFixed) => set({ showFixed }),

  originalCode: DEMO_CODE_BUGGY,
  setOriginalCode: (originalCode) => set({ originalCode }),
  modifiedCode: '',
  setModifiedCode: (modifiedCode) => set({ modifiedCode }),

  learningSession: defaultLearningSession,
  updateLearningSession: (update) =>
    set((state) => ({ learningSession: { ...state.learningSession, ...update } })),

  isDemo: true,
  setIsDemo: (isDemo) => set({ isDemo }),

  reset: () =>
    set({
      trace: null,
      currentStep: 0,
      bugFinding: null,
      fixedCode: '',
      showFixed: false,
    }),
}));
