// Multi-band equalizer using BiquadFilterNode
// Chains low-shelf and high-shelf filters in series for tone shaping.

export default class Equalizer {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    // Low-shelf filter for Bass (frequencies <= 150Hz)
    this.bassFilter = this.context.createBiquadFilter();
    this.bassFilter.type = "lowshelf";
    this.bassFilter.frequency.setValueAtTime(150, this.context.currentTime);
    
    // High-shelf filter for Treble (frequencies >= 5000Hz)
    this.trebleFilter = this.context.createBiquadFilter();
    this.trebleFilter.type = "highshelf";
    this.trebleFilter.frequency.setValueAtTime(5000, this.context.currentTime);
    
    // Connect in series
    this.input.connect(this.bassFilter);
    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.output);
    
    // Default gains in dB
    this.bassGain = 0;
    this.trebleGain = 0;
    
    this.setBassGain(this.bassGain);
    this.setTrebleGain(this.trebleGain);
  }

  setBassGain(db) {
    this.bassGain = parseFloat(db); // -10 to +15 dB
    this.bassFilter.gain.setTargetAtTime(this.bassGain, this.context.currentTime, 0.05);
  }

  setTrebleGain(db) {
    this.trebleGain = parseFloat(db); // -10 to +15 dB
    this.trebleFilter.gain.setTargetAtTime(this.trebleGain, this.context.currentTime, 0.05);
  }

  getBassGain() {
    return this.bassGain;
  }

  getTrebleGain() {
    return this.trebleGain;
  }
}
