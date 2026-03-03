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

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          {presetArticles.slice(0, 5).map((article, i) => (
            <button
              key={i}
              onClick={() => loadArticle(article.content)}
              className="px-3 py-1 text-xs rounded-full transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
            >
              {article.title}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowImport(!showImport)}
          className="px-3 py-1 text-xs rounded-full transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#fff',
          }}
        >
          导入文章
        </button>
      </div>

      {/* 导入面板 */}
      {showImport && (
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
        >
          <textarea
            ref={textareaRef}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="粘贴文章内容..."
            className="w-full h-32 p-3 rounded-lg resize-none text-sm"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              outline: 'none',
            }}
            autoFocus
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleImport}
              className="px-4 py-1.5 text-sm rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
            >
              开始练习
            </button>
            <label
              className="px-4 py-1.5 text-sm rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              上传 TXT
              <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
            </label>
            <button
              onClick={() => setShowImport(false)}
              className="px-4 py-1.5 text-sm rounded-lg cursor-pointer"
              style={{ color: 'var(--text-muted)' }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--accent)',
          }}
        />
      </div>

      {/* 当前字输入区 */}
      {currentChar && !isFinished && (
        <div className="flex items-center justify-center gap-4 py-3">
          <span
            className="font-bold"
            style={{
              fontSize: `${fontSize * 2}px`,
              color: currentChar.status === 'wrong' ? 'var(--error)' : 'var(--accent)',
            }}
          >
            {currentChar.pinyinChar.char}
          </span>
          {showPinyin && (
            <span className="text-base" style={{ color: 'var(--text-muted)' }}>
              {currentChar.pinyinChar.pinyinWithTone}
            </span>
          )}
          <div className="flex gap-1">
            {currentChar.pinyinChar.flypyCode.split('').map((letter, i) => {
              const inputChar = currentInput[i];
              const isTyped = i < currentInput.length;
              const isCorrect = isTyped && inputChar === letter;
              const isWrong = isTyped && inputChar !== letter;

              return (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-8 h-8 rounded text-lg font-mono font-bold"
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
                  }}
                >
                  {isTyped ? inputChar : '_'}
                </span>
              );
            })}
          </div>
          {showPinyin && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              [{currentChar.pinyinChar.flypyCode}]
            </span>
          )}
        </div>
      )}

      {/* 文章显示区 */}
      <div
        ref={containerRef}
        className="p-6 rounded-xl max-h-64 overflow-y-auto leading-relaxed"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          fontSize: `${fontSize}px`,
        }}
      >
        {chars.map((tc, i) => (
          <span
            key={i}
            data-current={i === currentIndex ? 'true' : undefined}
            className="inline-block transition-all duration-100"
            style={{
              color: tc.status === 'correct'
                ? 'var(--text-muted)'
                : tc.status === 'wrong'
                  ? 'var(--error)'
                  : i === currentIndex
                    ? 'var(--accent)'
                    : 'var(--text-primary)',
              fontWeight: i === currentIndex ? 'bold' : 'normal',
              textDecoration: i === currentIndex ? 'underline' : 'none',
              textUnderlineOffset: '4px',
              textDecorationColor: 'var(--accent)',
              opacity: tc.status === 'correct' ? 0.4 : 1,
            }}
          >
            {tc.pinyinChar.char}
          </span>
        ))}
      </div>

      {/* 完成提示 */}
      {isFinished && (
        <div className="text-center py-4">
          <p className="text-lg font-bold" style={{ color: 'var(--success)' }}>
            练习完成！
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            按 <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>Esc</kbd> 重新开始
          </p>
        </div>
      )}
    </div>
  );
}
