import { useSettingsStore } from '../../stores/settingsStore';
import type { CharCount, PracticeType } from '../../stores/settingsStore';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    darkMode, toggleDarkMode,
    showKeyboard, toggleKeyboard,
    showPinyin, togglePinyin,
    highlightKeys, toggleHighlightKeys,
    soundEnabled, toggleSound,
    fontSize, setFontSize,
    charCount, setCharCount,
    practiceType, setPracticeType,
  } = useSettingsStore();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.75)', backdropFilter: 'blur(20px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-[3rem] flex flex-col shadow-[0_64px_128px_-12px_rgba(0,0,0,0.7)] animate-in zoom-in-95 slide-in-from-bottom-12 duration-500"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {/* Header - 极致间距：px-24 确保完全避开圆角遮挡 */}
        <div className="px-8 sm:px-10 pt-6 pb-4 flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-black leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>设置</h2>
            <div className="flex items-center gap-3">
              <span className="h-2 w-8 rounded-full bg-[var(--accent)]" />
              <p className="text-[9px] font-black uppercase tracking-[0.28em] opacity-40">Settings & Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-[0.9rem] flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)] active:scale-90 border border-[var(--border)] group"
          >
            <span className="text-base opacity-35 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--text-primary)' }}>✕</span>
          </button>
        </div>

        {/* Content Area - 同步 px-24 间距 */}
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
            </div>
          </SettingsSection>

          {/* 声音与反馈 */}
          <SettingsSection title="反馈体验">
            <ToggleRow label="机械键盘音效" desc="开启后模拟真实打字反馈声" active={soundEnabled} onToggle={toggleSound} />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      {/* 标题增加内缩进 px-4 */}
      <h3 className="text-[11px] font-black uppercase tracking-[0.32em] opacity-30 px-2">{title}</h3>
      {/* 增加区块内补白 p-8，确保内部内容离边框有足够的距离 */}
      <div className="bg-[var(--bg-secondary)]/40 rounded-[1.5rem] p-3 sm:p-4 border border-[var(--border)]/60 shadow-inner">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-center justify-between py-2 px-3 rounded-[1rem] hover:bg-[var(--bg-card)] hover:shadow-lg transition-all cursor-pointer group"
      onClick={onToggle}
    >
      <div className="space-y-1">
        <div className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-[12px] opacity-40 font-medium">{desc}</div>
      </div>
      <div
        className="w-12 h-7 rounded-full relative transition-all duration-500 shadow-inner"
        style={{ backgroundColor: active ? 'var(--accent)' : 'var(--border)' }}
      >
        <div
          className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-xl transition-all duration-500"
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
    <div className="flex items-center justify-between py-2 px-3 rounded-[1rem] hover:bg-[var(--bg-card)] hover:shadow-lg transition-all group">
      <div className="space-y-1">
        <div className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{label}</div>
        <div className="text-[12px] opacity-40 font-medium">当前设定值: {value}{unit}</div>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 h-2 bg-[var(--border)] rounded-full appearance-none cursor-pointer accent-[var(--accent)]"
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
      <span className="text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="flex-1 min-w-[84px] px-4 py-2 text-[12px] font-black rounded-[1rem] transition-all cursor-pointer border-2 shadow-sm"
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


