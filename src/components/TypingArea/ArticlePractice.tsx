import { useEffect, useState, useRef } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { presetArticles } from '../../data/flypy';

export function ArticlePractice() {
  const {
    chars, currentIndex, currentInput, isFinished,
    loadArticle, handleKeyDown, getProgress,
  } = useTypingStore();
  const { showPinyin, fontSize } = useSettingsStore();
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 初始加载默认文章
  useEffect(() => {
    if (chars.length === 0) {
      loadArticle(presetArticles[0].content);
    }
  }, [chars.length, loadArticle]);

  // 监听键盘事件
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (showImport) return; // 导入框打开时不拦截

      if (e.key === 'Backspace' || (e.key.length === 1 && /[a-zA-Z]/.test(e.key))) {
        e.preventDefault();
        handleKeyDown(e.key);
      }
      if (e.key === 'Escape') {
        loadArticle(presetArticles[0].content);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyDown, loadArticle, showImport]);

  // 自动滚动到当前字
  useEffect(() => {
    if (containerRef.current) {
      const currentEl = containerRef.current.querySelector('[data-current="true"]');
      if (currentEl) {
        currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIndex]);

  const handleImport = () => {
    if (importText.trim()) {
      loadArticle(importText.trim());
      setShowImport(false);
      setImportText('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
    }
  };

  const currentChar = chars[currentIndex];
  const progress = getProgress();

  // 将字符数组按固定宽度分行（例如每行 20 个汉字）
  const charsPerLine = 20;
  const lines: (typeof chars)[] = [];
  for (let i = 0; i < chars.length; i += charsPerLine) {
    lines.push(chars.slice(i, i + charsPerLine));
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-4">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex gap-2 flex-wrap flex-1">
          {presetArticles.map((article, i) => (
            <button
              key={i}
              onClick={() => loadArticle(article.content)}
              className="px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {article.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-4 py-1.5 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
            boxShadow: '0 4px 12px var(--accent-light)',
          }}
        >
          导入自定义文章
        </button>
      </div>

      {/* 导入面板 */}
      {showImport && (
        <div
          className="p-6 rounded-2xl animate-in fade-in zoom-in duration-300"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}
        >
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴文章内容..."
            className="w-full h-40 p-4 rounded-xl resize-none text-sm font-medium leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              outline: 'none',
            }}
            autoFocus
          />
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleImport}
              className="px-6 py-2 text-sm font-bold rounded-xl cursor-pointer transition-all active:scale-95"
              style={{ backgroundColor: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-light)' }}
            >
              立即开始
            </button>
            <label
              className="px-6 py-2 text-sm font-bold rounded-xl cursor-pointer bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)]"
            >
              上传 TXT
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => setShowImport(false)}
              className="px-4 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 练习区 - 分行对照显示 */}
      <div
        ref={containerRef}
        className="flex-1 flex flex-col gap-6 p-10 rounded-[2rem] overflow-y-auto custom-scrollbar"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
        }}
      >
        {lines.map((lineChars, lineIdx) => {
          const lineStartIndex = lineIdx * charsPerLine;
          const isCurrentLine = currentIndex >= lineStartIndex && currentIndex < lineStartIndex + charsPerLine;

          return (
            <div 
              key={lineIdx} 
              data-current={isCurrentLine ? 'true' : undefined}
              className={`flex flex-col gap-2 transition-all duration-500 ${isCurrentLine ? 'scale-100 opacity-100' : 'scale-95 opacity-30 grayscale-[0.8]'}`}
            >
              {/* 原文字行 */}
              <div className="flex justify-center gap-1.5">
                {lineChars.map((tc, charIdx) => {
                  const actualIdx = lineStartIndex + charIdx;
                  const isCurrent = actualIdx === currentIndex;
                  return (
                    <div key={charIdx} className="relative flex flex-col items-center">
                      {/* 当前字的拼音提示 - 移至原文上方 */}
                      {isCurrent && showPinyin && (
                        <div className="absolute -top-6 whitespace-nowrap px-1.5 py-0.5 rounded bg-[var(--accent)] text-[10px] font-black text-white shadow-lg animate-in fade-in slide-in-from-bottom-1 duration-200">
                          {tc.pinyinChar.pinyinWithTone}
                        </div>
                      )}
                      
                      <span
                        className="inline-flex items-center justify-center font-bold transition-all duration-200"
                        style={{
                          width: `${fontSize * 1.5}px`,
                          fontSize: `${fontSize}px`,
                          color: isCurrent ? 'var(--accent)' : 'var(--text-primary)',
                        }}
                      >
                        {tc.pinyinChar.char}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 打字输入行 */}
              <div className="flex justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--bg-primary)]/40 border border-[var(--border)]">
                {lineChars.map((tc, charIdx) => {
                  const actualIdx = lineStartIndex + charIdx;
                  const isCurrent = actualIdx === currentIndex;
                  const isTyped = actualIdx < currentIndex;
                  const isWrong = tc.status === 'wrong';

                  return (
                    <div
                      key={charIdx}
                      className="relative flex flex-col items-center justify-center rounded-lg transition-all duration-200"
                      style={{
                        width: `${fontSize * 1.5}px`,
                        height: `${fontSize * 1.5}px`,
                        backgroundColor: isCurrent 
                          ? 'var(--accent-light)' 
                          : 'transparent',
                        border: isCurrent ? '2px solid var(--accent)' : 'none',
                        boxShadow: isCurrent ? '0 0 10px var(--accent-light)' : 'none',
                      }}
                    >
                      {/* 已输入的汉字 */}
                      <span
                        className="font-black"
                        style={{
                          fontSize: `${fontSize * 1.1}px`,
                          color: isWrong ? 'var(--error)' : 'var(--success)',
                          opacity: isTyped ? 1 : 0,
                        }}
                      >
                        {tc.pinyinChar.char}
                      </span>

                      {/* 当前输入的编码提示 - 移至输入框上方 */}
                      {isCurrent && (
                        <div className="absolute -top-5 flex gap-0.5">
                          {tc.pinyinChar.flypyCode.split('').map((letter, i) => {
                            const isCharTyped = i < currentInput.length;
                            return (
                              <span 
                                key={i} 
                                className={`text-[9px] font-black w-3.5 h-3.5 flex items-center justify-center rounded-sm shadow-sm ${isCharTyped ? 'bg-[var(--success)] text-white' : 'bg-white text-[var(--accent)] border border-[var(--accent)]'}`}
                              >
                                {isCharTyped ? currentInput[i].toUpperCase() : letter.toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 练习完成状态 */}
        {isFinished && (
          <div className="py-10 text-center animate-bounce">
            <h2 className="text-3xl font-black text-[var(--success)] mb-2">练习圆满完成！</h2>
            <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">
              按 <kbd>Esc</kbd> 重新开始新的练习
            </p>
          </div>
        )}
      </div>

      {/* 底部进度提示 */}
      <div className="flex items-center gap-4 px-6">
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
