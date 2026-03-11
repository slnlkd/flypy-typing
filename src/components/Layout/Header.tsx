import type { ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { useTypingStore } from '../../stores/typingStore';
import type { PracticeMode } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function Header({
  onShowHistory,
  onShowSettings,
  onShowAuth,
}: {
  onShowHistory: () => void;
  onShowSettings: () => void;
  onShowAuth: () => void;
}) {
  const { mode, setMode, loadRandomChars, loadRandomPhrases, isStarted, isFinished } = useTypingStore();
  const { darkMode, toggleDarkMode } = useSettingsStore();
  const { user } = useAuthStore();
  const [pendingMode, setPendingMode] = useState<PracticeMode | null>(null);
  const logoSrc = `${import.meta.env.BASE_URL}flypy-icon-guofeng-fan.svg`;

  const doModeChange = useCallback((newMode: PracticeMode) => {
    setMode(newMode);
    if (newMode === 'char') {
      loadRandomChars();
    } else if (newMode === 'phrase') {
      loadRandomPhrases();
    }
  }, [setMode, loadRandomChars, loadRandomPhrases]);

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
      <div className="flex items-center gap-2">
        <img
          src={logoSrc}
          alt="小鹤双拼练习"
          className="w-6 h-6 rounded-md"
        />
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>小鹤双拼练习</span>
      </div>

      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <ModeButton label="单字练习" active={mode === 'char'} onClick={() => handleModeChange('char')} />
        <ModeButton label="词组短句" active={mode === 'phrase'} onClick={() => handleModeChange('phrase')} />
        <ModeButton label="文章练习" active={mode === 'article'} onClick={() => handleModeChange('article')} />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onShowAuth}
          className="h-8 rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-2"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: user ? 'var(--accent)' : 'var(--text-secondary)',
          }}
          title={user ? `已登录：${user.email}` : '登录云同步'}
          aria-label={user ? `已登录：${user.email}` : '登录云同步'}
        >
          <CloudIcon />
          <span>{user ? '退出登录' : '登录同步'}</span>
        </button>
        <IconButton icon={<ChartIcon />} onClick={onShowHistory} title="练习历史" />
        <IconButton icon={<SettingsIcon />} onClick={onShowSettings} title="设置" />
        <IconButton
          icon={darkMode ? <SunIcon /> : <MoonIcon />}
          onClick={toggleDarkMode}
          title={darkMode ? '切换日间模式' : '切换夜间模式'}
        />
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

function IconButton({ icon, onClick, title }: { icon: ReactNode; onClick: () => void; title: string }) {
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

function CloudIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 17.5a4.5 4.5 0 0 0-1.1-8.87A6 6 0 0 0 7.3 7.1 4 4 0 0 0 6 15h14z" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-7" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-3 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-3 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 3 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .38.22.74.6 1a1.7 1.7 0 0 1 0 3c-.38.26-.6.62-.6 1z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}
