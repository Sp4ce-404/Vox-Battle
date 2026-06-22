// Manager class that filters, searches, and manages Favorites and Custom user presets.

import PresetGenerator from "./PresetGenerator.js";

export default class PresetManager {
  constructor() {
    this.presets = [];
    this.favorites = new Set();
    this.customPresets = [];
    
    this.loadFavorites();
    this.loadCustomPresets();
    this.initPresets();
  }

  // Load procedurally generated presets and merge with custom presets
  initPresets() {
    this.presets = PresetGenerator.generateAll();
    
    // Add custom presets to list
    this.customPresets.forEach(preset => {
      this.presets.unshift(preset);
    });
  }

  // --- Favorites System ---
  loadFavorites() {
    try {
      const favList = localStorage.getItem("voxbattle-favs");
      if (favList) {
        const parsed = JSON.parse(favList);
        this.favorites = new Set(parsed);
      }
    } catch (e) {
      console.error("Failed to load favorites:", e);
    }
  }

  saveFavorites() {
    try {
      localStorage.setItem("voxbattle-favs", JSON.stringify([...this.favorites]));
    } catch (e) {
      console.error("Failed to save favorites:", e);
    }
  }

  toggleFavorite(presetId) {
    if (this.favorites.has(presetId)) {
      this.favorites.delete(presetId);
    } else {
      this.favorites.add(presetId);
    }
    this.saveFavorites();
    return this.isFavorite(presetId);
  }

  isFavorite(presetId) {
    return this.favorites.has(presetId);
  }

  // --- Custom Preset System ---
  loadCustomPresets() {
    try {
      const customs = localStorage.getItem("voxbattle-customs");
      if (customs) {
        this.customPresets = JSON.parse(customs);
      }
    } catch (e) {
      console.error("Failed to load custom presets:", e);
    }
  }

  saveCustomPresets() {
    try {
      localStorage.setItem("voxbattle-customs", JSON.stringify(this.customPresets));
    } catch (e) {
      console.error("Failed to save custom presets:", e);
    }
  }

  addCustomPreset(name, parameters) {
    const cleanName = name.trim().toUpperCase().slice(0, 20) || "MY CUSTOM PRESET";
    const id = `custom-${Date.now()}`;
    
    const newPreset = {
      id,
      name: cleanName,
      category: "favorites", // Custom presets live in Favorites category tab
      tags: ["custom", "favorites"],
      isCustom: true,
      parameters: { ...parameters }
    };
    
    // Add to lists
    this.customPresets.unshift(newPreset);
    this.presets.unshift(newPreset);
    
    // Auto favorite it
    this.favorites.add(id);
    
    this.saveCustomPresets();
    this.saveFavorites();
    
    return newPreset;
  }

  deleteCustomPreset(id) {
    this.customPresets = this.customPresets.filter(p => p.id !== id);
    this.presets = this.presets.filter(p => p.id !== id);
    this.favorites.delete(id);
    
    this.saveCustomPresets();
    this.saveFavorites();
  }

  // --- Filtering & Search ---
  getFiltered(categoryId = "all", searchQuery = "") {
    const cleanQuery = searchQuery.trim().toLowerCase();
    
    return this.presets.filter(preset => {
      // 1. Category check
      if (categoryId === "favorites") {
        if (!this.favorites.has(preset.id)) return false;
      } else if (categoryId !== "all") {
        if (preset.category !== categoryId) return false;
      }
      
      // 2. Search check
      if (cleanQuery) {
        const matchesName = preset.name.toLowerCase().includes(cleanQuery);
        const matchesTag = preset.tags.some(tag => tag.toLowerCase().includes(cleanQuery));
        return matchesName || matchesTag;
      }
      
      return true;
    });
  }
}
