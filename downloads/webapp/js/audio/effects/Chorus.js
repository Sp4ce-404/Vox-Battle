// Chorus / Flanger effect using modulated DelayNode
// Creates space and doubling effects via LFO delay modulation.

export default class Chorus {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    // Dry/Wet
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    
    // Modulated delay line
    this.delayNode = this.context.createDelay(0.1);
    this.lfo = this.context.createOscillator();
    this.lfoGain = this.context.createGain();
    
    // Connections
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Connect LFO modulator to delayNode delayTime AudioParam
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);
    
    // Configure LFO
    this.lfo.type = "sine";
    
    // Default values
    this.mix = 0; // 0 to 1
    this.rate = 1.5; // LFO speed in Hz (0.1 to 10)
    this.depth = 0.003; // Modulation depth in seconds (0.001 to 0.02)
    this.baseDelay = 0.015; // Base delay in seconds
    
    // Set initial values
    this.delayNode.delayTime.setValueAtTime(this.baseDelay, this.context.currentTime);
    this.lfo.frequency.setValueAtTime(this.rate, this.context.currentTime);
    this.lfoGain.gain.setValueAtTime(this.depth, this.context.currentTime);
    
    this.setMix(this.mix);
    
    // Start modulator
    this.lfo.start();
  }

  setMix(val) {
    this.mix = parseFloat(val);
    
    const dryVal = 1 - this.mix * 0.3; // retain core signal
    const wetVal = this.mix * 0.7;
    
    this.dryGain.gain.setTargetAtTime(dryVal, this.context.currentTime, 0.03);
    this.wetGain.gain.setTargetAtTime(wetVal, this.context.currentTime, 0.03);
  }

  setRate(val) {
    this.rate = Math.max(0.1, Math.min(10.0, parseFloat(val)));
    this.lfo.frequency.setTargetAtTime(this.rate, this.context.currentTime, 0.05);
  }

  setDepth(val) {
    this.depth = Math.max(0.0005, Math.min(0.02, parseFloat(val)));
    this.lfoGain.gain.setTargetAtTime(this.depth, this.context.currentTime, 0.05);
  }

  getMix() {
    return this.mix;
  }

  getRate() {
    return this.rate;
  }

  getDepth() {
    return this.depth;
  }
}
