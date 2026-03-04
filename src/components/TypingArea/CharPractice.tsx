import { useEffect } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function CharPractice() {
  const {
    chars, currentIndex, currentInput, isStarted, isFinished,
    loadRandomChars, handleKeyDown,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();

  useEffect(() => {
    if (chars.length === 0) {
      loadRandomChars();
    }
  }, [chars.length, loadRandomChars]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === 'Backspace' || (e.key.length === 1 && /[a-zA-Z]/.test(e.key))) {
        e.preventDefault();
        handleKeyDown(e.key);
      }
      if (e.key === 'Escape') {
        loadRandomChars();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, loadRandomChars]);

  if (chars.length === 0) {
    return <div className="text-center py-20 animate-pulse text-lg font-medium" style={{ color: 'var(--text-muted)' }}>准备练习材料...</div>;
  }

  const currentChar = chars[currentIndex];
  const visibleRange = 6;
  const start = Math.max(0, currentIndex - visibleRange);
  const end = Math.min(chars.length, currentIndex + visibleRange + 1);
  const visibleChars = chars.slice(start, end);

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-4xl py-8">
      {/* 核心专注区 */}
      <div className="relative flex flex-col items-center gap-8 w-full">
        {/* 背景大字装饰 (可选，增加设计感) */}
        <div className="absolute -top-10 opacity-[0.03] select-none pointer-events-none font-black text-[20rem] leading-none transition-all duration-500" style={{ color: 'var(--text-primary)' }}>
          {currentChar?.pinyinChar.char}
        </div>

        <div className="flex flex-col items-center gap-4 z-10">
          {showPinyin && currentChar && (
            <div className="px-3 py-1 rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300" 
                 style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              {currentChar.pinyinChar.pinyinWithTone}
            </div>
          )}
          
          <div
            className="font-black transition-all duration-300 transform"
            style={{
              fontSize: `${fontSize * 3.5}px`,
              color: currentChar?.status === 'wrong' ? 'var(--error)' : 'var(--text-primary)',
              textShadow: currentChar?.status === 'wrong' ? '0 0 20px rgba(239, 68, 68, 0.2)' : 'none',
              transform: currentChar?.status === 'wrong' ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {currentChar?.pinyinChar.char}
          </div>

          {showPinyin && currentChar && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 border-dashed transition-all duration-300"
                 style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <span className="text-xs font-bold uppercase tracking-tighter">双拼编码</span>
              <span className="font-mono font-black text-lg text-primary">{currentChar.pinyinChar.flypyCode}</span>
            </div>
          )}
        </div>

        {/* 输入反馈 */}
        <div className="flex items-center gap-3 h-16 z-10">
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
                    className="relative flex items-center justify-center w-12 h-14 rounded-2xl text-2xl font-mono font-black transition-all duration-150"
                    style={{
                      backgroundColor: isCorrect
                        ? 'var(--success)'
                        : isWrong
                          ? 'var(--error)'
                          : 'var(--bg-card)',
                      color: isTyped ? '#ffffff' : 'var(--text-muted)',
                      border: `2px solid ${isCursor ? 'var(--accent)' : isTyped ? 'transparent' : 'var(--border)'}`,
                      boxShadow: isCursor ? '0 0 15px var(--accent-light)' : 'var(--shadow-sm)',
                      transform: isCursor ? 'translateY(-4px)' : 'translateY(0)',
                    }}
                  >
                    {isTyped ? inputChar : letter}
                    {isCursor && (
                      <div className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-accent animate-bounce" />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* 字符流进度 */}
      <div className="flex items-center justify-center gap-3 w-full overflow-hidden px-4">
        {visibleChars.map((tc, i) => {
          const actualIndex = start + i;
          const isCurrent = actualIndex === currentIndex;
          return (
            <div
              key={actualIndex}
              className="flex-shrink-0 flex items-center justify-center rounded-2xl transition-all duration-300"
              style={{
                width: isCurrent ? `${fontSize * 2.2}px` : `${fontSize * 1.6}px`,
                height: isCurrent ? `${fontSize * 2.2}px` : `${fontSize * 1.6}px`,
                fontSize: isCurrent ? `${fontSize * 1.2}px` : `${fontSize * 0.9}px`,
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
                fontWeight: isCurrent ? '900' : '500',
                border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)',
                opacity: tc.status === 'correct' ? 0.4 : isCurrent ? 1 : 0.7,
                boxShadow: isCurrent ? 'var(--shadow-md)' : 'none',
              }}
            >
              {tc.pinyinChar.char}
            </div>
          );
        })}
      </div>

      {/* 交互提示 */}
      <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest px-6 py-2 rounded-full border border-dashed" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
        {isFinished ? (
          <span className="animate-pulse text-accent">练习完成 · 按 <kbd>Esc</kbd> 重新开始</span>
        ) : !isStarted ? (
          <span>开始输入即计时 · 按 <kbd>Esc</kbd> 换一批</span>
        ) : (
          <div className="flex gap-6">
            <span>按 <kbd>BS</kbd> 退格</span>
            <span>按 <kbd>Esc</kbd> 重置</span>
          </div>
        )}
      </div>
    </div>
  );
}
