import { create } from 'zustand';
import type { PinyinChar } from '../utils/pinyin';
import { textToPinyinChars, checkFlypyInput, isPunctuation } from '../utils/pinyin';
import { commonChars, pinyinToFlypy } from '../data/flypy';
import { useSettingsStore } from './settingsStore';
import { playKeySound, playCorrectSound, playErrorSound, playComboSound } from '../utils/sound';

export type PracticeMode = 'char' | 'article';
export type CharStatus = 'pending' | 'current' | 'correct' | 'wrong';

export interface TypedChar {
  pinyinChar: PinyinChar;
  status: CharStatus;
  userInput: string;
  startTime?: number;
  endTime?: number;
}

// 韵母需要转换的拼音（非直接映射）
const hardFinals = new Set([
  'iu', 'ei', 'uan', 'er', 'ue', 've', 'un', 'uo',
  'ie', 'ong', 'iong', 'ai', 'uai', 'en', 'eng', 'ang',
  'an', 'ing', 'iang', 'uang', 'ou', 'ia', 'ua', 'ao',
  'ui', 'in', 'iao', 'ian',
]);

function isHardChar(pinyin: string): boolean {
  // 声母需转换：zh, ch, sh
  if (pinyin.startsWith('zh') || pinyin.startsWith('ch') || pinyin.startsWith('sh')) return true;
  // 韵母需转换
  const code = pinyinToFlypy[pinyin];
  if (!code || code.length < 2) return false;
  // 韵母键 != 韵母首字母
  const finalKey = code[1];
  const pinyinNoInitial = pinyin.replace(/^[bpmfdtnlgkhjqxrzcsyw]h?/, '');
  return pinyinNoInitial.length > 0 && finalKey !== pinyinNoInitial[0];
}

// 声母列表
const initials = ['b','p','m','f','d','t','n','l','g','k','h','j','q','x','zh','ch','sh','r','z','c','s','y','w'];

function getInitial(pinyin: string): string {
  for (const ini of ['zh','ch','sh']) {
    if (pinyin.startsWith(ini)) return ini;
  }
  const first = pinyin[0];
  if (initials.includes(first)) return first;
  return '';
}

interface TypingState {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;

  chars: TypedChar[];
  currentIndex: number;
  currentInput: string;
  isStarted: boolean;
  isFinished: boolean;
  startTime: number | null;

  // 限时模式
  timerEndTime: number | null;
  isTimerExpired: boolean;

  // 暂停
  isPaused: boolean;
  pausedTime: number;
  pauseStartTime: number | null;

  correctCount: number;
  wrongCount: number;
  totalKeystrokes: number;
  combo: number;
  maxCombo: number;

  loadChars: (pinyinChars: PinyinChar[]) => void;
  loadArticle: (text: string) => void;
  loadRandomChars: (count?: number) => void;
  handleKeyDown: (key: string) => void;
  handleCharInput: (input: string) => void;
  handleBackspace: () => void;
  reset: () => void;
  checkTimer: () => void;
  togglePause: () => void;

  getSpeed: () => number;
  getAccuracy: () => number;
  getElapsedTime: () => number;
  getProgress: () => number;
  getRemainingTime: () => number | null;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  mode: 'char',
  chars: [],
  currentIndex: 0,
  currentInput: '',
  isStarted: false,
  isFinished: false,
  startTime: null,
  timerEndTime: null,
  isTimerExpired: false,
  isPaused: false,
  pausedTime: 0,
  pauseStartTime: null,
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
      timerEndTime: null,
      isTimerExpired: false,
      isPaused: false,
      pausedTime: 0,
      pauseStartTime: null,
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
      timerEndTime: null,
      isTimerExpired: false,
      isPaused: false,
      pausedTime: 0,
      pauseStartTime: null,
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

