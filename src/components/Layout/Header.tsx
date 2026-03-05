import { useState, useCallback } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import type { PracticeMode } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function Header({ onShowHistory, onShowSettings }: { onShowHistory: () => void; onShowSettings: () => void }) {
  const { mode, setMode, loadRandomChars, isStarted, isFinished } = useTypingStore();
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const [pendingMode, setPendingMode] = useState<PracticeMode | null>(null);

  const doModeChange = useCallback((newMode: PracticeMode) => {
    setMode(newMode);
    if (newMode === 'char') {
      loadRandomChars();
    }
  }, [setMode, loadRandomChars]);

  const handleModeChange = (newMode: PracticeMode) => {
    if (newMode === mode) return;
    if (isStarted && !isFinished) {
      setPendingMode(newMode);
    } else {
      doModeChange(newMode);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>⌨</span>
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>小鹤双拼练习</span>
      </div>

      {/* 模式切换 */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <ModeButton label="单字练习" active={mode === 'char'} onClick={() => handleModeChange('char')} />
        <ModeButton label="文章练习" active={mode === 'article'} onClick={() => handleModeChange('article')} />
      </div>

      {/* 工具按钮 */}
      <div className="flex items-center gap-2">
        <IconButton icon="📊" onClick={onShowHistory} title="练习历史" />
        <IconButton icon="⚙" onClick={onShowSettings} title="设置" />
        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          title={darkMode ? '切换日间模式' : '切换夜间模式'}
          aria-label={darkMode ? '切换日间模式' : '切换夜间模式'}
        >
          {darkMode ? '☀' : '🌙'}
        </button>
      </div>
      <ConfirmDialog
        open={pendingMode !== null}
        title="切换练习模式"
        message="当前练习进度将丢失，确定要切换吗？"
        confirmText="确定切换"
        onConfirm={() => { if (pendingMode) doModeChange(pendingMode); setPendingMode(null); }}
        onCancel={() => setPendingMode(null)}
      />
    </header>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="px-4 py-1.5 text-sm rounded-md transition-all cursor-pointer"
      style={{
        backgroundColor: active ? 'var(--bg-card)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontWeight: active ? 'bold' : 'normal',
        boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {label}
    </button>
  );
}

function IconButton({ icon, onClick, title }: { icon: string; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
      title={title}
      aria-label={title}
    >
      {icon}
    </button>
  );
}
