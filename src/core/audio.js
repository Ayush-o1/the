// Sound, built from the Web Audio API. There are no audio files. It is off by default and it only
// starts after a click or key press, because browsers do not allow sound before that.
//   ambient: two slightly detuned oscillators through a low-pass filter that a slow wave sweeps
//   thrust:  filtered noise whose volume follows how fast the page is scrolling
//   tick:    a 20 ms click for buttons
const MASTER_GAIN = 0.15;

export function createAudio() {
  let context = null;
  let master = null;
  let thrustGain = null;
  let enabled = false;

  function build() {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const ambientGain = context.createGain();
    ambientGain.gain.value = 0.5;
    filter.connect(ambientGain).connect(master);
    for (const frequency of [55, 55.4]) {
      const oscillator = context.createOscillator();
      oscillator.type = 'sawtooth';
      oscillator.frequency.value = frequency;
      oscillator.connect(filter);
      oscillator.start();
    }
    // A very slow wave opens and closes the filter.
    const sweep = context.createOscillator();
    const sweepDepth = context.createGain();
    sweep.frequency.value = 0.05;
    sweepDepth.gain.value = 120;
    sweep.connect(sweepDepth).connect(filter.frequency);
    sweep.start();

    const noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = noise.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = noise;
    source.loop = true;
    const band = context.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 500;
    thrustGain = context.createGain();
    thrustGain.gain.value = 0;
    source.connect(band).connect(thrustGain).connect(master);
    source.start();
  }

  function beep(frequency, start, length, volume) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + length);
    oscillator.connect(gain).connect(master);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + length + 0.02);
  }

  return {
    get enabled() {
      return enabled;
    },
    async enable() {
      if (!context) build();
      await context.resume();
      master.gain.setTargetAtTime(MASTER_GAIN, context.currentTime, 0.1);
      enabled = true;
    },
    disable() {
      enabled = false;
      if (master) master.gain.setTargetAtTime(0, context.currentTime, 0.05);
    },
    // speed is 0 to 1.
    setThrust(speed) {
      if (enabled) thrustGain.gain.setTargetAtTime(speed * 0.35, context.currentTime, 0.1);
    },
    tick() {
      if (enabled) beep(1200, 0, 0.02, 0.2);
    },
  };
}
