import { keyboardLayout } from '../../data/flypy';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTypingStore } from '../../stores/typingStore';

export function KeyboardMap() {
  const { showKeyboard, highlightKeys } = useSettingsStore();
  const { currentInput, chars, currentIndex } = useTypingStore();

  if (!showKeyboard) return null;

  // 当前正在输入的字的双拼编码
  const currentChar = chars[currentIndex];
  const expectedCode = currentChar?.pinyinChar.flypyCode || '';

  // 需要高亮的键
  const highlightedKeys = new Set<string>();
  if (highlightKeys && expectedCode) {
    if (currentInput.length === 0) {
      // 提示第一个键
      highlightedKeys.add(expectedCode[0].toUpperCase());
    } else if (currentInput.length === 1 && expectedCode.length > 1) {
      // 提示第二个键
      highlightedKeys.add(expectedCode[1].toUpperCase());
    }
  }

  // 当前按下的键
  const pressedKey = currentInput.length > 0 ? currentInput[currentInput.length - 1].toUpperCase() : '';

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          小鹤双拼键位图
        </h3>
        <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
            声母
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
            韵母
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {keyboardLayout.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-1 justify-center"
            style={{ paddingLeft: rowIdx === 1 ? '20px' : rowIdx === 2 ? '50px' : '0' }}
          >
            {row.map((keyInfo) => {
              const isHighlighted = highlightedKeys.has(keyInfo.key);
              const isPressed = pressedKey === keyInfo.key;

              return (
                <div
                  key={keyInfo.key}
                  className="flex flex-col items-center rounded-lg transition-all duration-100"
                  style={{
                    width: '60px',
                    minHeight: '56px',
                    padding: '4px 2px',
                    backgroundColor: isPressed
                      ? 'var(--accent)'
                      : isHighlighted
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'var(--bg-card)',
                    border: `1.5px solid ${isHighlighted ? 'var(--accent)' : 'var(--border)'}`,
                    color: isPressed ? '#ffffff' : 'var(--text-primary)',
                    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
                    boxShadow: isHighlighted ? '0 0 8px rgba(59, 130, 246, 0.3)' : 'none',
                  }}
                >
                  <span className="text-base font-bold leading-tight">{keyInfo.key}</span>
                  <div className="flex flex-col items-center gap-0 mt-0.5">
                    {keyInfo.initial && (
                      <span
                        className="text-[10px] font-medium leading-tight"
                        style={{ color: isPressed ? '#fca5a5' : '#ef4444' }}
                      >
                        {keyInfo.initial}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-medium leading-tight"
                      style={{ color: isPressed ? '#93c5fd' : '#3b82f6' }}
                    >
                      {keyInfo.finals.join(' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
