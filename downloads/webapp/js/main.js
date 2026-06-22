import AudioEngine from "./audio/AudioEngine.js";
import PresetManager from "./presets/PresetManager.js";
import Navigation from "./ui/Navigation.js";
import VoiceGrid from "./ui/VoiceGrid.js";
import Visualizer from "./ui/Visualizer.js";
import RecordPanel from "./ui/RecordPanel.js";
import EffectControls from "./ui/EffectControls.js";

class App {
  constructor() {
    this.engine = new AudioEngine();
    this.presetManager = new PresetManager();
    this.navigation = null;
    this.voiceGrid = null;
    this.visualizer = null;
    this.recordPanel = null;
    this.effectControls = null;
    this.activePreset = null;
    this.previewNode = null;
    this.previewTimer = null;
    this.previewStopCallback = null;
    this.deferredPrompt = null;
    this.init();
  }

  async init() {
    console.log("[VoxForge] Booting...");

    try { this.navigation = new Navigation((id) => this.handleViewChange(id)); }
    catch (e) { console.warn("[VoxForge] Navigation init failed:", e); }

    try {
      this.visualizer = new Visualizer("visualizer-canvas", this.engine);
      this.visualizer.clearCanvas();
    } catch (e) { console.warn("[VoxForge] Visualizer init failed:", e); }

    try {
      this.effectControls = new EffectControls(
        this.engine,
        this.presetManager,
        (p) => this.handleCustomPresetSaved(p)
      );
    } catch (e) { console.warn("[VoxForge] EffectControls init failed:", e); }

    try {
      this.voiceGrid = new VoiceGrid(
        this.presetManager,
        (p) => this.handleSelectPreset(p),
        (p, cb) => this.handlePreviewPreset(p, cb)
      );
    } catch (e) { console.warn("[VoxForge] VoiceGrid init failed:", e); }

    try {
      this.recordPanel = new RecordPanel(
        this.engine,
        () => this.handleMicAccessSuccess(),
        () => this.handleMicAccessFailure()
      );
    } catch (e) { console.warn("[VoxForge] RecordPanel init failed:", e); }

    this.activePreset = {
      id: "normal",
      name: "Normal Voice",
      parameters: {
        pitch: 0, robotMix: 0, robotFreq: 0, distortion: 0,
        bassGain: 0, trebleGain: 0, delayMix: 0, reverbMix: 0
      }
    };
    if (this.effectControls) this.effectControls.syncSlidersToPreset(this.activePreset.parameters);

    this.setupInstallPrompt();
    console.log("[VoxForge] Boot complete");
  }

  handleViewChange(viewId) {
    if (viewId === "view-record") {
      if (this.visualizer) this.visualizer.start();
    } else {
      if (this.visualizer) this.visualizer.stop();
    }
    this.stopPreview();
  }

  handleMicAccessSuccess() {
    if (this.visualizer) this.visualizer.start();
    this.engine.applyPreset(this.activePreset);
  }

  handleMicAccessFailure() {
    if (this.visualizer) this.visualizer.stop();
  }

  handleSelectPreset(preset) {
    this.activePreset = preset;
    this.engine.applyPreset(preset);
    if (this.effectControls) this.effectControls.syncSlidersToPreset(preset.parameters);
    if (this.recordPanel) this.recordPanel.updateActivePresetName(preset.name);
  }

  async handlePreviewPreset(preset, stopCallback) {
    this.stopPreview();
    if (!preset) return;
    this.previewStopCallback = stopCallback;
    await this.engine.init();
    if (this.engine.context.state === "suspended") await this.engine.context.resume();

    const ctx = this.engine.context;
    const params = preset.parameters;

    // ISOLATED PREVIEW CHAIN — never touches this.engine.inputGain or outputGain
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.detune.setValueAtTime((params.pitch || 0) * 100, ctx.currentTime);

    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.setValueAtTime(1000, ctx.currentTime);
    formant.Q.setValueAtTime(1.5, ctx.currentTime);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.1);
    env.gain.setValueAtTime(0.35, ctx.currentTime + 1.8);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);

    const previewGain = ctx.createGain();
    previewGain.gain.setValueAtTime(0.5, ctx.currentTime);

    osc.connect(formant);
    formant.connect(env);
    env.connect(previewGain);
    previewGain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 2.1);
    this.previewNode = { osc, env, formant, previewGain };
    this.previewTimer = setTimeout(() => this.stopPreview(), 2050);
  }

  stopPreview() {
    if (this.previewTimer) { clearTimeout(this.previewTimer); this.previewTimer = null; }
    if (this.previewNode) {
      try { this.previewNode.osc.stop(); } catch (e) {}
      for (const key of ['osc', 'formant', 'env', 'previewGain']) {
        try { if (this.previewNode[key]) this.previewNode[key].disconnect(); } catch (e) {}
      }
      this.previewNode = null;
    }
    if (typeof this.previewStopCallback === "function") {
      this.previewStopCallback();
      this.previewStopCallback = null;
    }
  }

  handleCustomPresetSaved(newPreset) {
    if (this.voiceGrid) {
      this.voiceGrid.updateFavoritesUI();
      this.voiceGrid.selectPreset(newPreset.id);
    }
  }

  setupInstallPrompt() {
    const installBtn = document.getElementById("pwa-install-btn");
    if (!installBtn) return;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      installBtn.classList.remove("hidden");
    });
    installBtn.addEventListener("click", () => {
      if (!this.deferredPrompt) return;
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((res) => {
        this.deferredPrompt = null;
        installBtn.classList.add("hidden");
      });
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
