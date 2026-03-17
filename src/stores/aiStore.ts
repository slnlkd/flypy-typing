import { create } from 'zustand';
import type { AIAnswer, CoachAnalysis, CoachTask, GeneratedAIContent } from '../api/client';

interface AIState {
  goal: string;
  question: string;
  analysis: CoachAnalysis | null;
  tasksSummary: string;
  tasks: CoachTask[];
  generatedContent: GeneratedAIContent | null;
  answer: AIAnswer | null;
  isAnalyzing: boolean;
  isGeneratingTasks: boolean;
  isGeneratingContent: boolean;
  isAnswering: boolean;
  isIngestingKnowledge: boolean;
  error: string | null;
  setGoal: (goal: string) => void;
  setQuestion: (question: string) => void;
  startAnalyze: () => void;
  finishAnalyze: (analysis: CoachAnalysis) => void;
  startGenerateTasks: () => void;
  finishGenerateTasks: (summary: string, tasks: CoachTask[]) => void;
  startGenerateContent: () => void;
  finishGenerateContent: (content: GeneratedAIContent) => void;
  startAnswer: () => void;
  finishAnswer: (answer: AIAnswer) => void;
  startIngestKnowledge: () => void;
  finishIngestKnowledge: () => void;
  setError: (message: string | null) => void;
  clearGeneratedContent: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  goal: '综合提升',
  question: '',
  analysis: null,
  tasksSummary: '',
  tasks: [],
  generatedContent: null,
  answer: null,
  isAnalyzing: false,
  isGeneratingTasks: false,
  isGeneratingContent: false,
  isAnswering: false,
  isIngestingKnowledge: false,
  error: null,
  setGoal: (goal) => set({ goal }),
  setQuestion: (question) => set({ question }),
  startAnalyze: () => set({ isAnalyzing: true, error: null }),
  finishAnalyze: (analysis) => set({ analysis, isAnalyzing: false, error: null }),
  startGenerateTasks: () => set({ isGeneratingTasks: true, error: null }),
  finishGenerateTasks: (tasksSummary, tasks) => set({ tasksSummary, tasks, isGeneratingTasks: false, error: null }),
  startGenerateContent: () => set({ isGeneratingContent: true, error: null }),
  finishGenerateContent: (generatedContent) => set({ generatedContent, isGeneratingContent: false, error: null }),
  startAnswer: () => set({ isAnswering: true, error: null }),
  finishAnswer: (answer) => set({ answer, isAnswering: false, error: null }),
  startIngestKnowledge: () => set({ isIngestingKnowledge: true, error: null }),
  finishIngestKnowledge: () => set({ isIngestingKnowledge: false, error: null }),
  setError: (error) =>
    set({
      error,
      isAnalyzing: false,
      isGeneratingTasks: false,
      isGeneratingContent: false,
      isAnswering: false,
      isIngestingKnowledge: false,
    }),
  clearGeneratedContent: () => set({ generatedContent: null }),
}));
