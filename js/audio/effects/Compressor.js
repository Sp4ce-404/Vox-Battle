// Dynamic range compressor using DynamicsCompressorNode
// Normalizes and glues audio spikes to create clear gaming communication.

export default class Compressor {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    this.compressor = this.context.createDynamicsCompressor();
    
    // Set standard vocal compressor settings
    this.compressor.threshold.setValueAtTime(-24, this.context.currentTime);
    this.compressor.knee.setValueAtTime(30, this.context.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.context.currentTime);
    this.compressor.attack.setValueAtTime(0.01, this.context.currentTime); // 10ms
    this.compressor.release.setValueAtTime(0.15, this.context.currentTime); // 150ms
    
    this.input.connect(this.compressor);
    this.compressor.connect(this.output);
  }

  // Allow custom threshold adjustments if needed
  setThreshold(db) {
    this.compressor.threshold.setTargetAtTime(parseFloat(db), this.context.currentTime, 0.05);
  }
}
