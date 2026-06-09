// Procedural Reverb effect using ConvolverNode
// Generates impulse response buffers synthetically for low resource usage.

export default class Reverb {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    this.convolver = this.context.createConvolver();
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    
    // Connect dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Connect wet path
    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Default parameters
    this.mix = 0; // 0 to 1
    this.decay = 1.5; // seconds
    
    this.regenerateImpulseResponse();
    this.setMix(this.mix);
  }

  // Generate synthetic impulse response (decaying noise)
  regenerateImpulseResponse() {
    const rate = this.context.sampleRate;
    const length = rate * this.decay;
    const impulse = this.context.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
      // Exponential decay: e^(-t * decayFactor)
      const percent = i / length;
      const decayFactor = Math.exp(-percent * 8); // Decay depth
      
      // Random white noise between -1 and 1
      left[i] = (Math.random() * 2 - 1) * decayFactor;
      right[i] = (Math.random() * 2 - 1) * decayFactor;
    }
    
    this.convolver.buffer = impulse;
  }

  setMix(val) {
    this.mix = parseFloat(val); // 0 to 1
    
    // Constant-power crossfade between wet and dry
    // dry = cos(mix * PI / 2), wet = sin(mix * PI / 2)
    const dryVal = Math.cos(this.mix * Math.PI / 2);
    const wetVal = Math.sin(this.mix * Math.PI / 2);
    
    this.dryGain.gain.setTargetAtTime(dryVal, this.context.currentTime, 0.03);
    this.wetGain.gain.setTargetAtTime(wetVal, this.context.currentTime, 0.03);
  }

  setDecay(val) {
    const newVal = Math.max(0.1, parseFloat(val));
    if (Math.abs(this.decay - newVal) > 0.05) {
      this.decay = newVal;
      this.regenerateImpulseResponse();
    }
  }

  getMix() {
    return this.mix;
  }

  getDecay() {
    return this.decay;
  }
}
