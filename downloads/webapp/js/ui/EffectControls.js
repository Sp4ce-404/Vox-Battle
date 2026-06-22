// Custom effects control board connector.
// Binds UI range inputs to AudioEngine parameters in real-time.

export default class EffectControls {
  constructor(audioEngine, presetManager, onCustomPresetSavedCallback) {
    this.engine = audioEngine;
    this.presetManager = presetManager;
    this.onPresetSaved = onCustomPresetSavedCallback;
    
    // Sliders & Value Labels
    this.sliders = {
      pitch: { input: document.getElementById("slider-pitch"), label: document.getElementById("val-pitch"), suffix: "" },
      dist: { input: document.getElementById("slider-dist"), label: document.getElementById("val-dist"), suffix: "%" },
      reverb: { input: document.getElementById("slider-reverb"), label: document.getElementById("val-reverb"), suffix: "%" },
      delay: { input: document.getElementById("slider-delay"), label: document.getElementById("val-delay"), suffix: "%" },
      robot: { input: document.getElementById("slider-robot"), label: document.getElementById("val-robot"), suffix: " Hz" },
      bass: { input: document.getElementById("slider-bass"), label: document.getElementById("val-bass"), suffix: " dB" },
      treble: { input: document.getElementById("slider-treble"), label: document.getElementById("val-treble"), suffix: " dB" }
    };
    
    // Save Form
    this.customNameInput = document.getElementById("custom-preset-name");
    this.saveBtn = document.getElementById("save-custom-btn");
    
    this.init();
  }

  init() {
    const safeOn = (el, ev, fn) => { if (el && el.addEventListener) el.addEventListener(ev, fn); };

    // Bind slider input events for real-time responsiveness
    safeOn(this.sliders.pitch.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.pitch.label) this.sliders.pitch.label.textContent = val > 0 ? `+${val}` : val;
      this.engine.setPitch(val);
    });

    safeOn(this.sliders.dist.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.dist.label) this.sliders.dist.label.textContent = `${val}%`;
      this.engine.setDistortion(val);
    });

    safeOn(this.sliders.reverb.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.reverb.label) this.sliders.reverb.label.textContent = `${val}%`;
      this.engine.setReverbMix(val);
      if (this.engine.effects && this.engine.effects.reverb) this.engine.effects.reverb.setDecay(1.0 + (val / 100) * 3);
    });

    safeOn(this.sliders.delay.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.delay.label) this.sliders.delay.label.textContent = `${val}%`;
      this.engine.setDelayMix(val);
      this.engine.setDelayFeedback(val * 0.75);
    });

    safeOn(this.sliders.robot.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.robot.label) this.sliders.robot.label.textContent = val === 0 ? "0 Hz" : `${val} Hz`;
      if (val === 0) this.engine.setRobotMix(0);
      else { this.engine.setRobotMix(80); this.engine.setRobotFrequency(val); }
    });

    safeOn(this.sliders.bass.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.bass.label) this.sliders.bass.label.textContent = val > 0 ? `+${val} dB` : `${val} dB`;
      this.engine.setBassGain(val);
    });

    safeOn(this.sliders.treble.input, "input", (e) => {
      const val = parseInt(e.target.value);
      if (this.sliders.treble.label) this.sliders.treble.label.textContent = val > 0 ? `+${val} dB` : `${val} dB`;
      this.engine.setTrebleGain(val);
    });

    safeOn(this.saveBtn, "click", () => this.saveCustomPreset());
  }

  // Set Slider DOM values to match a preset
  syncSlidersToPreset(parameters) {
    const params = parameters || {};
    const setIfPresent = (key, val, display) => {
      const s = this.sliders[key];
      if (!s) return;
      if (s.input) s.input.value = val;
      if (s.label && display !== null && display !== undefined) s.label.textContent = display;
    };

    const pitch = params.pitch || 0;
    setIfPresent("pitch", pitch, pitch > 0 ? `+${pitch}` : pitch);

    const dist = params.distortion || 0;
    setIfPresent("dist", dist, `${dist}%`);

    const reverb = params.reverbMix || 0;
    setIfPresent("reverb", reverb, `${reverb}%`);

    const delay = params.delayMix || 0;
    setIfPresent("delay", delay, `${delay}%`);

    const rMix = params.robotMix || 0;
    const rFreq = rMix > 0 ? (params.robotFreq || 60) : 0;
    setIfPresent("robot", rFreq, `${rFreq} Hz`);

    const bass = params.bassGain || 0;
    setIfPresent("bass", bass, bass > 0 ? `+${bass} dB` : `${bass} dB`);

    const treble = params.trebleGain || 0;
    setIfPresent("treble", treble, treble > 0 ? `+${treble} dB` : `${treble} dB`);
  }

  saveCustomPreset() {
    const name = this.customNameInput.value.trim();
    if (!name) {
      alert("PRESET NAME REQUIRED: Please enter a name to save your voice design.");
      return;
    }
    
    // Gather current slider parameters
    const parameters = {
      pitch: parseInt(this.sliders.pitch.input.value),
      robotMix: parseInt(this.sliders.robot.input.value) > 0 ? 80 : 0,
      robotFreq: parseInt(this.sliders.robot.input.value),
      distortion: parseInt(this.sliders.dist.input.value),
      bassGain: parseInt(this.sliders.bass.input.value),
      trebleGain: parseInt(this.sliders.treble.input.value),
      delayTime: 0.3,
      delayFeedback: parseInt(this.sliders.delay.input.value) * 0.75,
      delayMix: parseInt(this.sliders.delay.input.value),
      reverbDecay: 1.5 + (parseInt(this.sliders.reverb.input.value) / 100) * 3,
      reverbMix: parseInt(this.sliders.reverb.input.value),
      chorusMix: 0
    };
    
    const newPreset = this.presetManager.addCustomPreset(name, parameters);
    
    // Reset Form
    this.customNameInput.value = "";
    alert(`PRESET '${newPreset.name}' SAVED SUCCESSFULY TO ALL VOICES / FAVORITES!`);
    
    if (typeof this.onPresetSaved === "function") {
      this.onPresetSaved(newPreset);
    }
  }
}
