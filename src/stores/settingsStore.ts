import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  darkMode: boolean;
  showKeyboard: boolean;
  showPinyin: boolean;
  highlightKeys: boolean;
  fontSize: number;

  toggleDarkMode: () => void;
  toggleKeyboard: () => void;
  togglePinyin: () => void;
  toggleHighlightKeys: () => void;
  setFontSize: (size: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      darkMode: false,
      showKeyboard: true,
      showPinyin: true,
      highlightKeys: true,
      fontSize: 24,

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
      setFontSize: (size) => set({ fontSize: size }),
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
