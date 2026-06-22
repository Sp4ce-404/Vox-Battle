// PitchShifter effect using high-performance AudioWorklet with OLA (Overlap-Add) algorithm
// Loaded via inline Blob to guarantee offline operation and bypass CORS restrictions.

const PITCH_WORKLET_CODE = `
class PitchProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'pitchRatio',
      defaultValue: 1.0,
      minValue: 0.5,
      maxValue: 2.0
    }];
  }

  constructor() {
    super();
    this.bufferSize = 4096;
    this.overlap = 1024;
    this.windowSize = 2048;
    
    // Circular buffers for input and output
    this.inputBuffer = new Float32Array(this.bufferSize);
    this.outputBuffer = new Float32Array(this.bufferSize);
    
    this.inputWritePtr = 0;
    this.outputReadPtr = 0;
    
    // OLA variables
    this.readPhase = 0;
    this.writePhase = 0;
    
    // Hanning window
    this.window = new Float32Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      this.window[i] = 0.5 * (1.0 - Math.cos(2.0 * Math.PI * i / (this.windowSize - 1)));
    }
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || input.length === 0 || !input[0]) return true;
    
    const inputChannel = input[0];
    const outputChannel = output[0];
    const len = inputChannel.length;
    
    const pitchRatio = parameters.pitchRatio[0];
    
    // 1. Write incoming samples to circular input buffer
    for (let i = 0; i < len; i++) {
      this.inputBuffer[this.inputWritePtr] = inputChannel[i];
      this.inputWritePtr = (this.inputWritePtr + 1) % this.bufferSize;
    }
    
    // 2. Perform pitch shifting using Overlap-Add (OLA)
    // We run OLA when we have accumulated enough new samples
    this.writePhase += len;
    while (this.writePhase >= this.overlap) {
      this.writePhase -= this.overlap;
      
      // Calculate output window position
      const outputPos = (this.inputWritePtr - len - this.writePhase + this.bufferSize) % this.bufferSize;
      
      // Overlap and add windowed segment
      for (let i = 0; i < this.windowSize; i++) {
        // Find read index in input buffer based on pitch ratio
        const readOffset = Math.floor(i * pitchRatio);
        const readIndex = (this.inputWritePtr - this.windowSize + readOffset + this.bufferSize) % this.bufferSize;
        
        // Windowed input sample
        const val = this.inputBuffer[readIndex] * this.window[i];
        
        // Add to output buffer with windowing
        const writeIndex = (outputPos + i) % this.bufferSize;
        this.outputBuffer[writeIndex] += val;
      }
    }
    
    // 3. Read processed samples from circular output buffer to hardware output
    for (let i = 0; i < len; i++) {
      outputChannel[i] = this.outputBuffer[this.outputReadPtr];
      // Fade out/clear the buffer sample as we consume it
      this.outputBuffer[this.outputReadPtr] = 0;
      this.outputReadPtr = (this.outputReadPtr + 1) % this.bufferSize;
      
      // Copy to other channels if stereo output is requested
      for (let c = 1; c < output.length; c++) {
        output[c][i] = outputChannel[i];
      }
    }
    
    return true;
  }
}

registerProcessor('pitch-processor', PitchProcessor);
`;

export default class PitchShifter {
  constructor(audioContext) {
    this.context = audioContext;
    this.input = this.context.createGain();
    this.output = this.context.createGain();
    this.workletNode = null;
    this.isLoaded = false;
    this.pitchSemitones = 0;
    
    // Fallback bypass gain in case worklet fails to load
    this.bypassNode = this.context.createGain();
    this.input.connect(this.bypassNode);
    this.bypassNode.connect(this.output);
  }

  async init() {
    try {
      const blob = new Blob([PITCH_WORKLET_CODE], { type: "application/javascript" });
      const workletUrl = URL.createObjectURL(blob);
      await this.context.audioWorklet.addModule(workletUrl);
      URL.revokeObjectURL(workletUrl);

      this.workletNode = new AudioWorkletNode(this.context, "pitch-processor");
      
      // Disconnect bypass
      this.input.disconnect(this.bypassNode);
      this.bypassNode.disconnect(this.output);
      
      // Connect through worklet
      this.input.connect(this.workletNode);
      this.workletNode.connect(this.output);
      
      this.isLoaded = true;
      this.setPitch(this.pitchSemitones);
      console.log("PitchShifter: AudioWorklet loaded successfully.");
    } catch (e) {
      console.error("PitchShifter: AudioWorklet failed, using fallback bypass.", e);
      // Fallback is already connected in constructor
    }
  }

  setPitch(semitones) {
    this.pitchSemitones = parseFloat(semitones);
    // Convert semitones to pitch ratio: ratio = 2^(semitones/12)
    const ratio = Math.pow(2, this.pitchSemitones / 12);
    
    if (this.isLoaded && this.workletNode) {
      const param = this.workletNode.parameters.get("pitchRatio");
      if (param) {
        // Use exponentialRampToValueAtTime for smooth transitions
        param.setTargetAtTime(ratio, this.context.currentTime, 0.05);
      }
    }
  }

  getPitch() {
    return this.pitchSemitones;
  }
}
