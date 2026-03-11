import { useEffect, useMemo, useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import { useTypingStore } from '../../stores/typingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { pinyinToFlypy } from '../../data/flypy';
import type { PracticeRecord, WrongCharRecord } from '../../stores/historyStore';
import { ConfirmDialog } from '../common/ConfirmDialog';

type ModeFilter = 'all' | 'char' | 'phrase' | 'article';

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { records, getTopWrongChars, clearHistory } = useHistoryStore();
  const { dailyGoalChars } = useSettingsStore();
  const { loadChars, setMode } = useTypingStore();
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'records' | 'wrong' | 'trend'>('records');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [modeFilter, setModeFilter] = useState<ModeFilter>('all');

  const filteredRecords = useMemo(() => {
    const filtered = modeFilter === 'all' ? records : records.filter((r) => r.mode === modeFilter);
    return filtered.slice(0, 50);
  }, [records, modeFilter]);

  const topWrongChars = useMemo(() => getTopWrongChars(30), [getTopWrongChars]);

  const stats = useMemo(() => {
    const last10 = records.slice(0, 10);
    const count = last10.length || 1;

    const today = new Date().toDateString();
    const todayRecords = records.filter((r) => new Date(r.date).toDateString() === today);
    const todayChars = todayRecords.reduce((sum, r) => sum + r.totalChars, 0);
    const goalProgress = Math.min(100, Math.round((todayChars / dailyGoalChars) * 100));
    const daySet = new Set(records.map((r) => new Date(r.date).toDateString()));
    let streak = 0;
    const cursor = new Date();
    while (daySet.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    const avgDuration = records.length > 0
      ? Math.round(records.slice(0, 10).reduce((sum, r) => sum + r.duration, 0) / count)
      : 0;

    return {
      total: records.length,
      avgSpeed: Math.round(last10.reduce((sum, r) => sum + r.speed, 0) / count),
      avgAccuracy: Math.round(last10.reduce((sum, r) => sum + r.accuracy, 0) / count),
      bestSpeed: records.length > 0 ? Math.max(...records.map((r) => r.speed)) : 0,
      todayCount: todayRecords.length,
      todayChars,
      goalProgress,
      streak,
      avgDuration,
    };
  }, [records, dailyGoalChars]);

  const formatDuration = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handlePracticeWrongChars = () => {
    if (topWrongChars.length === 0) return;
    const pinyinChars = topWrongChars.slice(0, 20).map((wc) => ({
      char: wc.char,
      pinyin: wc.pinyin,
      pinyinWithTone: wc.pinyin,
      flypyCode: pinyinToFlypy[wc.pinyin] || wc.pinyin,
      isChineseChar: true,
    }));
    setMode('char');
    loadChars(pinyinChars);
    onClose();
  };

  const wrongCharGroups = useMemo(() => {
    const high = topWrongChars.filter((wc) => wc.count >= 5);
    const mid = topWrongChars.filter((wc) => wc.count >= 2 && wc.count < 5);
    const low = topWrongChars.filter((wc) => wc.count === 1);
    return { high, mid, low };
  }, [topWrongChars]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showClearConfirm) {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onClose, showClearConfirm]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-2xl flex flex-col shadow-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
        role="dialog"
        aria-modal="true"
        aria-label="练习历史"
      >
        {/* Header */}
        <div className="px-8 sm:px-10 pt-6 pb-4 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>练习历史</h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>共 {stats.total} 次练习</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bg-secondary)] border border-[var(--border)]"
          >
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>✕</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="px-8 sm:px-10 pb-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatHeroItem label="今日练习" value={stats.todayCount} unit="次" color="var(--accent)" />
          <StatHeroItem label="今日字数" value={stats.todayChars} unit="字" color="var(--accent)" />
          <StatHeroItem label="连续打卡" value={stats.streak} unit="天" color="var(--warning)" />
          <StatHeroItem label="目标达成" value={`${stats.goalProgress}%`} unit="" color="var(--success)" />
          <StatHeroItem label="平均速度" value={stats.avgSpeed} unit="wpm" color="var(--text-primary)" />
          <StatHeroItem label="最高纪录" value={stats.bestSpeed} unit="wpm" color="var(--warning)" />
        </div>
        <div className="px-8 sm:px-10 pb-6">
          <div className="rounded-xl p-3 border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>每日目标 {dailyGoalChars} 字</span>
              <span>{stats.todayChars}/{dailyGoalChars}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${stats.goalProgress}%`, backgroundColor: 'var(--accent)' }}
              />
            </div>
            <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              最近10次：准确率 {stats.avgAccuracy}% · 平均用时 {formatDuration(stats.avgDuration)}
            </div>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="px-8 sm:px-10 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0 justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex p-1 rounded-lg w-full sm:w-auto overflow-x-auto" style={{ backgroundColor: 'var(--bg-secondary)' }} role="tablist">
            {([
              { key: 'records' as const, label: '最近记录' },
              { key: 'wrong' as const, label: '易错统计' },
              { key: 'trend' as const, label: '趋势分析' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                role="tab"
                aria-selected={tab === t.key}
                className={`px-4 sm:px-6 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-[var(--bg-card)] text-[var(--accent)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors hover:text-[var(--error)]"
            style={{ color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            清空数据
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 sm:px-10 pt-5 pb-8 custom-scrollbar" role="tabpanel">
          {!user ? (
            <EmptyState message="请先登录后再查看练习历史与易错统计" />
          ) : tab === 'records' ? (
            <>
              {/* Mode filter */}
              <div className="flex gap-2 mb-4">
                {([
                  { key: 'all' as ModeFilter, label: '全部' },
                  { key: 'char' as ModeFilter, label: '单字' },
                  { key: 'phrase' as ModeFilter, label: '词组' },
                  { key: 'article' as ModeFilter, label: '文章' },
                ]).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setModeFilter(f.key)}
                    className="px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    style={{
                      backgroundColor: modeFilter === f.key ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: modeFilter === f.key ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${modeFilter === f.key ? 'var(--accent)' : 'var(--border)'}`,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              {filteredRecords.length === 0 ? (
                <EmptyState message="暂无练习记录" />
              ) : (
                <div className="grid gap-3 pb-6">
                  {filteredRecords.map((r) => (
                    <RecordItem key={r.id} record={r} formatDate={formatDate} formatDuration={formatDuration} />
                  ))}
                </div>
              )}
            </>
          ) : tab === 'wrong' ? (
            topWrongChars.length === 0 ? (
              <EmptyState message="尚未发现易错字" />
            ) : (
              <div className="space-y-5">
                <div className="flex justify-center">
                  <button
                    onClick={handlePracticeWrongChars}
                    className="btn-primary px-6 py-2.5 text-xs rounded-lg"
                  >
                    针对性练习易错字 ({Math.min(topWrongChars.length, 20)}字)
                  </button>
                </div>

                {wrongCharGroups.high.length > 0 && (
                  <WrongCharGroup label="高频错字" subtitle="5次以上" chars={wrongCharGroups.high} color="var(--error)" />
                )}
                {wrongCharGroups.mid.length > 0 && (
                  <WrongCharGroup label="中频错字" subtitle="2-4次" chars={wrongCharGroups.mid} color="var(--warning)" />
                )}
                {wrongCharGroups.low.length > 0 && (
                  <WrongCharGroup label="偶尔错字" subtitle="1次" chars={wrongCharGroups.low} color="var(--text-muted)" />
                )}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-4 border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                <TrendChart records={records} formatDate={formatDate} />
              </div>
              <TrendSummary records={records} />
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title="清空历史记录"
        message="确定要清空所有历史记录和易错字统计吗？此操作不可撤销。"
        confirmText="确定清空"
        variant="danger"
        onConfirm={() => { clearHistory(); setShowClearConfirm(false); }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}

function StatHeroItem({ label, value, unit, color }: { label: string; value: number | string; unit: string; color: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col border shadow-sm transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>
      <span className="text-xs font-medium mb-1.5 leading-none" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold font-mono tracking-tighter" style={{ color }}>{value}</span>
        {unit && <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </div>
    </div>
  );
}

function RecordItem({ record, formatDate, formatDuration }: { record: PracticeRecord; formatDate: (d: string) => string; formatDuration: (s: number) => string }) {
  const isChar = record.mode === 'char';
  const isPhrase = record.mode === 'phrase';
  return (
    <div className="group rounded-xl p-4 border transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border transition-transform group-hover:scale-105 ${
            isChar
              ? 'text-[var(--accent)] border-[var(--accent)]/20'
              : isPhrase
                ? 'text-[var(--warning)] border-[var(--warning)]/20'
                : 'text-[var(--success)] border-[var(--success)]/20'
          }`}
            style={{ backgroundColor: isChar ? 'var(--accent-light)' : isPhrase ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)' }}
          >
            {isChar ? '单' : isPhrase ? '词' : '文'}
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {isChar ? '单字高频练习' : isPhrase ? '词组短句练习' : '文章模拟练习'}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>{formatDate(record.date)}</span>
              <span>·</span>
              <span>{record.totalChars} 字符</span>
              <span>·</span>
              <span>{formatDuration(record.duration)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xl font-bold font-mono tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              {record.speed} <span className="text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>wpm</span>
            </div>
            <div className={`text-xs font-semibold ${record.accuracy >= 95 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
              {record.accuracy}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WrongCharGroup({ label, subtitle, chars, color }: { label: string; subtitle: string; chars: WrongCharRecord[]; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold" style={{ color }}>{label}</span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({subtitle}, {chars.length}字)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
        {chars.map((wc, i) => (
          <WrongCharItem key={wc.char} charRecord={wc} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function WrongCharItem({ charRecord, rank }: { charRecord: WrongCharRecord; rank: number }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border transition-shadow hover:shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-mono w-6" style={{ color: 'var(--text-muted)' }}>#{rank.toString().padStart(2, '0')}</div>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>{charRecord.char}</div>
      <div className="flex-1 space-y-0.5">
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{charRecord.pinyin}</div>
        <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{charRecord.flypyCode}</div>
      </div>
      <div className="text-right space-y-0.5">
        <div className="text-xl font-bold font-mono leading-none" style={{ color: 'var(--error)' }}>{charRecord.count}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>次</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32" style={{ color: 'var(--text-muted)' }}>
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-current mb-6 flex items-center justify-center opacity-30">
        <span className="text-2xl">?</span>
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

function TrendSummary({ records }: { records: PracticeRecord[] }) {
  const summary = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek = records.filter((r) => new Date(r.date) >= sevenDaysAgo);
    const lastWeek = records.filter((r) => {
      const d = new Date(r.date);
      return d >= fourteenDaysAgo && d < sevenDaysAgo;
    });

    const thisWeekAvg = thisWeek.length > 0
      ? Math.round(thisWeek.reduce((s, r) => s + r.speed, 0) / thisWeek.length)
      : 0;
    const lastWeekAvg = lastWeek.length > 0
      ? Math.round(lastWeek.reduce((s, r) => s + r.speed, 0) / lastWeek.length)
      : 0;

    const diff = lastWeekAvg > 0 ? thisWeekAvg - lastWeekAvg : 0;

    return { thisWeekCount: thisWeek.length, thisWeekAvg, lastWeekAvg, diff };
  }, [records]);

  if (records.length < 2) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>近7天练习</div>
        <div className="text-xl font-bold font-mono" style={{ color: 'var(--accent)' }}>{summary.thisWeekCount}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>次</div>
      </div>
      <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>本周均速</div>
        <div className="text-xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{summary.thisWeekAvg}</div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>wpm</div>
      </div>
      <div className="rounded-xl p-4 border text-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>vs 上周</div>
        <div className="text-xl font-bold font-mono" style={{ color: summary.diff > 0 ? 'var(--success)' : summary.diff < 0 ? 'var(--error)' : 'var(--text-muted)' }}>
          {summary.diff > 0 ? '+' : ''}{summary.diff}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>wpm</div>
      </div>
    </div>
  );
}

/* ── TrendChart with tooltip ── */
function TrendChart({ records, formatDate }: { records: PracticeRecord[]; formatDate: (d: string) => string }) {
  const data = useMemo(() => records.slice(0, 30).reverse(), [records]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length < 2) {
    return <EmptyState message="需要至少2次记录以生成趋势" />;
  }

  const maxSpeed = Math.max(...data.map((r) => r.speed), 1);
  const chartW = 800;
  const chartH = 300;
  const padL = 60;
  const padR = 40;
  const padT = 40;
  const padB = 60;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const toX = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const toYSpeed = (v: number) => padT + innerH - (v / maxSpeed) * innerH;
  const toYAcc = (v: number) => padT + innerH - (v / 100) * innerH;

  const speedPoints = data.map((r, i) => `${toX(i)},${toYSpeed(r.speed)}`).join(' ');
  const accPoints = data.map((r, i) => `${toX(i)},${toYAcc(r.accuracy)}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padT + innerH * (1 - pct),
    speedLabel: Math.round(maxSpeed * pct),
  }));

  const hoverData = hoverIdx !== null ? data[hoverIdx] : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-center gap-10 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-3">
          <span className="w-4 h-1 rounded-full bg-[var(--accent)]" />
          <span>速度 (WPM)</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="w-4 h-1 rounded-full bg-[var(--success)] opacity-60" />
          <span>准确率 (%)</span>
        </span>
      </div>

      <div className="w-full overflow-x-auto custom-scrollbar pb-4 relative">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          className="w-full min-w-[600px]"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {gridLines.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={chartW - padR} y2={g.y} stroke="var(--border)" strokeWidth="1" strokeDasharray="6 6" opacity="0.4" />
              <text x={padL - 12} y={g.y + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--text-muted)">{g.speedLabel}</text>
            </g>
          ))}

          <path
            d={`M ${toX(0)} ${padT + innerH} L ${speedPoints} L ${toX(data.length - 1)} ${padT + innerH} Z`}
            fill="var(--accent)"
            opacity="0.03"
          />
          <polyline fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={speedPoints} />

          <polyline fill="none" stroke="var(--success)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={accPoints} opacity="0.4" />

          {hoverIdx !== null && (
            <line x1={toX(hoverIdx)} y1={padT} x2={toX(hoverIdx)} y2={padT + innerH} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
          )}

          {data.map((r, i) => {
            const cx = toX(i);
            const isHovered = hoverIdx === i;
            return (
              <g key={i}>
                <rect
                  x={cx - (innerW / data.length) / 2}
                  y={padT}
                  width={innerW / data.length}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  style={{ cursor: 'pointer' }}
                />
                <circle cx={cx} cy={toYSpeed(r.speed)} r={isHovered ? 7 : 5} fill="var(--accent)" opacity={isHovered ? 1 : 0.8} />
                <circle cx={cx} cy={toYAcc(r.accuracy)} r={isHovered ? 6 : 4} fill="var(--success)" opacity={isHovered ? 0.8 : 0.4} />
              </g>
            );
          })}

          {hoverData && hoverIdx !== null && (() => {
            const tx = toX(hoverIdx);
            const ty = toYSpeed(hoverData.speed);
            const tooltipW = 140;
            const tooltipH = 60;
            const tooltipX = tx + 10 + tooltipW > chartW - padR ? tx - tooltipW - 10 : tx + 10;
            const tooltipY = Math.max(padT, Math.min(ty - tooltipH / 2, padT + innerH - tooltipH));
            return (
              <g>
                <rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} rx="8" fill="var(--bg-card)" stroke="var(--border)" strokeWidth="1" />
                <text x={tooltipX + 10} y={tooltipY + 18} fontSize="11" fontWeight="700" fill="var(--text-primary)">
                  {hoverData.speed} wpm · {hoverData.accuracy}%
                </text>
                <text x={tooltipX + 10} y={tooltipY + 34} fontSize="10" fill="var(--text-muted)">
                  {formatDate(hoverData.date)}
                </text>
                <text x={tooltipX + 10} y={tooltipY + 50} fontSize="10" fill="var(--text-muted)">
                  {hoverData.mode === 'char' ? '单字' : hoverData.mode === 'phrase' ? '词组' : '文章'} · {hoverData.totalChars}字
                </text>
              </g>
            );
          })()}

          {data.map((_, i) => {
            const step = data.length > 20 ? 5 : data.length > 10 ? 2 : 1;
            if (i % step !== 0 && i !== data.length - 1) return null;
            return (
              <text key={`x${i}`} x={toX(i)} y={chartH - 20} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-muted)" opacity="0.4">#{i + 1}</text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
