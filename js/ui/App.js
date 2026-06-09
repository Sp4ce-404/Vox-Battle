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
    console.log("Booting VoxBattle Voice Changer...");
    
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

  // Preview Voice Generator (Procedural synthesiser phrase)
  async handlePreviewPreset(preset, stopCallback) {
    // Stop existing preview first
    this.stopPreview();
    
    if (!preset) return; // called to stop only
    
    this.previewStopCallback = stopCallback;
    
    // Start/Initialize audio engine context
    await this.engine.init();
    
    if (this.engine.context.state === "suspended") {
      await this.engine.context.resume();
    }
    
    // Apply preview preset parameters
    this.engine.applyPreset(preset);
    
    // PROCEDURAL SYNTHESIS: Generate a deep vowel sound "AAAH" to mock a human voice
    // Connects oscillator -> vowel bandpass filters -> audio chain input
    const ctx = this.engine.context;
    
    // Voice base pitch: 130Hz
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    
    // Vowel formant bandpass filters simulating vocal cords
    const formantFilter = ctx.createBiquadFilter();
    formantFilter.type = "bandpass";
    formantFilter.frequency.setValueAtTime(1000, ctx.currentTime); // central vowel frequency
    formantFilter.Q.setValueAtTime(1.5, ctx.currentTime);
    
    // Synthesiser envelope
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    
    // Connect Synth pipeline
    osc.connect(formantFilter);
    formantFilter.connect(env);
    
    // Route synth into Audio Engine FX chain input
    env.connect(this.engine.inputGain);
    
    // Trigger preview envelope: Fade in -> Play 1.8s -> Fade out
    env.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + 0.1);
    env.gain.setValueAtTime(0.4, ctx.currentTime + 1.8);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    
    // Route final output to speakers during preview only so user hears it
    this.engine.outputGain.connect(ctx.destination);
    
    // Start synthesis
    osc.start();
    this.previewNode = { osc, env, filter: formantFilter };
    
    // Auto stop after 2 seconds
    this.previewTimer = setTimeout(() => {
      this.stopPreview();
    }, 2000);
  }

  stopPreview() {
    // Clear timer
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = null;
    }
    
    // Stop & disconnect synthesized nodes
    if (this.previewNode) {
      try {
        this.previewNode.osc.stop();
        this.previewNode.osc.disconnect();
        this.previewNode.filter.disconnect();
        this.previewNode.env.disconnect();
      } catch (e) {}
      this.previewNode = null;
    }
    
    // Turn monitoring back to normal
    if (this.engine && this.engine.isInitialized) {
      this.engine.updateOutputRouting();
    }
    
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
      console.log("VoxBattle was installed successfully!");
      installBtn.classList.add("hidden");
    });
  }
}

// Start application
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
