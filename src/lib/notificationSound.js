// Synthesized notification chime — three ascending "tunu-tunu-tunu" tones via the
// Web Audio API. No external mp3 asset to host/bundle, and it works the same in the
// browser and inside the Capacitor Android WebView.
let audioCtx;

const getContext = () => {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const tone = (ctx, freq, startTime, duration, volume) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const playNotificationChime = () => {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    tone(ctx, 880, now, 0.12, 0.3); // tunu
    tone(ctx, 1046.5, now + 0.15, 0.12, 0.3); // tunu
    tone(ctx, 1318.5, now + 0.3, 0.18, 0.3); // tunu
  } catch {
    // Web Audio blocked/unsupported — the toast still gets shown, just no sound
  }
};
