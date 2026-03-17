import { useEffect, useMemo, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function PhrasePractice() {
  const {
    chars, phraseRanges, currentIndex, currentInput, isStarted, isFinished,
    isPaused, togglePause,
    loadRandomPhrases, handleKeyDown,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (chars.length === 0) {
      loadRandomPhrases();
    }
  }, [chars.length, loadRandomPhrases]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      const key = typeof e.key === 'string' ? e.key : '';
      if (e.ctrlKey || e.metaKey) return;
      if (isPaused) {
        if (key === ' ' || key === 'Escape') {
          e.preventDefault();
          togglePause();
        }
        return;
      }
      if (key === 'Backspace' || (key.length === 1 && /[a-zA-Z]/.test(key))) {
        e.preventDefault();
        handleKeyDown(key);
      }
      if (key === 'Escape') {
        if (isStarted && !isFinished) {
          setShowResetConfirm(true);
        } else {
          loadRandomPhrases();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, loadRandomPhrases, isPaused, togglePause, isStarted, isFinished]);

  const currentChar = chars[currentIndex];
  const displayCharSize = showPinyin ? Math.min(fontSize * 1.35, 46) : Math.min(fontSize * 1.7, 58);
  const phraseCellSize = Math.min(fontSize * 1.15, 40);
  const phraseCellFont = Math.min(fontSize * 0.62, 22);
  const codeBoxHeight = showPinyin ? 40 : 44;
  const currentPhraseIndex = phraseRanges.findIndex((r) => currentIndex >= r.start && currentIndex <= r.end);
  const currentPhrase = currentPhraseIndex >= 0 ? phraseRanges[currentPhraseIndex] : null;

  const phraseProgress = useMemo(() => {
    if (phraseRanges.length === 0) return 0;
    const done = phraseRanges.filter((r) => r.end < currentIndex).length + (isFinished ? 1 : 0);
    return Math.min(100, Math.round((done / phraseRanges.length) * 100));
  }, [phraseRanges, currentIndex, isFinished]);

  const visiblePhrases = useMemo(() => {
    if (phraseRanges.length === 0) return [];
    const idx = Math.max(0, currentPhraseIndex);
    const start = Math.max(0, idx - 3);
    const end = Math.min(phraseRanges.length, idx + 4);
    return phraseRanges.slice(start, end);
  }, [phraseRanges, currentPhraseIndex]);

  if (chars.length === 0 || !currentChar) {
    return <div className="text-center py-20 animate-pulse text-lg font-medium" style={{ color: 'var(--text-muted)' }}>准备词组题目...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-3 w-full max-w-4xl mx-auto py-3 pb-2 relative h-full min-h-0">
      {isPaused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: '#fff' }}>已暂停</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>按 Space 或 Esc 继续</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-2 shrink-0 h-[40px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>词组/短句练习</span>
        </div>
        <button onClick={() => loadRandomPhrases()} className="btn-primary">
          换一批
        </button>
      </div>

      <div className="flex items-center gap-2 px-2 py-2 rounded-xl border shrink-0 overflow-x-auto overflow-y-hidden whitespace-nowrap custom-scrollbar"
           style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {visiblePhrases.map((p) => {
          const idx = phraseRanges.findIndex((r) => r.start === p.start);
          const isCurrent = idx === currentPhraseIndex;
          const isDone = p.end < currentIndex;
          return (
            <span
              key={`${p.start}-${p.end}`}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0"
              style={{
                backgroundColor: isCurrent ? 'var(--accent-light)' : 'var(--bg-card)',
                color: isDone ? 'var(--success)' : isCurrent ? 'var(--accent)' : 'var(--text-secondary)',
                border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                opacity: isDone ? 0.7 : 1,
              }}
            >
              {p.text}
            </span>
          );
        })}
      </div>

      <div className="relative flex flex-col items-center justify-center gap-1.5 w-full flex-1 min-h-0 py-3 px-4 rounded-xl overflow-hidden"
           style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        {currentPhrase && (
          <div className="flex gap-1.5 mb-1 flex-wrap justify-center">
            {[...currentPhrase.text].map((ch, i) => {
              const globalIndex = currentPhrase.start + i;
              const isCurrent = globalIndex === currentIndex;
              const status = chars[globalIndex]?.status;
              return (
                <span
                  key={`${globalIndex}-${ch}`}
                  className="inline-flex items-center justify-center rounded-lg font-bold transition-all"
                  style={{
                    width: `${phraseCellSize}px`,
                    height: `${phraseCellSize}px`,
                    fontSize: `${phraseCellFont}px`,
                    color: status === 'correct' ? 'var(--success)' : status === 'wrong' ? 'var(--error)' : isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                    border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                    backgroundColor: isCurrent ? 'var(--bg-card)' : 'transparent',
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        )}

        {showPinyin && (
          <div className="px-2.5 py-0.5 rounded-lg text-xs font-semibold tracking-wide"
               style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            {currentChar.pinyinChar.pinyinWithTone}
          </div>
        )}
        <div className="font-bold transition-all duration-300"
             style={{ fontSize: `${displayCharSize}px`, lineHeight: 1.1, color: currentChar.status === 'wrong' ? 'var(--error)' : 'var(--text-primary)' }}>
          {currentChar.pinyinChar.char}
        </div>
        {showPinyin && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border border-dashed"
               style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <span className="text-xs font-semibold">双拼编码</span>
            <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{currentChar.pinyinChar.flypyCode}</span>
          </div>
        )}

        <div className="flex items-center gap-2" style={{ minHeight: `${codeBoxHeight}px` }}>
          {currentChar.pinyinChar.flypyCode.split('').map((letter, i) => {
            const inputChar = currentInput[i];
            const isTyped = i < currentInput.length;
            const isCorrect = isTyped && inputChar === letter;
            const isWrong = isTyped && inputChar !== letter;
            const isCursor = i === currentInput.length;
            return (
              <div
                key={i}
                className="relative flex items-center justify-center rounded-lg font-mono font-bold transition-all duration-150"
                style={{
                  width: showPinyin ? '36px' : '40px',
                  height: showPinyin ? '40px' : '44px',
                  fontSize: showPinyin ? '18px' : '20px',
                  backgroundColor: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : 'var(--bg-card)',
                  color: isTyped ? '#ffffff' : 'var(--text-muted)',
                  border: `2px solid ${isCursor ? 'var(--accent)' : isTyped ? 'transparent' : 'var(--border)'}`,
                }}
              >
                {isTyped ? inputChar : letter}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 px-6 shrink-0 mb-1">
        <div className="flex-1 h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="h-full transition-all duration-500" style={{ width: `${phraseProgress}%`, backgroundColor: 'var(--accent)' }} />
        </div>
        <span className="text-xs font-semibold w-16 text-right" style={{ color: 'var(--text-muted)' }}>
          {phraseProgress}%
        </span>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="重置练习"
        message="当前词组练习进度将丢失，确定要重置吗？"
        confirmText="确定重置"
        onConfirm={() => { setShowResetConfirm(false); loadRandomPhrases(); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
