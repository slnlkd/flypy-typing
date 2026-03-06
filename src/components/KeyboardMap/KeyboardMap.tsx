import { keyboardLayout } from '../../data/flypy';
import { useSettingsStore } from '../../stores/settingsStore';
import { useTypingStore } from '../../stores/typingStore';

export function KeyboardMap() {
  const { showKeyboard, highlightKeys } = useSettingsStore();
  const { currentInput, chars, currentIndex, mode } = useTypingStore();

  if (!showKeyboard) return null;

  const currentChar = chars[currentIndex];
  const expectedCode = currentChar?.pinyinChar.flypyCode || '';

  const highlightedKeys = new Set<string>();
  if (highlightKeys && expectedCode) {
    if (mode === 'article') {
      for (const ch of expectedCode) {
        highlightedKeys.add(ch.toUpperCase());
      }
    } else {
      if (currentInput.length === 0) {
        highlightedKeys.add(expectedCode[0].toUpperCase());
      } else if (currentInput.length === 1 && expectedCode.length > 1) {
        highlightedKeys.add(expectedCode[1].toUpperCase());
      }
    }
  }

  const pressedKey = currentInput.length > 0 ? currentInput[currentInput.length - 1].toUpperCase() : '';

  return (
    <div className="w-full max-w-4xl mx-auto select-none p-6 rounded-xl"
         role="img"
         aria-label="小鹤双拼键盘布局参考"
         style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            小鹤双拼
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>键盘布局参考</p>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <span className="flex items-center gap-2 px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--error)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            声母
          </span>
          <span className="flex items-center gap-2 px-2 py-1 rounded-md" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            韵母
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {keyboardLayout.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className="flex gap-2 justify-center"
            style={{
              paddingLeft: rowIdx === 1 ? '24px' : rowIdx === 2 ? '52px' : '0',
            }}
          >
            {row.map((keyInfo) => {
              const isHighlighted = highlightedKeys.has(keyInfo.key);
              const isPressed = pressedKey === keyInfo.key;

              return (
                <div
                  key={keyInfo.key}
                  className="relative flex flex-col items-center justify-between rounded-lg transition-all duration-75"
                  style={{
                    width: '64px',
                    height: '68px',
                    padding: '8px 4px',
                    backgroundColor: isPressed
                      ? 'var(--accent)'
                      : isHighlighted
                        ? 'var(--accent-light)'
                        : 'var(--bg-card)',
                    border: `1px solid ${isPressed ? 'var(--accent)' : isHighlighted ? 'var(--accent)' : 'var(--border)'}`,
                    color: isPressed ? '#ffffff' : isHighlighted ? 'var(--accent)' : 'var(--text-primary)',
                    transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                  }}
                >
                  <span className="text-xl font-bold leading-none self-start ml-1 opacity-90">{keyInfo.key}</span>

                  <div className="flex flex-col items-end w-full pr-1">
                    {keyInfo.initial && (
                      <span
                        className="text-[11px] font-semibold leading-none mb-0.5"
                        style={{ color: isPressed ? 'rgba(255,255,255,0.9)' : 'var(--error)' }}
                      >
                        {keyInfo.initial}
                      </span>
                    )}
                    <span
                      className="text-[10px] font-semibold leading-none tracking-tighter overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                      style={{ color: isPressed ? 'rgba(255,255,255,0.8)' : 'var(--accent)' }}
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
