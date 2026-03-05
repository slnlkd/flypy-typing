// 使用 Web Audio API 生成音效，无需加载外部文件

let audioCtx: AudioContext | null = null;
let masterVolume = 0.5;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function setMasterVolume(v: number) {
  masterVolume = Math.max(0, Math.min(1, v));
}

function playTone(frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    const effectiveVolume = volume * masterVolume;
    gain.gain.setValueAtTime(effectiveVolume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // 静默失败 - 浏览器可能不支持 Web Audio API
  }
}

// 按键音 - 轻微机械键盘声
export function playKeySound() {
  playTone(800, 0.04, 0.06, 'square');
}

// 正确音
export function playCorrectSound() {
  playTone(880, 0.08, 0.08, 'sine');
}

// 错误音
export function playErrorSound() {
  playTone(220, 0.15, 0.1, 'sawtooth');
}

// 连击音效 - combo 越高音调越高
export function playComboSound(combo: number) {
  const baseFreq = 600;
  const freq = Math.min(baseFreq + combo * 40, 1800);
  playTone(freq, 0.06, 0.07, 'triangle');
}

// 完成音效
export function playFinishSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    const effectiveVolume = 0.1 * masterVolume;
    gain.gain.setValueAtTime(effectiveVolume, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.3);
  });
}
