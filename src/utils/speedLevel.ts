export interface SpeedLevel {
  level: string;
  color: string;
  minSpeed: number;
}

const levels: SpeedLevel[] = [
  { level: '大师', color: '#e11d48', minSpeed: 120 },
  { level: '高级', color: '#f59e0b', minSpeed: 80 },
  { level: '中级', color: '#3b82f6', minSpeed: 50 },
  { level: '初级', color: '#22c55e', minSpeed: 25 },
  { level: '入门', color: '#94a3b8', minSpeed: 0 },
];

export function getSpeedLevel(speed: number): SpeedLevel {
  return levels.find((l) => speed >= l.minSpeed) || levels[levels.length - 1];
}
