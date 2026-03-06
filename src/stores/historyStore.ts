import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PracticeRecord {
  id: string;
  date: string;
  mode: 'char' | 'phrase' | 'article';
  speed: number;       // 字/分钟
  accuracy: number;    // 百分比
  totalChars: number;
  correctChars: number;
  wrongChars: number;
  maxCombo: number;
  duration: number;    // 秒
}

export interface WrongCharRecord {
  char: string;
  pinyin: string;
  flypyCode: string;
  count: number;
}

interface HistoryState {
  records: PracticeRecord[];
  wrongChars: Record<string, WrongCharRecord>;

  addRecord: (record: Omit<PracticeRecord, 'id' | 'date'>) => void;
  addWrongChar: (char: string, pinyin: string, flypyCode: string) => void;
  clearHistory: () => void;
  getRecentRecords: (count?: number) => PracticeRecord[];
  getTopWrongChars: (count?: number) => WrongCharRecord[];
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      records: [],
      wrongChars: {},

      addRecord: (record) => {
        const newRecord: PracticeRecord = {
          ...record,
          id: Date.now().toString(36),
          date: new Date().toISOString(),
        };
        set((state) => ({
          records: [newRecord, ...state.records].slice(0, 100), // 最多保留100条
        }));
      },

      addWrongChar: (char, pinyin, flypyCode) => {
        set((state) => {
          const existing = state.wrongChars[char];
          return {
            wrongChars: {
              ...state.wrongChars,
              [char]: {
                char,
                pinyin,
                flypyCode,
                count: (existing?.count || 0) + 1,
              },
            },
          };
        });
      },

      clearHistory: () => set({ records: [], wrongChars: {} }),

      getRecentRecords: (count = 20) => {
        return get().records.slice(0, count);
      },

      getTopWrongChars: (count = 20) => {
        return Object.values(get().wrongChars)
          .sort((a, b) => b.count - a.count)
          .slice(0, count);
      },
    }),
    { name: 'flypy-history' }
  )
);
