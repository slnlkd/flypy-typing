import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { KeyboardMap } from './components/KeyboardMap/KeyboardMap';
import { CharPractice } from './components/TypingArea/CharPractice';
import { ArticlePractice } from './components/TypingArea/ArticlePractice';
import { StatsBar } from './components/Stats/StatsBar';
import { ResultPanel } from './components/Stats/ResultPanel';
import { HistoryPanel } from './components/Stats/HistoryPanel';
import { useTypingStore } from './stores/typingStore';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const { mode, isFinished } = useTypingStore();
  const [showHistory, setShowHistory] = useState(false);
  useSettingsStore();

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 bg-[var(--bg-secondary)] overflow-hidden">
      {/* 主容器 */}
      <div className="w-full max-w-6xl h-full max-h-[940px] flex flex-col rounded-[2.5rem] bg-[var(--bg-primary)] border border-[var(--border)] shadow-2xl transition-all duration-500 overflow-hidden relative">
        
        <Header onShowHistory={() => setShowHistory(true)} />

        <main className="flex-1 flex flex-col items-center px-10 py-4 relative overflow-y-auto custom-scrollbar">
          {/* 背景装饰性圆环 */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          {/* 练习区 - 占据主要空间并居中其内容 */}
          <section className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px] z-10">
            {mode === 'char' ? <CharPractice /> : <ArticlePractice />}
          </section>

          {/* 辅助区 - 紧凑排列在下方 */}
          <div className="w-full mt-auto flex flex-col gap-6 z-10">
            {/* 键位图 */}
            <section className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
              <KeyboardMap />
            </section>

            {/* 统计栏 */}
            <section className="w-full mb-2">
              <StatsBar />
            </section>
          </div>
        </main>

        {/* 底部版权 */}
        <footer className="px-10 py-3 flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Flypy Pro Edition
          </p>
          <div className="flex gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shadow-[0_0_8px_var(--success)]" />
              Engine Ready
            </span>
          </div>
        </footer>
      </div>

      {/* 成绩面板 */}
      {isFinished && <ResultPanel />}

      {/* 历史记录面板 */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}

export default App;
