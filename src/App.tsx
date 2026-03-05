import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { KeyboardMap } from './components/KeyboardMap/KeyboardMap';
import { CharPractice } from './components/TypingArea/CharPractice';
import { ArticlePractice } from './components/TypingArea/ArticlePractice';
import { StatsBar } from './components/Stats/StatsBar';
import { ResultPanel } from './components/Stats/ResultPanel';
import { HistoryPanel } from './components/Stats/HistoryPanel';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { useTypingStore } from './stores/typingStore';
import { useSettingsStore } from './stores/settingsStore';

function App() {
  const { mode, isFinished } = useTypingStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  useSettingsStore();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden shadow-lg"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
          minHeight: 'min(90vh, 900px)',
        }}
      >
        <Header
          onShowHistory={() => setShowHistory(true)}
          onShowSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 flex flex-col items-center gap-6 px-6 py-6">
          <KeyboardMap />
          <div className="w-full flex-1 flex flex-col items-center justify-center">
            {mode === 'char' ? <CharPractice /> : <ArticlePractice />}
          </div>
          <StatsBar />
        </main>

        <footer
          className="text-center py-3 text-xs"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        >
          小鹤双拼打字练习 · 键盘输入即开始
        </footer>
      </div>

      {isFinished && <ResultPanel />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
