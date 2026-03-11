import { useEffect, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function CharPractice() {
  const {
    chars, currentIndex, currentInput, isStarted, isFinished,
    isPaused, togglePause,
    loadRandomChars, handleKeyDown,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (chars.length === 0) {
      loadRandomChars();
    }
  }, [chars.length, loadRandomChars]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
          loadRandomChars();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, loadRandomChars, isPaused, togglePause, isStarted, isFinished]);

  if (chars.length === 0) {
    return <div className="text-center py-20 animate-pulse text-lg font-medium" style={{ color: 'var(--text-muted)' }}>准备练习材料...</div>;
  }

  const currentChar = chars[currentIndex];
  const displayCharSize = Math.min(fontSize * 1.7, 58);
  const visibleRange = 6;
  const start = Math.max(0, currentIndex - visibleRange);
  const end = Math.min(chars.length, currentIndex + visibleRange + 1);
  const visibleChars = chars.slice(start, end);

  return (
    <div className="flex flex-1 flex-col gap-5 w-full max-w-4xl mx-auto py-4 pb-3 relative h-full min-h-0">
      {isPaused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="flex flex-col items-center gap-3">
            <span className="text-2xl font-bold" style={{ color: '#fff' }}>已暂停</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>按 Space 或 Esc 继续</span>
          </div>
        </div>
      )}

      {/* 顶部状态对齐栏 */}
      <div className="flex items-center justify-between px-2 shrink-0 h-[40px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>单字练习</span>
          </div>
        </div>
        <button
          onClick={() => loadRandomChars()}
          className="btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          换一批
        </button>
      </div>

      {/* 核心专注区 */}
      <div
        className="relative flex flex-col items-center justify-center gap-1.5 w-full flex-1 min-h-0 py-3 px-4 rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex flex-col items-center gap-1.5 z-10">
          {showPinyin && currentChar && (
            <div className="px-3 py-1 rounded-lg text-sm font-semibold tracking-wide transition-all duration-300"
                 style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              {currentChar.pinyinChar.pinyinWithTone}
            </div>
          )}

          <div
            className="font-bold transition-all duration-300 transform"
            style={{
              fontSize: `${displayCharSize}px`,
              lineHeight: 1.1,
              color: currentChar?.status === 'wrong' ? 'var(--error)' : 'var(--text-primary)',
              transform: currentChar?.status === 'wrong' ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {currentChar?.pinyinChar.char}
          </div>

          {showPinyin && currentChar && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-dashed transition-all duration-300"
                 style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <span className="text-xs font-semibold">双拼编码</span>
              <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{currentChar.pinyinChar.flypyCode}</span>
            </div>
          )}
        </div>

        {/* 输入反馈 */}
        <div className="flex items-center gap-2 h-11 z-10">
          {currentChar && (
            <>
              {currentChar.pinyinChar.flypyCode.split('').map((letter, i) => {
                const inputChar = currentInput[i];
                const isTyped = i < currentInput.length;
                const isCorrect = isTyped && inputChar === letter;
                const isWrong = isTyped && inputChar !== letter;
                const isCursor = i === currentInput.length;

                return (
                  <div
                    key={i}
                    className="relative flex items-center justify-center w-10 h-11 rounded-lg text-xl font-mono font-bold transition-all duration-150"
                    style={{
                      backgroundColor: isCorrect
                        ? 'var(--success)'
                        : isWrong
                          ? 'var(--error)'
                          : 'var(--bg-card)',
                      color: isTyped ? '#ffffff' : 'var(--text-muted)',
                      border: `2px solid ${isCursor ? 'var(--accent)' : isTyped ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {isTyped ? inputChar : letter}
                    {isCursor && (
                      <div className="absolute -bottom-1 w-5 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 字符流进度 */}
      <div className="flex items-center justify-center gap-2 w-full overflow-hidden px-4 shrink-0 -mt-1">
        {visibleChars.map((tc, i) => {
          const actualIndex = start + i;
          const isCurrent = actualIndex === currentIndex;
          return (
            <div
              key={actualIndex}
              className="flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-300"
              style={{
                width: isCurrent ? `${fontSize * 1.8}px` : `${fontSize * 1.3}px`,
                height: isCurrent ? `${fontSize * 1.8}px` : `${fontSize * 1.3}px`,
                fontSize: isCurrent ? `${fontSize * 1}px` : `${fontSize * 0.75}px`,
                backgroundColor: isCurrent
                  ? 'var(--bg-card)'
                  : tc.status === 'correct'
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'transparent',
                color: tc.status === 'correct'
                  ? 'var(--success)'
                  : tc.status === 'wrong'
                    ? 'var(--error)'
                    : isCurrent
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                fontWeight: isCurrent ? '700' : '500',
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)',
                opacity: tc.status === 'correct' ? 0.4 : isCurrent ? 1 : 0.7,
              }}
            >
              {tc.pinyinChar.char}
            </div>
          );
        })}
      </div>

      {/* 交互提示 */}
      <div className="flex items-center gap-6 text-xs font-medium px-4 py-1.5 rounded-lg border border-dashed shrink-0 mb-1" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        {isFinished ? (
          <span style={{ color: 'var(--accent)' }}>练习完成 · 按 <kbd>Esc</kbd> 重新开始</span>
        ) : !isStarted ? (
          <span>开始输入即计时 · 按 <kbd>Esc</kbd> 换一批</span>
        ) : (
          <div className="flex gap-6">
            <span>按 <kbd>BS</kbd> 退格</span>
            <span>按 <kbd>Esc</kbd> 重置</span>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="重置练习"
        message="当前练习进度将丢失，确定要重置吗？"
        confirmText="确定重置"
        onConfirm={() => { setShowResetConfirm(false); loadRandomChars(); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
