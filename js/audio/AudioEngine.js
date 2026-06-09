// Core Audio Engine that manages microphone access, builds the Web Audio graph,
// and routes audio to the speakers and recorder.

import PitchShifter from "./effects/PitchShifter.js";
import Reverb from "./effects/Reverb.js";
import Distortion from "./effects/Distortion.js";
import Delay from "./effects/Delay.js";
import Chorus from "./effects/Chorus.js";
import RobotVoice from "./effects/RobotVoice.js";
import Equalizer from "./effects/Equalizer.js";
import Compressor from "./effects/Compressor.js";

export default class AudioEngine {
  constructor() {
    this.context = null;
    this.micStream = null;
    this.sourceNode = null;
    
    // Core nodes
    this.inputGain = null;
    this.outputGain = null;
    this.analyser = null;
    
    // Effects
    this.effects = {
      pitch: null,
      robot: null,
      distortion: null,
      equalizer: null,
      delay: null,
      reverb: null,
      chorus: null,
      compressor: null
    };
    
    this.isInitialized = false;
    this.isMicActive = false;
    this.hearMyself = false;
    
    // Recording
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
    this.recordingStartTime = 0;
  }

  // Initialize Web Audio context on first user action
  async init() {
    if (this.isInitialized) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.context = new AudioContextClass({
      latencyHint: "interactive" // requesting low latency
    });
    
    // Create base nodes
    this.inputGain = this.context.createGain();
    this.outputGain = this.context.createGain();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    
    // Instantiate all effects
    this.effects.pitch = new PitchShifter(this.context);
    this.effects.robot = new RobotVoice(this.context);
    this.effects.distortion = new Distortion(this.context);
    this.effects.equalizer = new Equalizer(this.context);
    this.effects.delay = new Delay(this.context);
    this.effects.reverb = new Reverb(this.context);
    this.effects.chorus = new Chorus(this.context);
    this.effects.compressor = new Compressor(this.context);
    
    // Await AudioWorklet loading for PitchShifter
    await this.effects.pitch.init();
    
    // Build the serial effects chain:
    // inputGain -> Pitch -> Robot -> Distortion -> EQ -> Delay -> Reverb -> Chorus -> Compressor -> outputGain -> Analyser
    this.inputGain.connect(this.effects.pitch.input);
    this.effects.pitch.output.connect(this.effects.robot.input);
    this.effects.robot.output.connect(this.effects.distortion.input);
    this.effects.distortion.output.connect(this.effects.equalizer.input);
    this.effects.equalizer.output.connect(this.effects.delay.input);
    this.effects.delay.output.connect(this.effects.reverb.input);
    this.effects.reverb.output.connect(this.effects.chorus.input);
    this.effects.chorus.output.connect(this.effects.compressor.input);
    this.effects.compressor.output.connect(this.outputGain);
    
    // Connect output gain to analyser (recording and visualizer tap)
    this.outputGain.connect(this.analyser);
    
    this.isInitialized = true;
    console.log("AudioEngine initialized successfully.");
  }

