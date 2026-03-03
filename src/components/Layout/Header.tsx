import { useTypingStore } from '../../stores/typingStore';
import type { PracticeMode } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';

export function Header() {
  const { mode, setMode, loadRandomChars, loadArticle } = useTypingStore();
  const { darkMode, toggleDarkMode, showKeyboard, toggleKeyboard, showPinyin, togglePinyin } = useSettingsStore();

  const handleModeChange = (newMode: PracticeMode) => {
    setMode(newMode);
    if (newMode === 'char') {
      loadRandomChars();
    } else {
      // 文章模式会在组件内自动加载
      loadArticle('');
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-3"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
          ⌨
        </span>
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          小鹤双拼练习
        </span>
      </div>

      {/* 模式切换 */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <ModeButton
          label="单字练习"
          active={mode === 'char'}
          onClick={() => handleModeChange('char')}
        />
        <ModeButton
          label="文章练习"
          active={mode === 'article'}
          onClick={() => handleModeChange('article')}
        />
      </div>

      {/* 设置按钮 */}
      <div className="flex items-center gap-2">
        <ToggleButton
          label={showPinyin ? '拼' : '拼'}
          active={showPinyin}
          onClick={togglePinyin}
          title={showPinyin ? '隐藏拼音提示' : '显示拼音提示'}
        />
        <ToggleButton
          label="⌨"
          active={showKeyboard}
          onClick={toggleKeyboard}
          title={showKeyboard ? '隐藏键位图' : '显示键位图'}
        />
        <button
          onClick={toggleDarkMode}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
          title={darkMode ? '切换日间模式' : '切换夜间模式'}
        >
          {darkMode ? '☀' : '🌙'}
        </button>
      </div>
    </header>
  );
}

function ModeButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
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

function ToggleButton({ label, active, onClick, title }: { label: string; active: boolean; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors cursor-pointer"
      style={{
        backgroundColor: active ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
      }}
      title={title}
    >
      {label}
    </button>
  );
}
