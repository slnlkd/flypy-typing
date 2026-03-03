import { create } from 'zustand';
import type { PinyinChar } from '../utils/pinyin';
import { textToPinyinChars, checkFlypyInput } from '../utils/pinyin';
import { commonChars, pinyinToFlypy } from '../data/flypy';

export type PracticeMode = 'char' | 'article';
export type CharStatus = 'pending' | 'current' | 'correct' | 'wrong';

export interface TypedChar {
  pinyinChar: PinyinChar;
  status: CharStatus;
  userInput: string;
  startTime?: number;
  endTime?: number;
}

interface TypingState {
  // 练习模式
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;

  // 练习数据
  chars: TypedChar[];
  currentIndex: number;
  currentInput: string;
  isStarted: boolean;
  isFinished: boolean;
  startTime: number | null;

  // 统计
  correctCount: number;
  wrongCount: number;
  totalKeystrokes: number;
  combo: number;
  maxCombo: number;

  // 操作
  loadChars: (pinyinChars: PinyinChar[]) => void;
  loadArticle: (text: string) => void;
  loadRandomChars: (count?: number) => void;
  handleKeyDown: (key: string) => void;
  reset: () => void;

  // 计算属性
  getSpeed: () => number;
  getAccuracy: () => number;
  getElapsedTime: () => number;
  getProgress: () => number;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  mode: 'char',
  chars: [],
  currentIndex: 0,
  currentInput: '',
  isStarted: false,
  isFinished: false,
  startTime: null,
  correctCount: 0,
  wrongCount: 0,
  totalKeystrokes: 0,
  combo: 0,
  maxCombo: 0,

  setMode: (mode) => {
    set({
      mode,
      chars: [],
      currentIndex: 0,
      currentInput: '',
      isStarted: false,
      isFinished: false,
      startTime: null,
      correctCount: 0,
      wrongCount: 0,
      totalKeystrokes: 0,
      combo: 0,
      maxCombo: 0,
    });
  },

  loadChars: (pinyinChars) => {
    const chars: TypedChar[] = pinyinChars.map((pc, i) => ({
      pinyinChar: pc,
      status: i === 0 ? 'current' : 'pending',
      userInput: '',
    }));
    set({
      chars,
      currentIndex: 0,
      currentInput: '',
      isStarted: false,
      isFinished: false,
      startTime: null,
      correctCount: 0,
      wrongCount: 0,
      totalKeystrokes: 0,
      combo: 0,
      maxCombo: 0,
    });
  },

  loadArticle: (text) => {
    const pinyinChars = textToPinyinChars(text);
    get().loadChars(pinyinChars);
  },

  loadRandomChars: (count = 50) => {
    const shuffled = [...commonChars].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const pinyinChars: PinyinChar[] = selected.map((c) => ({
      char: c.char,
      pinyin: c.pinyin,
      pinyinWithTone: c.pinyin, // 简化处理
      flypyCode: pinyinToFlypy[c.pinyin] || c.pinyin,
      isChineseChar: true,
    }));
    get().loadChars(pinyinChars);
  },

  handleKeyDown: (key) => {
    const state = get();
    if (state.isFinished || state.chars.length === 0) return;

    // 只处理字母键和退格键
    if (key === 'Backspace') {
      if (state.currentInput.length > 0) {
        set({ currentInput: state.currentInput.slice(0, -1) });
      }
      return;
    }

    // 只接受字母输入
    if (!/^[a-zA-Z]$/.test(key)) return;

    const now = Date.now();

    // 首次输入开始计时
    if (!state.isStarted) {
      set({ isStarted: true, startTime: now });
    }

    const newInput = state.currentInput + key.toLowerCase();
    const currentChar = state.chars[state.currentIndex];
    const expectedCode = currentChar.pinyinChar.flypyCode;

    set({ totalKeystrokes: state.totalKeystrokes + 1 });

    const result = checkFlypyInput(newInput, expectedCode);

    if (result === 'correct') {
      // 正确完成当前字
      const newChars = [...state.chars];
      newChars[state.currentIndex] = {
        ...currentChar,
        status: 'correct',
        userInput: newInput,
        startTime: currentChar.startTime || now,
        endTime: now,
      };

      const newCombo = state.combo + 1;
      const nextIndex = state.currentIndex + 1;

      if (nextIndex < newChars.length) {
        newChars[nextIndex] = { ...newChars[nextIndex], status: 'current' };
        set({
          chars: newChars,
          currentIndex: nextIndex,
          currentInput: '',
          correctCount: state.correctCount + 1,
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo),
        });
      } else {
        // 练习完成
        set({
          chars: newChars,
          currentInput: '',
          isFinished: true,
          correctCount: state.correctCount + 1,
          combo: newCombo,
          maxCombo: Math.max(state.maxCombo, newCombo),
        });
      }
    } else if (result === 'partial') {
      // 部分输入正确，继续输入
      set({ currentInput: newInput });
    } else {
      // 输入错误
      const newChars = [...state.chars];
      newChars[state.currentIndex] = {
        ...currentChar,
        status: 'wrong',
        userInput: newInput,
      };
      set({
        chars: newChars,
        currentInput: newInput,
        wrongCount: state.wrongCount + 1,
        combo: 0,
      });

      // 单字模式下，短暂停留后自动重置输入；文章模式下，需要用户手动退格纠正
      // 修改：只有在单字模式下才自动重置。文章模式下，错误状态将保持，直到用户退格。
      if (state.mode === 'char') {
        setTimeout(() => {
          const s = get();
          if (s.currentIndex === state.currentIndex && s.currentInput === newInput) {
            const resetChars = [...s.chars];
            resetChars[s.currentIndex] = {
              ...resetChars[s.currentIndex],
              status: 'current',
              userInput: '',
            };
            set({ chars: resetChars, currentInput: '' });
          }
        }, 300);
      }
    }
  },

  reset: () => {
    const state = get();
    if (state.mode === 'char') {
      get().loadRandomChars();
    }
  },

  getSpeed: () => {
    const state = get();
    if (!state.startTime || state.correctCount === 0) return 0;
    const elapsed = (Date.now() - state.startTime) / 1000 / 60; // 分钟
    if (elapsed === 0) return 0;
    return Math.round(state.correctCount / elapsed);
  },

  getAccuracy: () => {
    const state = get();
    const total = state.correctCount + state.wrongCount;
    if (total === 0) return 100;
    return Math.round((state.correctCount / total) * 100);
  },

  getElapsedTime: () => {
    const state = get();
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
  },

  getProgress: () => {
    const state = get();
    if (state.chars.length === 0) return 0;
    return Math.round((state.currentIndex / state.chars.length) * 100);
  },
}));
