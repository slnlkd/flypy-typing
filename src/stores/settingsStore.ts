import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharCount = 50 | 100 | 200;
export type CharPool = 500;
export type PracticeType = 'random' | 'sequential' | 'hard' | 'initial' | 'final';
export type TimerMode = 'none' | 60 | 180 | 300;

interface SettingsState {
  darkMode: boolean;
  showKeyboard: boolean;
  showPinyin: boolean;
  highlightKeys: boolean;
  fontSize: number;
  soundEnabled: boolean;

  // 单字练习设置
  charCount: CharCount;
  charPool: CharPool;
  practiceType: PracticeType;

  // 限时模式
  timerMode: TimerMode;

  toggleDarkMode: () => void;
  toggleKeyboard: () => void;
  togglePinyin: () => void;
  toggleHighlightKeys: () => void;
  toggleSound: () => void;
  setFontSize: (size: number) => void;
  setCharCount: (count: CharCount) => void;
  setCharPool: (pool: CharPool) => void;
  setPracticeType: (type: PracticeType) => void;
  setTimerMode: (mode: TimerMode) => void;
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

      charCount: 50,
      charPool: 500,
      practiceType: 'random',
      timerMode: 'none',

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
      setFontSize: (size) => set({ fontSize: size }),
      setCharCount: (count) => set({ charCount: count }),
      setCharPool: (pool) => set({ charPool: pool }),
      setPracticeType: (type) => set({ practiceType: type }),
      setTimerMode: (mode) => set({ timerMode: mode }),
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
