import { useEffect, useState } from 'react';
import { useTypingStore } from '../../stores/typingStore';

export function StatsBar() {
  const { isStarted, isFinished, correctCount, wrongCount, combo, maxCombo, getSpeed, getAccuracy, getElapsedTime } = useTypingStore();
  const [, forceUpdate] = useState(0);

  // 实时更新速度和时间
  useEffect(() => {
    if (!isStarted || isFinished) return;
    const timer = setInterval(() => forceUpdate((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [isStarted, isFinished]);

  const speed = getSpeed();
  const accuracy = getAccuracy();
  const elapsed = getElapsedTime();

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
      <StatItem label="用时" value={formatTime(elapsed)} />
      <Divider />
      <StatItem label="正确" value={`${correctCount}`} color="var(--success)" />
      <StatItem label="错误" value={`${wrongCount}`} color="var(--error)" />
      {isFinished && (
        <>
          <Divider />
          <StatItem label="最大连击" value={`${maxCombo}`} color="var(--warning)" />
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
  return <span style={{ color: 'var(--border)' }}>|</span>;
}
