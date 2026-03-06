import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharCount = 50 | 100 | 200;
export type PhraseCount = 10 | 20 | 30;
export type CharPool = 500;
export type PracticeType = 'random' | 'sequential' | 'hard' | 'initial' | 'final';
export type TimerMode = 'none' | 60 | 180 | 300;
export type DailyGoalChars = 500 | 1000 | 2000 | 5000;

interface SettingsState {
  darkMode: boolean;
  showKeyboard: boolean;
  showPinyin: boolean;
  highlightKeys: boolean;
  fontSize: number;
  soundEnabled: boolean;
  soundVolume: number;

  // 单字练习设置
  charCount: CharCount;
  phraseCount: PhraseCount;
  charPool: CharPool;
  practiceType: PracticeType;

  // 限时模式
  timerMode: TimerMode;
  dailyGoalChars: DailyGoalChars;

  toggleDarkMode: () => void;
  toggleKeyboard: () => void;
  togglePinyin: () => void;
  toggleHighlightKeys: () => void;
  toggleSound: () => void;
  setSoundVolume: (v: number) => void;
  setFontSize: (size: number) => void;
  setCharCount: (count: CharCount) => void;
  setPhraseCount: (count: PhraseCount) => void;
  setCharPool: (pool: CharPool) => void;
  setPracticeType: (type: PracticeType) => void;
  setTimerMode: (mode: TimerMode) => void;
  setDailyGoalChars: (goal: DailyGoalChars) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      showKeyboard: true,
      showPinyin: true,
      highlightKeys: true,
      fontSize: 24,
      soundEnabled: false,
      soundVolume: 50,

      charCount: 50,
      phraseCount: 20,
      charPool: 500,
      practiceType: 'random',
      timerMode: 'none',
      dailyGoalChars: 1000,

      toggleDarkMode: () => {
        const newVal = !get().darkMode;
        set({ darkMode: newVal });
        if (newVal) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleKeyboard: () => set({ showKeyboard: !get().showKeyboard }),
      togglePinyin: () => set({ showPinyin: !get().showPinyin }),
      toggleHighlightKeys: () => set({ highlightKeys: !get().highlightKeys }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      setSoundVolume: (v) => set({ soundVolume: v }),
      setFontSize: (size) => set({ fontSize: size }),
      setCharCount: (count) => set({ charCount: count }),
      setPhraseCount: (count) => set({ phraseCount: count }),
      setCharPool: (pool) => set({ charPool: pool }),
      setPracticeType: (type) => set({ practiceType: type }),
      setTimerMode: (mode) => set({ timerMode: mode }),
      setDailyGoalChars: (goal) => set({ dailyGoalChars: goal }),
    }),
    {
      name: 'flypy-settings',
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
