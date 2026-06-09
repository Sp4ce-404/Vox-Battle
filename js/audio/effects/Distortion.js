// Distortion effect using WaveShaperNode
// Generates soft clipping and high-gain fuzz curves.

export default class Distortion {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    // Gain stage to drive the shaper
    this.driveGain = this.context.createGain();
    this.shaper = this.context.createWaveShaper();
    // Wet/dry mix gains
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    
    // Connect dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Connect wet (input -> drive -> shaper -> wetGain -> output)
    this.input.connect(this.driveGain);
    this.driveGain.connect(this.shaper);
    this.shaper.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Prevent clipping overdrive from blowing ears
    this.shaper.oversample = "4x";
    
    this.amount = 0; // 0 to 1
    this.setAmount(this.amount);
  }

  // Generates sigmoid-shaped soft distortion curve
  makeDistortionCurve(amount) {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      // Classic Sigmoid curve function: (3 + k) * x * 20 * deg / (Math.PI + k * |x|)
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  setAmount(val) {
    this.amount = parseFloat(val); // 0 to 1
    
    if (this.amount <= 0.01) {
      // Bypass
      this.dryGain.gain.setValueAtTime(1, this.context.currentTime);
      this.wetGain.gain.setValueAtTime(0, this.context.currentTime);
      this.shaper.curve = null;
      return;
    }
    
    // Crossfade wet/dry based on amount
    const dryVal = Math.max(0, 1 - this.amount * 0.8);
    const wetVal = this.amount;
    
    this.dryGain.gain.setTargetAtTime(dryVal, this.context.currentTime, 0.03);
    this.wetGain.gain.setTargetAtTime(wetVal, this.context.currentTime, 0.03);
    
    // Map amount (0-1) to curve intensity (k parameter 0-200)
    const k = this.amount * 150;
    this.shaper.curve = this.makeDistortionCurve(k);
    
    // Boost drive gain when distortion is high, but clamp output volume inside curves
    const driveVal = 1 + this.amount * 2;
    this.driveGain.gain.setTargetAtTime(driveVal, this.context.currentTime, 0.03);
  }

  getAmount() {
    return this.amount;
  }
}
