import { useEffect, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';

export function StatsBar() {
  const { isStarted, isFinished, isPaused, correctCount, wrongCount, combo, maxCombo, getSpeed, getAccuracy, getElapsedTime, getRemainingTime, checkTimer, togglePause } = useTypingStore();
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!isStarted || isFinished || isPaused) return;
    const timer = setInterval(() => {
      checkTimer();
      forceUpdate((n) => n + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished, isPaused, checkTimer]);

  const speed = getSpeed();
  const accuracy = getAccuracy();
  const elapsed = getElapsedTime();
  const remaining = getRemainingTime();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="flex items-center justify-center gap-6 py-3 px-6 rounded-xl text-sm"
      style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
    >
      <StatItem label="速度" value={`${speed}`} unit="字/分" />
      <Divider />
      <StatItem label="正确率" value={`${accuracy}`} unit="%" />
      <Divider />
      <StatItem label="连击" value={`${combo}`} highlight={combo >= 10} />
      <Divider />
      {remaining !== null ? (
        <StatItem
          label="剩余"
          value={formatTime(remaining)}
          color={remaining <= 10 ? 'var(--error)' : 'var(--warning)'}
        />
      ) : (
        <StatItem label="用时" value={formatTime(elapsed)} />
      )}
      <Divider />
      <StatItem label="正确" value={`${correctCount}`} color="var(--success)" />
      <StatItem label="错误" value={`${wrongCount}`} color="var(--error)" />
      {isFinished && (
        <>
          <Divider />
          <StatItem label="最大连击" value={`${maxCombo}`} color="var(--warning)" />
        </>
      )}
      {isStarted && !isFinished && (
        <>
          <Divider />
          <button
            onClick={togglePause}
            className="px-3 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all"
            style={{
              backgroundColor: isPaused ? 'var(--accent)' : 'var(--bg-primary)',
              color: isPaused ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${isPaused ? 'var(--accent)' : 'var(--border)'}`,
            }}
            aria-label={isPaused ? '继续练习' : '暂停练习'}
          >
            {isPaused ? '继续' : '暂停'}
          </button>
        </>
      )}
    </div>
  );
}

function StatItem({ label, value, unit, color, highlight }: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className="font-bold text-base"
        style={{
          color: color || 'var(--text-primary)',
          ...(highlight ? { color: 'var(--warning)', transform: 'scale(1.1)', display: 'inline-block' } : {}),
        }}
      >
        {value}
      </span>
      {unit && <span style={{ color: 'var(--text-muted)' }}>{unit}</span>}
    </div>
  );
}

function Divider() {
  return <span style={{ color: 'var(--border)' }} aria-hidden="true">|</span>;
}
