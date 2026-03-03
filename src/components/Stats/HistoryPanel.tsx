import { useState } from 'react';
import { useHistoryStore } from '../../stores/historyStore';

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const { records, getTopWrongChars, clearHistory } = useHistoryStore();
  const [tab, setTab] = useState<'records' | 'wrong'>('records');

  const recentRecords = records.slice(0, 20);
  const topWrongChars = getTopWrongChars(20);

  // 计算趋势数据
  const last10 = records.slice(0, 10).reverse();
  const avgSpeed = last10.length > 0
    ? Math.round(last10.reduce((sum, r) => sum + r.speed, 0) / last10.length)
    : 0;
  const avgAccuracy = last10.length > 0
    ? Math.round(last10.reduce((sum, r) => sum + r.accuracy, 0) / last10.length)
    : 0;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            练习历史
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
          >
            x
          </button>
        </div>

        {/* 概览 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>总练习次数</div>
            <div className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{records.length}</div>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>近10次平均速度</div>
            <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{avgSpeed} 字/分</div>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>近10次平均正确率</div>
            <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>{avgAccuracy}%</div>
          </div>
        </div>

        {/* 速度趋势（简单文字图表） */}
        {last10.length > 1 && (
          <div className="mb-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>速度趋势（近10次）</div>
            <div className="flex items-end gap-1 h-16">
              {last10.map((r, i) => {
                const maxSpeed = Math.max(...last10.map(x => x.speed), 1);
                const height = Math.max((r.speed / maxSpeed) * 100, 5);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{r.speed}</span>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height: `${height}%`,
                        backgroundColor: 'var(--accent)',
                        minHeight: '4px',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 切换 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setTab('records')}
            className="px-3 py-1 text-sm rounded-md cursor-pointer"
            style={{
              backgroundColor: tab === 'records' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === 'records' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            练习记录
          </button>
          <button
            onClick={() => setTab('wrong')}
            className="px-3 py-1 text-sm rounded-md cursor-pointer"
            style={{
              backgroundColor: tab === 'wrong' ? 'var(--accent)' : 'var(--bg-secondary)',
              color: tab === 'wrong' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            易错字
          </button>
          <div className="flex-1" />
          <button
            onClick={() => { if (confirm('确定清空所有历史记录？')) clearHistory(); }}
            className="px-3 py-1 text-xs rounded-md cursor-pointer"
            style={{ color: 'var(--error)' }}
          >
            清空
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'records' ? (
            recentRecords.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无练习记录
              </p>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between p-3 rounded-lg text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(r.date).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                      </span>
                      <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                        {r.mode === 'char' ? '单字' : '文章'}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>{r.speed} 字/分</span>
                      <span style={{ color: r.accuracy >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                        {r.accuracy}%
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {r.totalChars}字
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            topWrongChars.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                暂无易错字记录
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {topWrongChars.map((wc) => (
                  <div
                    key={wc.char}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold" style={{ color: 'var(--error)' }}>{wc.char}</span>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <div>{wc.pinyin}</div>
                        <div>{wc.flypyCode}</div>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: 'var(--error)' }}>
                      x{wc.count}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
