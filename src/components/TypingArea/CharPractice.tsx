import { useEffect } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function CharPractice() {
  const {
    chars, currentIndex, currentInput, isStarted, isFinished,
    loadRandomChars, handleKeyDown,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();

  // 初始加载
  useEffect(() => {
    if (chars.length === 0) {
      loadRandomChars();
    }
  }, [chars.length, loadRandomChars]);

  // 监听键盘事件
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 防止浏览器默认行为
      if (e.key === 'Backspace' || (e.key.length === 1 && /[a-zA-Z]/.test(e.key))) {
        e.preventDefault();
        handleKeyDown(e.key);
      }
      // Escape 重新开始
      if (e.key === 'Escape') {
        loadRandomChars();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, loadRandomChars]);

  if (chars.length === 0) {
    return <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>加载中...</div>;
  }

  const currentChar = chars[currentIndex];

  // 显示范围：当前字前后各若干字
  const visibleRange = 8;
  const start = Math.max(0, currentIndex - visibleRange);
  const end = Math.min(chars.length, currentIndex + visibleRange + 1);
  const visibleChars = chars.slice(start, end);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 当前字大显示 */}
      <div className="flex flex-col items-center gap-2">
        {showPinyin && currentChar && (
          <div className="text-lg" style={{ color: 'var(--accent)' }}>
            {currentChar.pinyinChar.pinyinWithTone}
          </div>
        )}
        <div
          className="font-bold transition-all duration-150"
          style={{
            fontSize: `${fontSize * 2.5}px`,
            color: currentChar?.status === 'wrong' ? 'var(--error)' : 'var(--text-primary)',
          }}
        >
          {currentChar?.pinyinChar.char}
        </div>
        {/* 双拼编码提示 */}
        {showPinyin && currentChar && (
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            双拼：{currentChar.pinyinChar.flypyCode}
          </div>
        )}
      </div>

      {/* 输入显示 */}
      <div className="flex items-center gap-1 h-12">
        {currentChar && (
          <>
            {currentChar.pinyinChar.flypyCode.split('').map((letter, i) => {
              const inputChar = currentInput[i];
              const isTyped = i < currentInput.length;
              const isCorrect = isTyped && inputChar === letter;
              const isWrong = isTyped && inputChar !== letter;
              const isCursor = i === currentInput.length;

              return (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl font-mono font-bold transition-all duration-100"
                  style={{
                    backgroundColor: isCorrect
                      ? 'rgba(34, 197, 94, 0.15)'
                      : isWrong
                        ? 'rgba(239, 68, 68, 0.15)'
                        : 'var(--bg-secondary)',
                    color: isCorrect
                      ? 'var(--success)'
                      : isWrong
                        ? 'var(--error)'
                        : 'var(--text-muted)',
                    border: isCursor ? '2px solid var(--accent)' : '2px solid transparent',
                    transform: isTyped ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {isTyped ? inputChar : letter}
                </span>
              );
            })}
          </>
        )}
      </div>

      {/* 字列表 */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {visibleChars.map((tc, i) => {
          const actualIndex = start + i;
          const isCurrent = actualIndex === currentIndex;
          return (
            <span
              key={actualIndex}
              className="inline-flex items-center justify-center rounded-lg transition-all duration-200"
              style={{
                width: `${fontSize * 1.8}px`,
                height: `${fontSize * 1.8}px`,
                fontSize: `${fontSize}px`,
                backgroundColor: isCurrent
                  ? 'rgba(59, 130, 246, 0.1)'
                  : 'transparent',
                color: tc.status === 'correct'
                  ? 'var(--success)'
                  : tc.status === 'wrong'
                    ? 'var(--error)'
                    : isCurrent
                      ? 'var(--accent)'
                      : 'var(--text-muted)',
                fontWeight: isCurrent ? 'bold' : 'normal',
                border: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                opacity: tc.status === 'correct' ? 0.5 : 1,
              }}
            >
              {tc.pinyinChar.char}
            </span>
          );
        })}
      </div>

      {/* 操作提示 */}
      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
        {isFinished ? (
          <span>练习完成！按 <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Esc</kbd> 重新开始</span>
        ) : !isStarted ? (
          <span>开始输入即计时 · 按 <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Esc</kbd> 换一批</span>
        ) : (
          <span>按 <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Backspace</kbd> 退格 · <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Esc</kbd> 重新开始</span>
        )}
      </div>
    </div>
  );
}
