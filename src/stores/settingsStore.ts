import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CharCount = 50 | 100 | 200;
export type PhraseCount = 10 | 20 | 30;
export type CharPool = 500;
export type PracticeType = 'random' | 'sequential' | 'hard' | 'initial' | 'final';
export type TimerMode = 'none' | 60 | 180 | 300;
export type DailyGoalChars = 500 | 1000 | 2000 | 5000;

export interface SettingsSnapshot {
  darkMode: boolean;
  showKeyboard: boolean;
  showPinyin: boolean;
  highlightKeys: boolean;
  fontSize: number;
  soundEnabled: boolean;
  soundVolume: number;
  charCount: CharCount;
  phraseCount: PhraseCount;
  charPool: CharPool;
  practiceType: PracticeType;
  timerMode: TimerMode;
  dailyGoalChars: DailyGoalChars;
}

interface SettingsState extends SettingsSnapshot {
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
  applySnapshot: (snapshot: Partial<SettingsSnapshot>) => void;
}

export const defaultSettings: SettingsSnapshot = {
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
};

export function applyDarkModeClass(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function getSettingsSnapshot(state: SettingsSnapshot): SettingsSnapshot {
  return {
    darkMode: state.darkMode,
    showKeyboard: state.showKeyboard,
    showPinyin: state.showPinyin,
    highlightKeys: state.highlightKeys,
    fontSize: state.fontSize,
    soundEnabled: state.soundEnabled,
    soundVolume: state.soundVolume,
    charCount: state.charCount,
    phraseCount: state.phraseCount,
    charPool: state.charPool,
    practiceType: state.practiceType,
    timerMode: state.timerMode,
    dailyGoalChars: state.dailyGoalChars,
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      toggleDarkMode: () => {
        const nextDarkMode = !get().darkMode;
        set({ darkMode: nextDarkMode });
        applyDarkModeClass(nextDarkMode);
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
      applySnapshot: (snapshot) => {
        const nextSnapshot = { ...defaultSettings, ...snapshot };
        applyDarkModeClass(nextSnapshot.darkMode);
        set(nextSnapshot);
      },
    }),
    {
      name: 'flypy-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyDarkModeClass(state.darkMode);
        }
      },
    }
  )
);
