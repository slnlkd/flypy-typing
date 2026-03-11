import { useEffect, useRef, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useArticleStore } from '../../stores/articleStore';
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
  const { cloudArticles } = useArticleStore();

  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [charsPerLine, setCharsPerLine] = useState(30);
  const [inputPos, setInputPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const articles = cloudArticles.length > 0 ? cloudArticles : presetArticles.map((article, index) => ({
    id: `local-${index}`,
    title: article.title,
    category: '内置',
    difficulty: 'medium',
    tags: [],
    content: article.content,
    updatedAt: new Date().toISOString(),
  }));

  useEffect(() => {
    if (chars.length === 0) {
      loadArticle(articles[0]?.content || presetArticles[0].content);
    }
  }, [articles, chars.length, loadArticle]);

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
      const horizontalPadding = 32;
      const gap = 1;
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const text = loadEvent.target?.result as string;
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
  for (let index = 0; index < chars.length; index += charsPerLine) {
    lines.push(chars.slice(index, index + charsPerLine));
  }

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
      <div className="flex items-center gap-2 px-2 shrink-0 min-h-[40px]">
        <div className="flex gap-1.5 flex-wrap flex-1">
          {articles.map((article) => (
            <button
              key={article.id}
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
          导入文章
        </button>
      </div>

      {showImport && (
        <div
          className="p-5 rounded-xl shrink-0"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
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
        className="flex-1 min-h-0 flex flex-col gap-1.5 p-4 rounded-xl overflow-y-auto custom-scrollbar relative"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          paddingTop: showPinyin ? '36px' : undefined,
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
          onCompositionEnd={(event) => {
            setIsComposing(false);
            const value = (event.target as HTMLInputElement).value;
            if (value) {
              handleCharInput(value);
              (event.target as HTMLInputElement).value = '';
            }
          }}
          onInput={(event) => {
            if (isComposing) return;
            const target = event.target as HTMLInputElement;
            const value = target.value;
            if (value) {
              handleCharInput(value);
              target.value = '';
            }
          }}
          onKeyDown={(event) => {
            if (event.ctrlKey || event.metaKey) return;
            if (isPaused) {
              if (event.key === ' ' || event.key === 'Escape') {
                event.preventDefault();
                togglePause();
              }
              return;
            }
            if (event.key === 'Escape') {
              loadArticle(articles[0]?.content || presetArticles[0].content);
            }
            if (event.key === 'Backspace' && !isComposing) {
              event.preventDefault();
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
                        <div
                          className="absolute -top-5 whitespace-nowrap px-1 py-0.5 rounded text-[10px] font-semibold text-white shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200"
                          style={{ backgroundColor: 'var(--accent)' }}
                        >
                          {tc.pinyinChar.flypyCode.toUpperCase()}
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
                className="grid gap-px py-1 rounded-lg border border-[var(--border)] w-full"
                style={{
                  gridTemplateColumns: `repeat(${charsPerLine}, minmax(0, 1fr))`,
                  backgroundColor: isCurrentLine ? 'var(--accent-light)' : 'var(--bg-primary)',
                }}
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
                      }}
                    >
                      <span
                        className="font-bold"
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
          <div className="py-10 text-center">
            <h2 className="text-3xl font-bold text-[var(--success)] mb-2">练习圆满完成！</h2>
            <p className="text-sm text-[var(--text-muted)]">
              按 <kbd>Esc</kbd> 重新开始新的练习
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-6 shrink-0 mb-1">
        <div className="flex-1 h-2 rounded-full overflow-hidden border border-[var(--border)]" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
          />
        </div>
        <span className="text-xs font-semibold w-12 text-right" style={{ color: 'var(--text-muted)' }}>
          {progress}%
        </span>
      </div>
    </div>
  );
}
