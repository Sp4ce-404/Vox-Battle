// App entry point that bootstraps all subsystems and manages coordination.

import AudioEngine from "../audio/AudioEngine.js";
import PresetManager from "../presets/PresetManager.js";
import Navigation from "./Navigation.js";
import VoiceGrid from "./VoiceGrid.js";
import Visualizer from "./Visualizer.js";
import RecordPanel from "./RecordPanel.js";
import EffectControls from "./EffectControls.js";

class App {
  constructor() {
    this.engine = new AudioEngine();
    this.presetManager = new PresetManager();
    
    // Sub-controllers
    this.navigation = null;
    this.voiceGrid = null;
    this.visualizer = null;
    this.recordPanel = null;
    this.effectControls = null;
    
    // Local State
    this.activePreset = null;
    this.previewNode = null;
    this.previewTimer = null;
    this.previewStopCallback = null;
    this.deferredPrompt = null;
    
    this.init();
  }

  async init() {
    console.log("Booting VoxForge Voice Changer...");
    
    // 1. Navigation Panel Switcher
    this.navigation = new Navigation((viewId) => this.handleViewChange(viewId));
    
    // 2. Audio Visualizer Canvas
    this.visualizer = new Visualizer("visualizer-canvas", this.engine);
    this.visualizer.clearCanvas();
    
    // 3. Manual DSP slider panels
    this.effectControls = new EffectControls(
      this.engine,
      this.presetManager,
      (newPreset) => this.handleCustomPresetSaved(newPreset)
    );
    
    // 4. Voice Cards Grid
    this.voiceGrid = new VoiceGrid(
      this.presetManager,
      (preset) => this.handleSelectPreset(preset),
      (preset, stopCallback) => this.handlePreviewPreset(preset, stopCallback)
    );
    
    // 5. Recording and Monitoring panel
    this.recordPanel = new RecordPanel(
      this.engine,
      () => this.handleMicAccessSuccess(),
      () => this.handleMicAccessFailure()
    );
    
    // Set default preset on load (Normal voice = pitch 0, no effects)
    this.activePreset = {
      id: "normal",
      name: "Normal Voice",
      parameters: {
        pitch: 0, robotMix: 0, robotFreq: 0, distortion: 0,
        bassGain: 0, trebleGain: 0, delayMix: 0, reverbMix: 0
      }
    };
    
    // Sync UI elements to default normal preset
    this.effectControls.syncSlidersToPreset(this.activePreset.parameters);
    
    // Setup PWA Installation prompts
    this.setupInstallPrompt();

    // Bind Master Gain Slider
    const masterGainSlider = document.querySelector(".control-panel .neon-slider");
    const masterGainValue = document.querySelector(".control-panel .gain-value");
    if (masterGainSlider && masterGainValue) {
      masterGainSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        masterGainValue.textContent = `${val}%`;
        this.engine.setMasterVolume(val);
      });
    }
  }

  // Handle active panel changes
  handleViewChange(viewId) {
    // If user opens RECORD view, activate drawing loop
    if (viewId === "view-record") {
      this.visualizer.start();
    } else {
      // Pause drawing loop on other tabs to save mobile GPU/CPU battery
      this.visualizer.stop();
    }
    
    // Stops any playing preview when navigating tabs
    this.stopPreview();
  }

  // Microphones connection callbacks
  handleMicAccessSuccess() {
    this.visualizer.start();
    // Connect context FX with active preset values
    this.engine.applyPreset(this.activePreset);
  }

  handleMicAccessFailure() {
    this.visualizer.stop();
  }

  // Select Preset Card Handler
  handleSelectPreset(preset) {
    this.activePreset = preset;
    
    // 1. Apply FX parameters in AudioEngine
    this.engine.applyPreset(preset);
    
    // 2. Sync Custom Board manual sliders
    this.effectControls.syncSlidersToPreset(preset.parameters);
    
    // 3. Update active preset text display
    this.recordPanel.updateActivePresetName(preset.name);
  }

  // Preview Voice Generator — ISOLATED from main mic chain
  // Uses a separate audio graph so synthesis noise never bleeds into the live voice.
  async handlePreviewPreset(preset, stopCallback) {
    // Stop existing preview first
    this.stopPreview();
    
    if (!preset) return; // called to stop only
    
    this.previewStopCallback = stopCallback;
    
    // Start/Initialize audio engine context (reuse the same AudioContext)
    await this.engine.init();
    
    if (this.engine.context.state === "suspended") {
      await this.engine.context.resume();
    }
    
    const ctx = this.engine.context;
    const params = preset.parameters;
    
    // ──────────────────────────────────────────────
    // BUILD AN ISOLATED PREVIEW CHAIN
    // This chain is completely separate from the main mic->effects->output chain.
    // Nothing here touches this.engine.inputGain or this.engine.outputGain.
    // ──────────────────────────────────────────────
    
    // 1. Voice base: sawtooth oscillator at ~130Hz
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    
    // 2. Vowel formant bandpass (simulate "AAAH")
    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.setValueAtTime(1000, ctx.currentTime);
    formant.Q.setValueAtTime(1.5, ctx.currentTime);
    
    // 3. Envelope (fade in / sustain / fade out over 2s)
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
    env.gain.setValueAtTime(0.35, ctx.currentTime + 1.8);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    
    // 4. Lightweight pitch simulation via playback rate on a buffer
    //    (We approximate pitch shift with a detuned second oscillator instead of
    //     routing through the main AudioWorklet pitch shifter)
    const pitchSemitones = params.pitch || 0;
    const pitchCents = pitchSemitones * 100;
    osc.detune.setValueAtTime(pitchCents, ctx.currentTime);
    
    // 5. Lightweight distortion preview (waveshaper)
    const distAmount = (params.distortion || 0) / 100;
    let distNode = null;
    if (distAmount > 0.05) {
      distNode = ctx.createWaveShaper();
      const samples = 256;
      const curve = new Float32Array(samples);
      const k = distAmount * 50;
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
      }
      distNode.curve = curve;
      distNode.oversample = "2x";
    }
    
    // 6. Preview EQ (bass/treble)
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.setValueAtTime(320, ctx.currentTime);
    bassFilter.gain.setValueAtTime(params.bassGain || 0, ctx.currentTime);
    
    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    trebleFilter.gain.setValueAtTime(params.trebleGain || 0, ctx.currentTime);
    
    // 7. Preview reverb (simple convolver with generated impulse)
    const reverbMix = (params.reverbMix || 0) / 100;
    let reverbWetGain = null;
    let reverbDryGain = null;
    let convolver = null;
    if (reverbMix > 0.05) {
      const decay = params.reverbDecay || 1.5;
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * Math.min(decay, 3));
      const impulse = ctx.createBuffer(1, length, sampleRate);
      const data = impulse.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
      convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      reverbWetGain = ctx.createGain();
      reverbWetGain.gain.setValueAtTime(reverbMix, ctx.currentTime);
      reverbDryGain = ctx.createGain();
      reverbDryGain.gain.setValueAtTime(1 - reverbMix * 0.5, ctx.currentTime);
    }
    
    // 8. Preview output gain (master volume for preview only)
    const previewGain = ctx.createGain();
    previewGain.gain.setValueAtTime(0.5, ctx.currentTime);
    
    // ──────────────────────────────────────────────
    // CONNECT THE ISOLATED PREVIEW CHAIN
    // osc → formant → env → [distortion] → bass EQ → treble EQ → [reverb mix] → previewGain → destination
    // ──────────────────────────────────────────────
    
    osc.connect(formant);
    formant.connect(env);
    
    let currentNode = env;
    
    if (distNode) {
      currentNode.connect(distNode);
      currentNode = distNode;
    }
    
    currentNode.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    
    if (convolver && reverbWetGain && reverbDryGain) {
      // Dry/wet split
      trebleFilter.connect(reverbDryGain);
      trebleFilter.connect(convolver);
      convolver.connect(reverbWetGain);
      reverbDryGain.connect(previewGain);
      reverbWetGain.connect(previewGain);
    } else {
      trebleFilter.connect(previewGain);
    }
    
    // Route ONLY to speakers — NOT to this.engine.outputGain
    previewGain.connect(ctx.destination);
    
    // Start synthesis
    osc.start();
    osc.stop(ctx.currentTime + 2.1); // auto-stop slightly after envelope
    
    // Store references for cleanup
    this.previewNode = {
      osc, env, formant, distNode, bassFilter, trebleFilter,
      convolver, reverbWetGain, reverbDryGain, previewGain
    };
    
    // Auto stop after 2 seconds
    this.previewTimer = setTimeout(() => {
      this.stopPreview();
    }, 2050);
  }

  stopPreview() {
    // Clear timer
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    
    // Stop & disconnect all isolated preview nodes
    if (this.previewNode) {
      try { this.previewNode.osc.stop(); } catch (e) {}
      // Disconnect every node in the isolated chain
      const nodes = [
        'osc', 'formant', 'env', 'distNode', 'bassFilter', 'trebleFilter',
        'convolver', 'reverbWetGain', 'reverbDryGain', 'previewGain'
      ];
      for (const key of nodes) {
        try { if (this.previewNode[key]) this.previewNode[key].disconnect(); } catch (e) {}
      }
      this.previewNode = null;
    }
    
    // NOTE: We no longer need to call this.engine.updateOutputRouting() here
    // because the preview chain is fully isolated and never touched the main output.
    
    // Call UI reset callback
    if (typeof this.previewStopCallback === "function") {
      this.previewStopCallback();
      this.previewStopCallback = null;
    }
  }

  handleCustomPresetSaved(newPreset) {
    // Refresh Voice Grid lists
    this.voiceGrid.updateFavoritesUI();
    // Auto select the newly created preset
    this.voiceGrid.selectPreset(newPreset.id);
  }

  // --- PWA Setup ---
  setupInstallPrompt() {
    const installBtn = document.getElementById("pwa-install-btn");
    
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent standard browser bar
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show custom brutalist INSTALL button
      installBtn.classList.remove("hidden");
    });
    
    installBtn.addEventListener("click", () => {
      if (!this.deferredPrompt) return;
      
      // Prompt user
      this.deferredPrompt.prompt();
      
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User installed PWA");
        } else {
          console.log("User dismissed install prompt");
        }
        this.deferredPrompt = null;
        installBtn.classList.add("hidden");
      });
    });
    
    window.addEventListener("appinstalled", () => {
      console.log("VoxForge was installed successfully!");
      installBtn.classList.add("hidden");
    });
  }
}

// Start application
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
