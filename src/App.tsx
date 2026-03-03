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
  useSettingsStore(); // 确保 settings hydrate

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Header onShowHistory={() => setShowHistory(true)} />

      <main className="flex-1 flex flex-col items-center gap-6 px-4 py-6 max-w-5xl mx-auto w-full">
        {/* 键位图 */}
        <KeyboardMap />

        {/* 练习区 */}
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          {mode === 'char' ? <CharPractice /> : <ArticlePractice />}
        </div>

        {/* 统计栏 */}
        <StatsBar />
      </main>

      {/* 底部 */}
      <footer className="text-center py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        小鹤双拼打字练习 · 键盘输入即开始
      </footer>

      {/* 成绩面板 */}
      {isFinished && <ResultPanel />}

      {/* 历史记录面板 */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}

export default App;
