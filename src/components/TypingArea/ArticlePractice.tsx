import { useEffect, useRef, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { presetArticles } from '../../data/flypy';

export function ArticlePractice() {
  const {
    chars,
    currentIndex,
    isFinished,
    isPaused,
    togglePause,
    loadArticle,
    handleCharInput,
    handleBackspace,
    getProgress,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [charsPerLine, setCharsPerLine] = useState(30);
  const [inputPos, setInputPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chars.length === 0) {
      loadArticle(presetArticles[0].content);
    }
  }, [chars.length, loadArticle]);

  useEffect(() => {
    if (!showImport && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }

    if (!containerRef.current) return;
    const currentEl = containerRef.current.querySelector('[data-input-current="true"]');
    if (!currentEl) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const elRect = currentEl.getBoundingClientRect();
    setInputPos({
      top: elRect.top - containerRect.top + containerRef.current.scrollTop,
      left: elRect.left - containerRect.left,
    });
  }, [showImport, currentIndex]);

  useEffect(() => {
    if (!containerRef.current) return;
    const currentEl = containerRef.current.querySelector('[data-current="true"]');
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  useEffect(() => {
    const updateCharsPerLine = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const horizontalPadding = 32; // p-4
      const gap = 1; // gap-px
      const minCellSize = fontSize * 1.0;
      const availableWidth = Math.max(0, containerWidth - horizontalPadding);
      const next = Math.max(8, Math.floor((availableWidth + gap) / (minCellSize + gap)));
      setCharsPerLine((prev) => (prev === next ? prev : next));
    };

    updateCharsPerLine();

    if (!containerRef.current) return;
    const observer = new ResizeObserver(updateCharsPerLine);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [fontSize]);

  const handleImport = () => {
    if (importText.trim()) {
      loadArticle(importText.trim());
      setShowImport(false);
      setImportText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        loadArticle(text.trim());
        setShowImport(false);
        setImportText('');
      }
    };
    reader.readAsText(file);
  };

  const progress = getProgress();

  const lines: (typeof chars)[] = [];
  for (let i = 0; i < chars.length; i += charsPerLine) {
    lines.push(chars.slice(i, i + charsPerLine));
  }

  return (
    <div className="flex flex-1 flex-col gap-5 w-full max-w-4xl mx-auto py-4 pb-3 relative h-full min-h-0">
      {isPaused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)' }}>
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>已暂停</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>按 Space 或 Esc 继续</span>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2 px-2 shrink-0 min-h-[40px]">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {presetArticles.map((article, i) => (
            <button
              key={i}
              onClick={() => {
                loadArticle(article.content);
                setShowImport(false);
              }}
              className="btn-chip"
            >
              {article.title}
            </button>
          ))}
        </div>

        <button onClick={() => setShowImport(true)} className="btn-primary shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          导入文章
        </button>
      </div>

      {showImport && (
        <div
          className="p-5 rounded-xl shrink-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴文章内容..."
            className="w-full h-32 p-4 rounded-lg resize-none text-sm leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              outline: 'none',
              fontWeight: 500,
            }}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3">
            <button onClick={handleImport} className="btn-primary">
              开始练习
            </button>
            <label className="btn-secondary">
              上传 TXT
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={() => setShowImport(false)} className="btn-ghost">
              取消
            </button>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 min-h-0 flex flex-col gap-1.5 p-4 rounded-2xl overflow-y-auto custom-scrollbar relative"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
        }}
        onClick={() => hiddenInputRef.current?.focus()}
      >
        <input
          ref={hiddenInputRef}
          style={{
            position: 'absolute',
            top: `${inputPos.top}px`,
            left: `${inputPos.left}px`,
            width: '1px',
            height: `${fontSize * 1.1}px`,
            opacity: 0,
            border: 'none',
            outline: 'none',
            padding: 0,
            caretColor: 'transparent',
            zIndex: -1,
          }}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            const value = (e.target as HTMLInputElement).value;
            if (value) {
              handleCharInput(value);
              (e.target as HTMLInputElement).value = '';
            }
          }}
          onInput={(e) => {
            if (isComposing) return;
            const target = e.target as HTMLInputElement;
            const value = target.value;
            if (value) {
              handleCharInput(value);
              target.value = '';
            }
          }}
          onKeyDown={(e) => {
            if (e.ctrlKey || e.metaKey) return;
            if (isPaused) {
              if (e.key === ' ' || e.key === 'Escape') {
                e.preventDefault();
                togglePause();
              }
              return;
            }
            if (e.key === 'Escape') {
              loadArticle(presetArticles[0].content);
            }
            if (e.key === 'Backspace' && !isComposing) {
              e.preventDefault();
              handleBackspace();
            }
          }}
          autoFocus
        />

        {lines.map((lineChars, lineIdx) => {
          const lineStartIndex = lineIdx * charsPerLine;
          const isCurrentLine =
            currentIndex >= lineStartIndex && currentIndex < lineStartIndex + charsPerLine;

          return (
            <div
              key={lineIdx}
              data-current={isCurrentLine ? 'true' : undefined}
              className={`flex flex-col gap-0 transition-all duration-500 ${isCurrentLine ? 'scale-100 opacity-100' : 'scale-100 opacity-30 grayscale-[0.8]'}`}
            >
              <div
                className="grid gap-px w-full"
                style={{ gridTemplateColumns: `repeat(${charsPerLine}, minmax(0, 1fr))` }}
              >
                {lineChars.map((tc, charIdx) => {
                  const actualIdx = lineStartIndex + charIdx;
                  const isCurrent = actualIdx === currentIndex;
                  return (
                    <div key={charIdx} className="relative flex flex-col items-center w-full">
                      {isCurrent && showPinyin && (
                        <div className="absolute -top-6 whitespace-nowrap px-1.5 py-0.5 rounded bg-[var(--accent)] text-[10px] font-black text-white shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-200">
                          {tc.pinyinChar.pinyinWithTone}
                        </div>
                      )}

                      <span
                        className="inline-flex items-center justify-center font-bold transition-all duration-200"
                        style={{
                          width: '100%',
                          fontSize: `${fontSize * 0.7}px`,
                          color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {tc.pinyinChar.char}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div
                className="grid gap-px py-1 rounded-lg bg-[var(--bg-primary)]/40 border border-[var(--border)] w-full"
                style={{ gridTemplateColumns: `repeat(${charsPerLine}, minmax(0, 1fr))` }}
              >
                {lineChars.map((tc, charIdx) => {
                  const actualIdx = lineStartIndex + charIdx;
                  const isCurrent = actualIdx === currentIndex;
                  const isTyped = actualIdx < currentIndex;
                  const isWrong = tc.status === 'wrong';

                  return (
                    <div
                      key={charIdx}
                      data-input-current={isCurrent ? 'true' : undefined}
                      className="relative flex flex-col items-center justify-center rounded-lg transition-all duration-200"
                      style={{
                        width: '100%',
                        height: `${fontSize * 1.0}px`,
                        backgroundColor: isCurrent ? 'var(--accent-light)' : 'transparent',
                        border: isCurrent ? '2px solid var(--accent)' : 'none',
                        boxShadow: isCurrent ? '0 0 10px var(--accent-light)' : 'none',
                      }}
                    >
                      <span
                        className="font-black"
                        style={{
                          fontSize: `${fontSize * 0.7}px`,
                          color: isWrong ? 'var(--error)' : 'var(--success)',
                          opacity: isTyped ? 1 : 0,
                        }}
                      >
                        {isWrong && tc.userInput ? tc.userInput : tc.pinyinChar.char}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {isFinished && (
          <div className="py-10 text-center animate-bounce">
            <h2 className="text-3xl font-black text-[var(--success)] mb-2">练习圆满完成！</h2>
            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
              按 <kbd>Esc</kbd> 重新开始新的练习
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-6 shrink-0 mb-1">
        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border)]">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-500 shadow-[0_0_10px_var(--accent-light)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-black text-[var(--text-muted)] tracking-tighter w-12 text-right">
          {progress}%
        </span>
      </div>
    </div>
  );
}