  loadRandomChars: (countOverride?: number) => {
    const settings = useSettingsStore.getState();
    const count = countOverride || settings.charCount;
    const poolSize = settings.charPool;
    const practiceType = settings.practiceType;

    // 获取字库范围
    let pool = commonChars.slice(0, Math.min(poolSize, commonChars.length));

    // 根据出题模式过滤
    if (practiceType === 'hard') {
      pool = pool.filter((c) => isHardChar(c.pinyin));
    } else if (practiceType === 'initial') {
      // 声母专项：只选有特殊声母映射的字（zh, ch, sh）
      pool = pool.filter((c) => {
        const ini = getInitial(c.pinyin);
        return ini === 'zh' || ini === 'ch' || ini === 'sh';
      });
    } else if (practiceType === 'final') {
      // 韵母专项：只选韵母需要转换的字
      pool = pool.filter((c) => {
        const code = pinyinToFlypy[c.pinyin];
        if (!code || code.length < 2) return false;
        const pinyinNoInitial = c.pinyin.replace(/^[bpmfdtnlgkhjqxrzcsyw]h?/, '');
        return hardFinals.has(pinyinNoInitial);
      });
    }

    if (pool.length === 0) pool = commonChars.slice(0, 500);

    let selected;
    if (practiceType === 'sequential') {
      selected = pool.slice(0, count);
    } else {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      selected = shuffled.slice(0, Math.min(count, shuffled.length));
    }

    const pinyinChars: PinyinChar[] = selected.map((c) => ({
      char: c.char,
      pinyin: c.pinyin,
      pinyinWithTone: c.pinyin,
      flypyCode: pinyinToFlypy[c.pinyin] || c.pinyin,
      isChineseChar: true,
    }));
    get().loadChars(pinyinChars);
  },

  togglePause: () => {
    const state = get();
    if (!state.isStarted || state.isFinished) return;

    if (state.isPaused) {
      // Resume
      const pauseDuration = state.pauseStartTime ? Date.now() - state.pauseStartTime : 0;
      set({
        isPaused: false,
        pausedTime: state.pausedTime + pauseDuration,
        pauseStartTime: null,
        ...(state.timerEndTime ? { timerEndTime: state.timerEndTime + pauseDuration } : {}),
      });
    } else {
      // Pause
      set({ isPaused: true, pauseStartTime: Date.now() });
    }
  },

  checkTimer: () => {
    const state = get();
    if (state.isPaused) return;
    if (state.timerEndTime && Date.now() >= state.timerEndTime && !state.isFinished) {
      set({ isFinished: true, isTimerExpired: true });
    }
  },

