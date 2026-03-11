import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { CharCount, PhraseCount, PracticeType, TimerMode, DailyGoalChars } from '../../stores/settingsStore';
import { setMasterVolume, playKeySound } from '../../utils/sound';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    darkMode, toggleDarkMode,
    showKeyboard, toggleKeyboard,
    showPinyin, togglePinyin,
    highlightKeys, toggleHighlightKeys,
    soundEnabled, toggleSound,
    soundVolume, setSoundVolume,
    fontSize, setFontSize,
    charCount, setCharCount,
    phraseCount, setPhraseCount,
    practiceType, setPracticeType,
    timerMode, setTimerMode,
    dailyGoalChars, setDailyGoalChars,
  } = useSettingsStore();

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col shadow-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-label="设置"
      >
        {/* Header */}
        <div className="px-8 sm:px-10 pt-6 pb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>设置</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>偏好设定</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] border border-[var(--border)]"
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>✕</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-10 pb-8 custom-scrollbar space-y-5">
          {/* 显示与交互 */}
          <SettingsSection title="显示与交互">
            <div className="grid gap-1">
              <ToggleRow label="深色模式" desc="在深色和浅色主题之间切换" active={darkMode} onToggle={toggleDarkMode} />
              <ToggleRow label="键位图参考" desc="显示小鹤双拼键位提示图" active={showKeyboard} onToggle={toggleKeyboard} />
              <ToggleRow label="拼音与编码" desc="在练习区显示拼音提示" active={showPinyin} onToggle={togglePinyin} />
              <ToggleRow label="动态键位高亮" desc="打字时高亮显示目标按键" active={highlightKeys} onToggle={toggleHighlightKeys} />
              <SliderRow label="练习文字大小" value={fontSize} min={16} max={36} step={2} onChange={setFontSize} unit="px" />
            </div>
          </SettingsSection>

          {/* 练习偏好 */}
          <SettingsSection title="练习偏好设定">
            <div className="grid gap-4 py-1">
              <SelectRow<CharCount>
                label="单次练习字符数量"
                value={charCount}
                options={[
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                  { value: 200, label: '200' },
                ]}
                onChange={setCharCount}
              />
              <SelectRow<PhraseCount>
                label="词组/短句数量"
                value={phraseCount}
                options={[
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                  { value: 30, label: '30' },
                ]}
                onChange={setPhraseCount}
              />
              <SelectRow<PracticeType>
                label="题目生成逻辑"
                value={practiceType}
                options={[
                  { value: 'random', label: '随机' },
                  { value: 'sequential', label: '顺序' },
                  { value: 'hard', label: '困难' },
                  { value: 'initial', label: '声母' },
                  { value: 'final', label: '韵母' },
                ]}
                onChange={setPracticeType}
              />
              <SelectRow<TimerMode>
                label="限时模式"
                value={timerMode}
                options={[
                  { value: 'none', label: '不限时' },
                  { value: 60, label: '60秒' },
                  { value: 180, label: '3分钟' },
                  { value: 300, label: '5分钟' },
                ]}
                onChange={setTimerMode}
              />
              <SelectRow<DailyGoalChars>
                label="每日目标字数"
                value={dailyGoalChars}
                options={[
                  { value: 500, label: '500字' },
                  { value: 1000, label: '1000字' },
                  { value: 2000, label: '2000字' },
                  { value: 5000, label: '5000字' },
                ]}
                onChange={setDailyGoalChars}
              />
            </div>
          </SettingsSection>

          {/* 声音与反馈 */}
          <SettingsSection title="反馈体验">
            <div className="grid gap-1">
              <ToggleRow label="机械键盘音效" desc="开启后模拟真实打字反馈声" active={soundEnabled} onToggle={toggleSound} />
              {soundEnabled && (
                <SliderRow
                  label="音效音量"
                  value={soundVolume}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => {
                    setSoundVolume(v);
                    setMasterVolume(v / 100);
                    playKeySound();
                  }}
                  unit="%"
                />
              )}
            </div>
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold px-2" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      <div className="rounded-xl p-3 sm:p-4 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-card)] transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="space-y-1">
        <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
      </div>
      <div
        className="w-12 h-7 rounded-full relative transition-all duration-300 shadow-inner"
        style={{ backgroundColor: active ? 'var(--accent)' : 'var(--border)' }}
        role="switch"
        aria-checked={active}
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        <div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
          style={{ transform: active ? 'translateX(22px)' : 'translateX(2px)' }}
        />
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-card)] transition-colors">
      <div className="space-y-1">
        <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>当前设定值: {value}{unit}</div>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 h-2 rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
          style={{ backgroundColor: 'var(--border)' }}
        />
      </div>
    </div>
  );
}

function SelectRow<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-2 py-1 px-3">
      <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="flex-1 min-w-[84px] px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer border"
            style={{
              backgroundColor: value === opt.value ? 'var(--accent)' : 'var(--bg-card)',
              color: value === opt.value ? '#fff' : 'var(--text-secondary)',
              borderColor: value === opt.value ? 'var(--accent)' : 'var(--border)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
