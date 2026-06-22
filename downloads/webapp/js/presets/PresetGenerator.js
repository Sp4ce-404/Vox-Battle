// Procedural preset generator that multiplies base profiles into 1,000+ unique voices.

import { CATEGORY_NAMES, CATEGORY_FX_TEMPLATES } from "./PresetData.js";

// Helper to generate a random but deterministic float based on a string seed
// This ensures that the generated preset parameters are consistent on every app load.
function seedRandom(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(Math.sin(hash)) * 1000 % 1;
}

// Maps a seeded value between min and max bounds
function lerp(min, max, value) {
  return min + value * (max - min);
}

export default class PresetGenerator {
  static generateAll() {
    const presets = [];
    let idCounter = 1;
    
    // We will generate 4 variations for each name in each category:
    // 1. [Name] - Standard profile
    // 2. [Name] (BOOST) - Heavier pitch shift and distortion
    // 3. [Name] (CYBER) - Heavy ring modulation
    // 4. [Name] (SPATIAL) - Large reverb and delays
    
    const VARIATIONS = [
      { suffix: "", type: "standard" },
      { suffix: " 🔥BOOST", type: "boost" },
      { suffix: " 🤖CYBER", type: "cyber" },
      { suffix: " 🌌SPATIAL", type: "spatial" }
    ];
    
    for (const [category, names] of Object.entries(CATEGORY_NAMES)) {
      const fx = CATEGORY_FX_TEMPLATES[category];
      if (!fx) continue;
      
      names.forEach((baseName) => {
        VARIATIONS.forEach((variant) => {
          const presetName = `${baseName}${variant.suffix}`;
          const seed = presetName + category; // seed key
          
          // Generate parameters using seed value for consistency
          const r1 = seedRandom(seed + "r1");
          const r2 = seedRandom(seed + "r2");
          const r3 = seedRandom(seed + "r3");
          
          // Base calculations from template ranges
          let pitch = Math.round(lerp(fx.pitchRange[0], fx.pitchRange[1], r1));
          let robotMix = Math.round(lerp(fx.robotMixRange[0], fx.robotMixRange[1], r2));
          let robotFreq = fx.robotFreqRange ? Math.round(lerp(fx.robotFreqRange[0], fx.robotFreqRange[1], r3)) : 60;
          let distortion = Math.round(lerp(fx.distRange[0], fx.distRange[1], r1));
          let bassGain = Math.round(lerp(fx.bassRange[0], fx.bassRange[1], r2));
          let trebleGain = Math.round(lerp(fx.trebleRange[0], fx.trebleRange[1], r3));
          let delayTime = fx.delayMixRange[0] > 0 ? lerp(0.15, 0.45, r1) : 0.3;
          let delayFeedback = fx.delayMixRange[0] > 0 ? Math.round(lerp(15, 55, r2)) : 0;
          let delayMix = Math.round(lerp(fx.delayMixRange[0], fx.delayMixRange[1], r3));
          let reverbDecay = fx.reverbDecayRange ? lerp(fx.reverbDecayRange[0], fx.reverbDecayRange[1], r1) : 1.5;
          let reverbMix = Math.round(lerp(fx.reverbMixRange[0], fx.reverbMixRange[1], r2));
          let chorusMix = fx.chorusMixRange ? Math.round(lerp(fx.chorusMixRange[0], fx.chorusMixRange[1], r3)) : 0;
          
          // Apply variations modifiers
          if (variant.type === "boost") {
            // Amplifies pitch shift extremes and distortion
            pitch = pitch < 0 ? Math.max(-12, pitch - 3) : Math.min(12, pitch + 3);
            distortion = Math.min(100, distortion + 25);
            bassGain = Math.min(15, bassGain + 5);
          } else if (variant.type === "cyber") {
            // Overrides ring modulation mix to be highly metallic
            robotMix = Math.round(lerp(65, 100, r1));
            robotFreq = Math.round(lerp(50, 95, r2));
            trebleGain = Math.min(15, trebleGain + 4);
          } else if (variant.type === "spatial") {
            // Heavy reverb and echo trails
            reverbMix = Math.round(lerp(50, 90, r1));
            reverbDecay = lerp(2.8, 5.0, r2);
            delayMix = Math.round(lerp(35, 70, r3));
            delayFeedback = Math.round(lerp(45, 80, r1));
            delayTime = lerp(0.3, 0.6, r2);
          }
          
          // Push generated preset
          presets.push({
            id: `p-${idCounter++}`,
            name: presetName,
            category: category,
            tags: [category, variant.type],
            parameters: {
              pitch,
              robotMix,
              robotFreq,
              distortion,
              bassGain,
              trebleGain,
              delayTime,
              delayFeedback,
              delayMix,
              reverbDecay,
              reverbMix,
              chorusMix
            }
          });
        });
      });
    }
    
    console.log(`Procedural generation complete: Generated ${presets.length} presets.`);
    return presets;
  }
}
