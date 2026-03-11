import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PracticeRecord {
  id: string;
  date: string;
  mode: 'char' | 'phrase' | 'article';
  speed: number;
  accuracy: number;
  totalChars: number;
  correctChars: number;
  wrongChars: number;
  maxCombo: number;
  duration: number;
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
  addRecord: (record: Omit<PracticeRecord, 'id' | 'date'>) => PracticeRecord;
  addWrongChar: (char: string, pinyin: string, flypyCode: string) => void;
  clearHistory: () => void;
  getRecentRecords: (count?: number) => PracticeRecord[];
  getTopWrongChars: (count?: number) => WrongCharRecord[];
  replaceRecords: (records: PracticeRecord[]) => void;
  replaceWrongChars: (wrongChars: WrongCharRecord[]) => void;
}

function dedupeRecords(records: PracticeRecord[]) {
  const map = new Map<string, PracticeRecord>();
  records.forEach((record) => {
    const key = [
      record.date,
      record.mode,
      record.speed,
      record.accuracy,
      record.totalChars,
      record.correctChars,
      record.wrongChars,
      record.maxCombo,
      record.duration,
    ].join('|');
    map.set(key, record);
  });
  return Array.from(map.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 100);
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
          records: dedupeRecords([newRecord, ...state.records]),
        }));
        return newRecord;
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

      getRecentRecords: (count = 20) => get().records.slice(0, count),

      getTopWrongChars: (count = 20) =>
        Object.values(get().wrongChars)
          .sort((a, b) => b.count - a.count)
          .slice(0, count),

      replaceRecords: (records) => set({ records: dedupeRecords(records) }),

      replaceWrongChars: (wrongChars) =>
        set({
          wrongChars: Object.fromEntries(wrongChars.map((item) => [item.char, item])),
        }),
    }),
    { name: 'flypy-history' }
  )
);