  handleKeyDown: (key) => {
    const state = get();
    if (state.isPaused || state.isFinished || state.chars.length === 0) return;

    const settings = useSettingsStore.getState();

    if (key === 'Backspace') {
      if (state.currentInput.length > 0) {
        set({ currentInput: state.currentInput.slice(0, -1) });
      }
      return;
    }

    if (!/^[a-zA-Z]$/.test(key)) return;

    const now = Date.now();

    if (!state.isStarted) {
      const timerEndTime = settings.timerMode !== 'none'
        ? now + (settings.timerMode as number) * 1000
        : null;
      set({ isStarted: true, startTime: now, timerEndTime });
    }

    // 检查计时器
    if (state.timerEndTime && now >= state.timerEndTime) {
      set({ isFinished: true, isTimerExpired: true });
      return;
    }

    if (settings.soundEnabled) playKeySound();

    const newInput = state.currentInput + key.toLowerCase();
    const currentChar = state.chars[state.currentIndex];
    const expectedCode = currentChar.pinyinChar.flypyCode;

    set({ totalKeystrokes: state.totalKeystrokes + 1 });

    const result = checkFlypyInput(newInput, expectedCode);

    if (result === 'correct') {
      const newChars = [...state.chars];
      newChars[state.currentIndex] = {
        ...currentChar,
        status: 'correct',
        userInput: newInput,
        startTime: currentChar.startTime || now,
        endTime: now,
      };

      const newCombo = state.combo + 1;

      if (settings.soundEnabled) {
        if (newCombo >= 5) {
          playComboSound(newCombo);
        } else {
          playCorrectSound();
        }
      }

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
      set({ currentInput: newInput });
    } else {
      if (settings.soundEnabled) playErrorSound();

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

  handleCharInput: (input: string) => {
    const state = get();
    if (state.isPaused || state.isFinished || state.chars.length === 0 || input.length === 0) return;

    const settings = useSettingsStore.getState();
    const now = Date.now();

    if (!state.isStarted) {
      const timerEndTime = settings.timerMode !== 'none'
        ? now + (settings.timerMode as number) * 1000
        : null;
      set({ isStarted: true, startTime: now, timerEndTime });
    }

    if (state.timerEndTime && now >= state.timerEndTime) {
      set({ isFinished: true, isTimerExpired: true });
      return;
    }

    const newChars = [...state.chars];
    let idx = state.currentIndex;
    let correct = state.correctCount;
    let wrong = state.wrongCount;
    let combo = state.combo;
    let maxCombo = state.maxCombo;
    let keystrokes = state.totalKeystrokes;

    const autoSkipPunctuation = () => {
      while (idx < newChars.length && isPunctuation(newChars[idx].pinyinChar.char)) {
        const punctuationChar = newChars[idx];
        newChars[idx] = {
          ...punctuationChar,
          status: 'correct',
          userInput: punctuationChar.pinyinChar.char,
          startTime: punctuationChar.startTime || now,
          endTime: now,
        };
        idx++;
      }
    };

    autoSkipPunctuation();

    for (const ch of input) {
      if (idx >= newChars.length) break;

      const currentChar = newChars[idx];
      const expected = currentChar.pinyinChar.char;
      keystrokes++;

      if (ch === expected) {
        newChars[idx] = {
          ...currentChar,
          status: 'correct',
          userInput: ch,
          startTime: currentChar.startTime || now,
          endTime: now,
        };
        correct++;
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        if (settings.soundEnabled) {
          if (combo >= 5) {
            playComboSound(combo);
          } else {
            playCorrectSound();
          }
        }
      } else {
        newChars[idx] = {
          ...currentChar,
          status: 'wrong',
          userInput: ch,
          startTime: currentChar.startTime || now,
          endTime: now,
        };
        wrong++;
        combo = 0;
        if (settings.soundEnabled) playErrorSound();
      }

      idx++;
      autoSkipPunctuation();
    }

    if (idx < newChars.length) {
      newChars[idx] = { ...newChars[idx], status: 'current' };
      set({
        chars: newChars,
        currentIndex: idx,
        currentInput: '',
        correctCount: correct,
        wrongCount: wrong,
        totalKeystrokes: keystrokes,
        combo,
        maxCombo,
      });
    } else {
      set({
        chars: newChars,
        currentIndex: idx,
        currentInput: '',
        isFinished: true,
        correctCount: correct,
        wrongCount: wrong,
        totalKeystrokes: keystrokes,
        combo,
        maxCombo,
      });
    }
  },

  handleBackspace: () => {
    const state = get();
    if (state.currentIndex === 0 || state.chars.length === 0) return;

    const prevIndex = state.currentIndex - 1;
    const prevChar = state.chars[prevIndex];
    const newChars = [...state.chars];

    let correct = state.correctCount;
    let wrong = state.wrongCount;
    if (prevChar.status === 'correct') correct--;
    if (prevChar.status === 'wrong') wrong--;

    newChars[state.currentIndex] = { ...newChars[state.currentIndex], status: 'pending', userInput: '' };
    newChars[prevIndex] = { ...prevChar, status: 'current', userInput: '' };

    set({
      chars: newChars,
      currentIndex: prevIndex,
      currentInput: '',
      correctCount: correct,
      wrongCount: wrong,
      isFinished: false,
    });
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
    const elapsed = get().getElapsedTime() / 60;
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
    let totalPaused = state.pausedTime;
    if (state.isPaused && state.pauseStartTime) {
      totalPaused += Date.now() - state.pauseStartTime;
    }
    return Math.floor((Date.now() - state.startTime - totalPaused) / 1000);
  },

  getProgress: () => {
    const state = get();
    if (state.chars.length === 0) return 0;
    return Math.round((state.currentIndex / state.chars.length) * 100);
  },

  getRemainingTime: () => {
    const state = get();
    if (!state.timerEndTime) return null;
    const remaining = Math.max(0, Math.ceil((state.timerEndTime - Date.now()) / 1000));
    return remaining;
  },
}));
