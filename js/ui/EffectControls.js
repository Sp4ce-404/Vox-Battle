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
    // Bind slider input events for real-time responsiveness
    
    // 1. Pitch
    this.sliders.pitch.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.pitch.label.textContent = val > 0 ? `+${val}` : val;
      this.engine.setPitch(val);
    });
    
    // 2. Distortion
    this.sliders.dist.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.dist.label.textContent = `${val}%`;
      this.engine.setDistortion(val);
    });
    
    // 3. Reverb
    this.sliders.reverb.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.reverb.label.textContent = `${val}%`;
      this.engine.setReverbMix(val);
      // Dynamically adjust decay size slightly
      this.engine.effects.reverb.setDecay(1.0 + (val / 100) * 3);
    });
    
    // 4. Delay / Echo
    this.sliders.delay.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.delay.label.textContent = `${val}%`;
      this.engine.setDelayMix(val);
      // Set feedback proportional to mix to prevent audio overload
      this.engine.setDelayFeedback(val * 0.75);
    });
    
    // 5. Robot Voice
    this.sliders.robot.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.robot.label.textContent = val === 0 ? "0 Hz" : `${val} Hz`;
      
      if (val === 0) {
        this.engine.setRobotMix(0);
      } else {
        // Automatically enable mix when slider is moved
        this.engine.setRobotMix(80);
        this.engine.setRobotFrequency(val);
      }
    });
    
    // 6. Equalizer Bass
    this.sliders.bass.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.bass.label.textContent = val > 0 ? `+${val} dB` : `${val} dB`;
      this.engine.setBassGain(val);
    });
    
    // 7. Equalizer Treble
    this.sliders.treble.input.addEventListener("input", (e) => {
      const val = parseInt(e.target.value);
      this.sliders.treble.label.textContent = val > 0 ? `+${val} dB` : `${val} dB`;
      this.engine.setTrebleGain(val);
    });
    
    // Save Custom Button
    this.saveBtn.addEventListener("click", () => this.saveCustomPreset());
  }

  // Set Slider DOM values to match a preset
  syncSlidersToPreset(parameters) {
    const params = parameters || {};
    
    // Pitch
    const pitch = params.pitch || 0;
    this.sliders.pitch.input.value = pitch;
    this.sliders.pitch.label.textContent = pitch > 0 ? `+${pitch}` : pitch;
    
    // Distortion
    const dist = params.distortion || 0;
    this.sliders.dist.input.value = dist;
    this.sliders.dist.label.textContent = `${dist}%`;
    
    // Reverb
    const reverb = params.reverbMix || 0;
    this.sliders.reverb.input.value = reverb;
    this.sliders.reverb.label.textContent = `${reverb}%`;
    
    // Delay
    const delay = params.delayMix || 0;
    this.sliders.delay.input.value = delay;
    this.sliders.delay.label.textContent = `${delay}%`;
    
    // Robot
    const rMix = params.robotMix || 0;
    const rFreq = rMix > 0 ? (params.robotFreq || 60) : 0;
    this.sliders.robot.input.value = rFreq;
    this.sliders.robot.label.textContent = `${rFreq} Hz`;
    
    // EQ
    const bass = params.bassGain || 0;
    this.sliders.bass.input.value = bass;
    this.sliders.bass.label.textContent = bass > 0 ? `+${bass} dB` : `${bass} dB`;
    
    const treble = params.trebleGain || 0;
    this.sliders.treble.input.value = treble;
    this.sliders.treble.label.textContent = treble > 0 ? `+${treble} dB` : `${treble} dB`;
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
