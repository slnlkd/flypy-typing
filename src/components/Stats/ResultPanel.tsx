import { useEffect, useRef } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useHistoryStore } from '../../stores/historyStore';

export function ResultPanel() {
  const {
    isFinished, mode, correctCount, wrongCount, maxCombo,
    getSpeed, getAccuracy, getElapsedTime, chars, loadRandomChars,
  } = useTypingStore();
  const { addRecord, addWrongChar } = useHistoryStore();
  const savedRef = useRef(false);

  // 练习完成时保存记录
  useEffect(() => {
    if (isFinished && !savedRef.current) {
      savedRef.current = true;
      const speed = getSpeed();
      const accuracy = getAccuracy();
      const duration = getElapsedTime();

      addRecord({
        mode,
        speed,
        accuracy,
        totalChars: correctCount + wrongCount,
        correctChars: correctCount,
        wrongChars: wrongCount,
        maxCombo,
        duration,
      });

      // 记录错误字
      chars.forEach((tc) => {
        if (tc.status === 'wrong') {
          addWrongChar(tc.pinyinChar.char, tc.pinyinChar.pinyin, tc.pinyinChar.flypyCode);
        }
      });
    }
    if (!isFinished) {
      savedRef.current = false;
    }
  }, [isFinished, mode, correctCount, wrongCount, maxCombo, chars, getSpeed, getAccuracy, getElapsedTime, addRecord, addWrongChar]);

  if (!isFinished) return null;

  const speed = getSpeed();
  const accuracy = getAccuracy();
  const elapsed = getElapsedTime();
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) loadRandomChars();
      }}
    >
      <div
        className="rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-2xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>
          练习完成！
        </h2>

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
            onClick={() => loadRandomChars()}
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
