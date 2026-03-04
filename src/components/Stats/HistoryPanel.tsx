import { useState, useMemo } from 'react';
import { useHistoryStore } from '../../stores/historyStore';
import type { PracticeRecord } from '../../stores/historyStore';
import type { WrongCharRecord } from '../../stores/historyStore';

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { records, getTopWrongChars, clearHistory } = useHistoryStore();
  const [tab, setTab] = useState<'records' | 'wrong'>('records');

  const recentRecords = useMemo(() => records.slice(0, 50), [records]);
  const topWrongChars = useMemo(() => getTopWrongChars(20), [getTopWrongChars]);

  // Calculate statistics for the last 10 sessions
  const stats = useMemo(() => {
    const last10 = records.slice(0, 10);
    const count = last10.length || 1;
    return {
      total: records.length,
      avgSpeed: Math.round(last10.reduce((sum, r) => sum + r.speed, 0) / count),
      avgAccuracy: Math.round(last10.reduce((sum, r) => sum + r.accuracy, 0) / count),
      bestSpeed: records.length > 0 ? Math.max(...records.map((r) => r.speed)) : 0,
    };
  }, [records]);

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
    return date.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(2, 6, 23, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-300"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header Section - Fixed */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              练习历史
            </h2>
            <div className="flex items-center gap-3 mt-2 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: 'var(--text-muted)' }}>
              <span>Total Sessions: {stats.total}</span>
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>Version 2.2</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--bg-secondary)] active:scale-90 border border-[var(--border)]"
          >
            <span className="text-xl opacity-50" style={{ color: 'var(--text-primary)' }}>✕</span>
          </button>
        </div>

        {/* Stats Grid - Fixed */}
        <div className="px-8 pb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatHeroItem label="总练习" value={stats.total} unit="次" color="var(--accent)" />
          <StatHeroItem label="平均速度" value={stats.avgSpeed} unit="wpm" color="var(--text-primary)" />
          <StatHeroItem label="最高速度" value={stats.bestSpeed} unit="wpm" color="var(--warning)" />
          <StatHeroItem label="平均准确率" value={stats.avgAccuracy} unit="%" color="var(--success)" />
        </div>

        {/* Tabs & Actions Bar - Fixed */}
        <div className="px-8 pb-6 flex items-center justify-between border-b border-[var(--border)]/50">
          <div className="flex p-1 rounded-xl bg-[var(--bg-secondary)]/50 border border-[var(--border)]/50">
            {[
              { key: 'records' as const, label: '最近记录' },
              { key: 'wrong' as const, label: '易错统计' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-6 py-2 text-xs font-black rounded-lg transition-all ${
                  tab === t.key 
                    ? 'bg-[var(--bg-card)] text-[var(--accent)] shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (confirm('确定要清空所有历史记录吗？')) clearHistory();
            }}
            className="text-[10px] font-black tracking-widest uppercase opacity-30 hover:opacity-100 hover:text-[var(--error)] transition-all"
          >
            Clear Data
          </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-8 pt-6 pb-8 custom-scrollbar bg-[var(--bg-secondary)]/10">
          {tab === 'records' ? (
            recentRecords.length === 0 ? (
              <EmptyState message="No records found" />
            ) : (
              <div className="grid gap-4 pb-8">
                {recentRecords.map((r) => (
                  <RecordItem key={r.id} record={r} formatDate={formatDate} formatDuration={formatDuration} />
                ))}
              </div>
            )
          ) : topWrongChars.length === 0 ? (
            <EmptyState message="No wrong characters yet" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
              {topWrongChars.map((wc, i) => (
                <WrongCharItem key={wc.char} charRecord={wc} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatHeroItem({ label, value, unit, color }: { label: string; value: number | string; unit: string; color: string }) {
  return (
    <div className="rounded-2xl p-4 flex flex-col bg-[var(--bg-secondary)]/30 border border-[var(--border)]/40 hover:border-[var(--accent)]/30 transition-colors group">
      <span className="text-[9px] font-black uppercase tracking-tighter opacity-30 mb-1 group-hover:opacity-50 transition-opacity">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black font-mono tracking-tighter" style={{ color }}>
          {value}
        </span>
        <span className="text-[10px] font-bold opacity-10">{unit}</span>
      </div>
    </div>
  );
}

function RecordItem({ 
  record, 
  formatDate, 
  formatDuration 
}: { 
  record: PracticeRecord; 
  formatDate: (d: string) => string;
  formatDuration: (s: number) => string;
}) {
  return (
    <div className="group rounded-2xl p-5 border border-[var(--border)]/40 bg-[var(--bg-card)] hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border ${
            record.mode === 'char' 
              ? 'bg-[var(--accent-light)] text-[var(--accent)] border-[var(--accent)]/20' 
              : 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
          }`}>
            {record.mode === 'char' ? '单' : '文'}
          </div>
          <div>
            <div className="text-sm font-black opacity-80">{record.mode === 'char' ? '单字模式' : '文章练习'}</div>
            <div className="text-[10px] font-bold opacity-20">{formatDate(record.date)}</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-lg font-black font-mono" style={{ color: 'var(--text-primary)' }}>{record.speed} <span className="text-[10px] opacity-30">WPM</span></span>
          <span className={`text-[10px] font-bold ${record.accuracy >= 95 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>{record.accuracy}% ACC</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]/30">
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black tracking-widest opacity-20 uppercase">Words</span>
          <span className="text-xs font-bold opacity-60">{record.totalChars} chars</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[8px] font-black tracking-widest opacity-20 uppercase">Duration</span>
          <span className="text-xs font-bold opacity-60">{formatDuration(record.duration)}</span>
        </div>
      </div>
    </div>
  );
}

function WrongCharItem({ charRecord, rank }: { charRecord: WrongCharRecord; rank: number }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-[var(--border)]/30 bg-[var(--bg-card)] hover:shadow-sm transition-all">
      <div className="text-[10px] font-black opacity-10 font-mono w-6">{rank.toString().padStart(2, '0')}</div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black bg-[var(--bg-secondary)] border border-[var(--border)]/30">
        {charRecord.char}
      </div>
      <div className="flex-1">
        <div className="text-[9px] font-black tracking-widest opacity-30">{charRecord.pinyin.toUpperCase()}</div>
        <div className="text-xs font-black" style={{ color: 'var(--accent)' }}>{charRecord.flypyCode}</div>
      </div>
      <div className="text-right">
        <div className="text-lg font-black font-mono leading-none" style={{ color: 'var(--error)' }}>{charRecord.count}</div>
        <div className="text-[8px] font-black opacity-20">FAIL</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-10">
      <p className="text-[10px] font-black tracking-[0.4em] uppercase">{message}</p>
    </div>
  );
}

