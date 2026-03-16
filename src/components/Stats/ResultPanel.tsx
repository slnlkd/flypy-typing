import { useEffect, useRef } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useHistoryStore } from '../../stores/historyStore';
import { getSpeedLevel } from '../../utils/speedLevel';
import { useSettingsStore } from '../../stores/settingsStore';
import { playFinishSound } from '../../utils/sound';
import { presetArticles } from '../../data/flypy';
import { useAuthStore } from '../../stores/authStore';
import { batchSyncWrongChars, savePracticeRecord } from '../../api/client';

export function ResultPanel() {
  const {
    isFinished, mode, correctCount, wrongCount, maxCombo,
    getSpeed, getAccuracy, getElapsedTime, sessionWrongChars, loadRandomChars, loadRandomPhrases, loadArticle,
  } = useTypingStore();
  const { addRecord, addWrongChar } = useHistoryStore();
  const { soundEnabled } = useSettingsStore();
  const { token } = useAuthStore();
  const savedRef = useRef(false);

  useEffect(() => {
    if (isFinished && !savedRef.current) {
      savedRef.current = true;
      const speed = getSpeed();
      const accuracy = getAccuracy();
      const duration = getElapsedTime();

      if (soundEnabled) playFinishSound();

      const newRecord = addRecord({
        mode,
        speed,
        accuracy,
        totalChars: correctCount + wrongCount,
        correctChars: correctCount,
        wrongChars: wrongCount,
        maxCombo,
        duration,
      });

      Object.entries(sessionWrongChars).forEach(([char, item]) => {
        for (let i = 0; i < item.count; i++) {
          addWrongChar(char, item.pinyin, item.flypyCode);
        }
      });

      if (token) {
        void savePracticeRecord(token, newRecord).catch(() => undefined);
        const latestWrongChars = Object.values(useHistoryStore.getState().wrongChars);
        void batchSyncWrongChars(token, latestWrongChars).catch(() => undefined);
      }
    }
    if (!isFinished) {
      savedRef.current = false;
    }
  }, [isFinished, mode, correctCount, wrongCount, maxCombo, sessionWrongChars, getSpeed, getAccuracy, getElapsedTime, addRecord, addWrongChar, soundEnabled, token]);

  if (!isFinished) return null;

  const restartPractice = () => {
    if (mode === 'char') {
      loadRandomChars();
    } else if (mode === 'phrase') {
      loadRandomPhrases();
    } else {
      loadArticle(presetArticles[0].content);
    }
  };

  const speed = getSpeed();
  const accuracy = getAccuracy();
  const elapsed = getElapsedTime();
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const level = getSpeedLevel(speed);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) restartPractice();
      }}
    >
      <div
        className="rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg animate-in zoom-in-95 duration-300"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-label="练习结果"
      >
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
          练习完成！
        </h2>

        <div className="flex flex-col items-center mb-6">
          <div
            className="text-4xl font-bold mt-2 mb-1"
            style={{ color: level.color }}
          >
            {level.level}
          </div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Speed Level
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <ResultItem label="打字速度" value={`${speed}`} unit="字/分" large />
          <ResultItem label="正确率" value={`${accuracy}%`} large />
          <ResultItem label="正确" value={`${correctCount}`} color="var(--success)" />
          <ResultItem label="错误" value={`${wrongCount}`} color="var(--error)" />
          <ResultItem label="最大连击" value={`${maxCombo}`} color="var(--warning)" />
          <ResultItem label="用时" value={`${minutes}:${seconds.toString().padStart(2, '0')}`} />
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={restartPractice}
            className="px-6 py-2 rounded-lg font-medium text-white cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            再来一次
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value, unit, color, large }: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  large?: boolean;
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-3 rounded-xl"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={`font-bold ${large ? 'text-2xl' : 'text-lg'}`}
        style={{ color: color || 'var(--text-primary)' }}
      >
        {value}
      </span>
      {unit && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
    </div>
  );
}
