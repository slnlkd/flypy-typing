import { create } from 'zustand';
import type { PinyinChar } from '../utils/pinyin';
import { textToPinyinChars, checkFlypyInput, isPunctuation } from '../utils/pinyin';
import { commonChars, commonPhrases, pinyinToFlypy } from '../data/flypy';
import { useSettingsStore } from './settingsStore';
import { useHistoryStore } from './historyStore';
import { playKeySound, playCorrectSound, playErrorSound, playComboSound } from '../utils/sound';

export type PracticeMode = 'char' | 'phrase' | 'article';
export type CharStatus = 'pending' | 'current' | 'correct' | 'wrong';

export interface PhraseRange {
  text: string;
  start: number;
  end: number;
}

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

function weightedSampleChars(
  pool: typeof commonChars,
  count: number,
  wrongCounts: Record<string, number>
) {
  const candidates = [...pool];
  const picked: typeof commonChars = [];
  const target = Math.min(count, candidates.length);

  while (picked.length < target && candidates.length > 0) {
    const weights = candidates.map((item) => {
      const wrong = wrongCounts[item.char] || 0;
      // 错字次数越高，抽中概率越高；保留基础权重避免只刷错字
      return 1 + Math.min(12, wrong * 2);
    });
    const total = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(candidates[idx]);
    candidates.splice(idx, 1);
  }

  return picked;
}

function weightedSamplePhrases(
  pool: string[],
  count: number,
  wrongCounts: Record<string, number>
) {
  const candidates = [...pool];
  const picked: string[] = [];
  const target = Math.min(count, candidates.length);

  while (picked.length < target && candidates.length > 0) {
    const weights = candidates.map((phrase) => {
      const chars = [...phrase];
      const totalWrong = chars.reduce((sum, ch) => sum + (wrongCounts[ch] || 0), 0);
      const avgWrong = chars.length > 0 ? totalWrong / chars.length : 0;
      return 1 + Math.min(12, avgWrong * 2);
    });
    const total = weights.reduce((sum, w) => sum + w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(candidates[idx]);
    candidates.splice(idx, 1);
  }

  return picked;
}

interface TypingState {
  mode: PracticeMode;
  setMode: (mode: PracticeMode) => void;

  chars: TypedChar[];
  phraseRanges: PhraseRange[];
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
  sessionWrongChars: Record<string, { pinyin: string; flypyCode: string; count: number }>;
  totalKeystrokes: number;
  combo: number;
  maxCombo: number;

  loadChars: (pinyinChars: PinyinChar[]) => void;
  loadArticle: (text: string) => void;
  loadRandomChars: (count?: number) => void;
  loadRandomPhrases: (count?: number) => void;
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
  phraseRanges: [],
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
  sessionWrongChars: {},
  totalKeystrokes: 0,
  combo: 0,
  maxCombo: 0,

  setMode: (mode) => {
    set({
      mode,
      chars: [],
      phraseRanges: [],
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
      sessionWrongChars: {},
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
      phraseRanges: [],
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
      sessionWrongChars: {},
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
    const history = useHistoryStore.getState();
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
      const wrongCounts = Object.fromEntries(
        Object.entries(history.wrongChars).map(([char, item]) => [char, item.count])
      );
      selected = weightedSampleChars(pool, count, wrongCounts);
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

  loadRandomPhrases: (countOverride?: number) => {
    const settings = useSettingsStore.getState();
    const history = useHistoryStore.getState();
    const count = countOverride || settings.phraseCount;
    const wrongCounts = Object.fromEntries(
      Object.entries(history.wrongChars).map(([char, item]) => [char, item.count])
    );

    const selected = settings.practiceType === 'sequential'
      ? commonPhrases.slice(0, count)
      : weightedSamplePhrases(commonPhrases, count, wrongCounts);

    const pinyinChars: PinyinChar[] = [];
    const phraseRanges: PhraseRange[] = [];

    for (const phrase of selected) {
      const chars = textToPinyinChars(phrase).filter((pc) => pc.isChineseChar);
      if (chars.length === 0) continue;
      const start = pinyinChars.length;
      pinyinChars.push(...chars);
      phraseRanges.push({
        text: chars.map((c) => c.char).join(''),
        start,
        end: pinyinChars.length - 1,
      });
    }

    if (pinyinChars.length === 0) {
      get().loadRandomChars();
      return;
    }

    get().loadChars(pinyinChars);
    set({ phraseRanges });
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
        sessionWrongChars: {
          ...state.sessionWrongChars,
          [currentChar.pinyinChar.char]: {
            pinyin: currentChar.pinyinChar.pinyin,
            flypyCode: currentChar.pinyinChar.flypyCode,
            count: (state.sessionWrongChars[currentChar.pinyinChar.char]?.count || 0) + 1,
          },
        },
        combo: 0,
      });

      if (state.mode !== 'article') {
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
    let sessionWrongChars = state.sessionWrongChars;
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
        const existingWrong = sessionWrongChars[currentChar.pinyinChar.char];
        sessionWrongChars = {
          ...sessionWrongChars,
          [currentChar.pinyinChar.char]: {
            pinyin: currentChar.pinyinChar.pinyin,
            flypyCode: currentChar.pinyinChar.flypyCode,
            count: (existingWrong?.count || 0) + 1,
          },
        };
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
        sessionWrongChars,
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
        sessionWrongChars,
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
    } else if (state.mode === 'phrase') {
      get().loadRandomPhrases();
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
