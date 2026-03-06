import { useState, useEffect } from 'react';
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
import { setMasterVolume } from './utils/sound';

function App() {
  const { mode, isFinished } = useTypingStore();
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { soundVolume } = useSettingsStore();

  useEffect(() => {
    setMasterVolume(soundVolume / 100);
  }, [soundVolume]);

  return (
    <div
      className="h-screen flex items-center justify-center px-4 py-3 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div
        className="w-full max-w-5xl flex flex-col rounded-2xl overflow-hidden shadow-lg h-full"
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border)',
        }}
      >
        <Header
          onShowHistory={() => setShowHistory(true)}
          onShowSettings={() => setShowSettings(true)}
        />

        <main className="flex-1 flex flex-col items-center gap-3 px-6 py-3 min-h-0 overflow-hidden">
          <KeyboardMap />
          <div className="w-full max-w-4xl flex-1 min-h-0 flex flex-col items-center overflow-hidden">
            {mode === 'char' ? <CharPractice /> : <ArticlePractice />}
          </div>
          <StatsBar />
        </main>

        <footer
          className="flex items-center justify-center gap-4 py-3 text-xs"
          style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
        >
          <span>小鹤双拼打字练习 · 键盘输入即开始</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <a
            href="https://flypy.cc/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            小鹤官网
          </a>
          <a
            href="https://rime.im/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            推荐 Rime 输入法
          </a>
        </footer>
      </div>

      {isFinished && <ResultPanel />}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