  // Start microphone capture and connect to context
  async startMic() {
    await this.init();
    
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    
    if (this.isMicActive) return;
    
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0
        }
      });
      
      this.sourceNode = this.context.createMediaStreamSource(this.micStream);
      this.sourceNode.connect(this.inputGain);
      
      this.isMicActive = true;
      this.updateOutputRouting();
      console.log("Microphone started and connected.");
    } catch (e) {
      console.error("Failed to access microphone:", e);
      throw e;
    }
  }

  // Stop microphone capture
  stopMic() {
    if (!this.isMicActive) return;
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    
    this.isMicActive = false;
    this.updateOutputRouting();
    console.log("Microphone stopped.");
  }

  // Set monitoring (whether user hears their own voice)
  setHearMyself(enabled) {
    this.hearMyself = !!enabled;
    this.updateOutputRouting();
  }

  // Adjust output routing depending on Hear Myself setting
  updateOutputRouting() {
    if (!this.isInitialized) return;
    
    // Disconnect output gain from destination to reset routing
    try {
      this.outputGain.disconnect(this.context.destination);
    } catch (e) {
      // Ignore disconnect errors if not connected
    }
    
    // Connect to speakers only if microphone is active AND hearMyself is checked
    if (this.isMicActive && this.hearMyself) {
      this.outputGain.connect(this.context.destination);
      console.log("Audio routed to speakers.");
    } else {
      console.log("Audio muted from speakers (monitoring disabled).");
    }
  }

  // Apply a voice preset (set of parameters)
  applyPreset(preset) {
    if (!this.isInitialized) return;
    
    const params = preset.parameters;
    
    this.effects.pitch.setPitch(params.pitch || 0);
    this.effects.robot.setFrequency(params.robotFreq || 0);
    this.effects.robot.setMix(params.robotMix || 0);
    this.effects.distortion.setAmount((params.distortion || 0) / 100);
    this.effects.equalizer.setBassGain(params.bassGain || 0);
    this.effects.equalizer.setTrebleGain(params.trebleGain || 0);
    this.effects.delay.setDelayTime(params.delayTime || 0.3);
    this.effects.delay.setFeedback((params.delayFeedback || 0) / 100);
    this.effects.delay.setMix((params.delayMix || 0) / 100);
    this.effects.reverb.setMix((params.reverbMix || 0) / 100);
    this.effects.reverb.setDecay(params.reverbDecay || 1.5);
    this.effects.chorus.setMix((params.chorusMix || 0) / 100);
    
    console.log(`Preset applied: ${preset.name}`);
  }

  // Real-time slider controllers
  setPitch(semitones) {
    if (this.effects.pitch) this.effects.pitch.setPitch(semitones);
  }
  setDistortion(percent) {
    if (this.effects.distortion) this.effects.distortion.setAmount(percent / 100);
  }
  setReverbMix(percent) {
    if (this.effects.reverb) this.effects.reverb.setMix(percent / 100);
  }
  setDelayFeedback(percent) {
    if (this.effects.delay) this.effects.delay.setFeedback(percent / 100);
  }
  setDelayTime(seconds) {
    if (this.effects.delay) this.effects.delay.setDelayTime(seconds);
  }
  setDelayMix(percent) {
    if (this.effects.delay) this.effects.delay.setMix(percent / 100);
  }
  setRobotFrequency(hz) {
    if (this.effects.robot) this.effects.robot.setFrequency(hz);
  }
  setRobotMix(percent) {
    if (this.effects.robot) this.effects.robot.setMix(percent / 100);
  }
  setBassGain(db) {
    if (this.effects.equalizer) this.effects.equalizer.setBassGain(db);
  }
  setTrebleGain(db) {
    if (this.effects.equalizer) this.effects.equalizer.setTrebleGain(db);
  }

  // --- Recording controls ---
  startRecording() {
    if (!this.isMicActive || this.isRecording) return;
    
    this.recordedChunks = [];
    
    // We record the processed stream directly from the output analyser/gain node
    // Audio destination node can act as stream source
    const destStream = this.context.createMediaStreamDestination();
    this.outputGain.connect(destStream);
    
    // Determine supported MIME types for recording (Android Chrome supports webm / ogg / wav)
    let mimeType = "audio/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "audio/ogg";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ""; // Fallback to browser default
      }
    }
    
    const options = mimeType ? { mimeType } : {};
    this.mediaRecorder = new MediaRecorder(destStream.stream, options);
    
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
    
    this.mediaRecorder.onstop = () => {
      // Clean up connections
      try {
        this.outputGain.disconnect(destStream);
      } catch (e) {}
    };
    
    this.mediaRecorder.start();
    this.isRecording = true;
    this.recordingStartTime = Date.now();
    console.log("Recording started...");
  }

  stopRecording() {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        resolve(null);
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const blob = new Blob(this.recordedChunks, { type: this.mediaRecorder.mimeType || "audio/webm" });
        console.log("Recording stopped. Created Blob size:", blob.size);
        resolve(blob);
      };
      
      this.mediaRecorder.stop();
    });
  }

  getAnalyserData() {
    if (!this.isInitialized || !this.isMicActive) return null;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}
