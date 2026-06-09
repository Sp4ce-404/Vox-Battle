// Echo/Delay effect using DelayNode
// Creates adjustable audio feedback loop.

export default class Delay {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    
    // Core nodes
    this.delayNode = this.context.createDelay(2.0); // max delay 2 seconds
    this.feedbackGain = this.context.createGain();
    
    // Mix nodes
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    
    // Connect dry path
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.output);
    
    // Connect wet path with feedback loop
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode); // feedback loop
    
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.output);
    
    // Default values
    this.mix = 0; // 0 to 1
    this.feedback = 0.4; // 0 to 0.95
    this.delayTime = 0.3; // seconds
    
    this.setDelayTime(this.delayTime);
    this.setFeedback(this.feedback);
    this.setMix(this.mix);
  }

  setMix(val) {
    this.mix = parseFloat(val);
    
    const dryVal = 1 - this.mix * 0.5; // keep dry presence
    const wetVal = this.mix * 0.8; // scale down wet to prevent clipping
    
    this.dryGain.gain.setTargetAtTime(dryVal, this.context.currentTime, 0.03);
    this.wetGain.gain.setTargetAtTime(wetVal, this.context.currentTime, 0.03);
  }

  setFeedback(val) {
    this.feedback = Math.max(0, Math.min(0.95, parseFloat(val)));
    this.feedbackGain.gain.setTargetAtTime(this.feedback, this.context.currentTime, 0.03);
  }

  setDelayTime(val) {
    this.delayTime = Math.max(0.01, Math.min(2.0, parseFloat(val)));
    this.delayNode.delayTime.setTargetAtTime(this.delayTime, this.context.currentTime, 0.03);
  }

  getMix() {
    return this.mix;
  }

  getFeedback() {
    return this.feedback;
  }

  getDelayTime() {
    return this.delayTime;
  }
}
