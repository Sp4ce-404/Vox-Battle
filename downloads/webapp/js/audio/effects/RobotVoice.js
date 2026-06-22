// Robot voice effect using Ring Modulation
// Multiplies the input voice with a carrier sine/saw wave to create metallic tones.

export default class RobotVoice {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    // Mix nodes
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    
    // Ring modulator carrier oscillator
    this.carrier = this.context.createOscillator();
    this.carrierGain = this.context.createGain();
    
    // Multiplication node (the volume of this gain node is modulated by carrier)
    this.modulatorGain = this.context.createGain();
    
    // Connect dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Connect wet
    this.input.connect(this.modulatorGain);
    this.modulatorGain.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Connect carrier oscillator to modulatorGain's gain AudioParam
    // We set gain base to 0, then let the carrier modulate it between -1 and +1
    this.modulatorGain.gain.setValueAtTime(0, this.context.currentTime);
    this.carrier.connect(this.carrierGain);
    this.carrierGain.connect(this.modulatorGain.gain);
    
    // Configure carrier
    this.carrier.type = "sawtooth"; // Sawtooth gives a buzzy, robotic voice. Sine is cleaner.
    this.carrierGain.gain.setValueAtTime(1.0, this.context.currentTime); // full modulation depth
    
    // Default values
    this.mix = 0; // 0 to 1
    this.frequency = 60; // Carrier freq in Hz (0 to 150)
    
    this.carrier.frequency.setValueAtTime(this.frequency, this.context.currentTime);
    this.setMix(this.mix);
    
    // Start carrier oscillator
    this.carrier.start();
  }

  setMix(val) {
    this.mix = parseFloat(val);
    
    const dryVal = Math.cos(this.mix * Math.PI / 2);
    const wetVal = Math.sin(this.mix * Math.PI / 2);
    
    this.dryGain.gain.setTargetAtTime(dryVal, this.context.currentTime, 0.03);
    this.wetGain.gain.setTargetAtTime(wetVal, this.context.currentTime, 0.03);
  }

  setFrequency(val) {
    this.frequency = Math.max(0, Math.min(150.0, parseFloat(val)));
    this.carrier.frequency.setTargetAtTime(this.frequency, this.context.currentTime, 0.05);
  }

  getMix() {
    return this.mix;
  }

  getFrequency() {
    return this.frequency;
  }
}
