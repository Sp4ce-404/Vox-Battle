// Voice Grid controller that renders category tabs and voice preset cards.
// Implements lazy-loading (infinite scroll) to keep DOM footprint small and scrolling fluid.

import { CATEGORIES } from "../presets/PresetData.js";

export default class VoiceGrid {
  constructor(presetManager, onSelectPresetCallback, onPreviewCallback) {
    this.presetManager = presetManager;
    this.onSelectPreset = onSelectPresetCallback;
    this.onPreview = onPreviewCallback;
    
    // DOM Cache
    this.tabsContainer = document.getElementById("categories-tabs");
    this.gridContainer = document.getElementById("voices-grid");
    this.scrollContainer = document.querySelector(".voices-grid-container");
    this.searchInput = document.getElementById("voice-search");
    this.searchClearBtn = document.getElementById("search-clear");
    this.loadingIndicator = document.getElementById("voices-loading");
    this.emptyState = document.getElementById("voices-empty");
    
    // Local State
    this.currentCategory = "all";
    this.searchQuery = "";
    this.activePresetId = null;
    this.loadedCount = 40; // lazy load chunks of 40
    this.filteredPresetsList = [];
    
    this.init();
  }

  init() {
    this.renderTabs();
    this.updatePresetsList();
    
    // Search input listener
    this.searchInput.addEventListener("input", (e) => {
      this.searchQuery = e.target.value;
      if (this.searchQuery) {
        this.searchClearBtn.classList.remove("hidden");
      } else {
        this.searchClearBtn.classList.add("hidden");
      }
      this.resetPaginationAndRender();
    });
    
    // Clear search listener
    this.searchClearBtn.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchQuery = "";
      this.searchClearBtn.classList.add("hidden");
      this.resetPaginationAndRender();
    });
    
    // Infinite scroll listener
    this.scrollContainer.addEventListener("scroll", () => {
      const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
      // If scrolled within 100px of bottom, load more
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        this.loadMore();
      }
    });
  }

  renderTabs() {
    this.tabsContainer.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const tab = document.createElement("button");
      tab.className = `category-tab ${cat.id === this.currentCategory ? "active" : ""}`;
      tab.textContent = cat.name;
      tab.setAttribute("data-cat", cat.id);
      
      tab.addEventListener("click", () => {
        // Switch tab active classes
        document.querySelectorAll(".category-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        this.currentCategory = cat.id;
        this.resetPaginationAndRender();
      });
      
      this.tabsContainer.appendChild(tab);
    });
  }

  updatePresetsList() {
    this.filteredPresetsList = this.presetManager.getFiltered(this.currentCategory, this.searchQuery);
  }

  resetPaginationAndRender() {
    this.loadedCount = 40;
    this.scrollContainer.scrollTop = 0;
    this.updatePresetsList();
    this.renderGrid();
  }

  loadMore() {
    if (this.loadedCount >= this.filteredPresetsList.length) return;
    
    const prevCount = this.loadedCount;
    this.loadedCount = Math.min(this.loadedCount + 40, this.filteredPresetsList.length);
    
    // Append the newly loaded cards to avoid re-rendering entire list
    const chunk = this.filteredPresetsList.slice(prevCount, this.loadedCount);
    chunk.forEach(preset => {
      const card = this.createVoiceCardElement(preset);
      this.gridContainer.appendChild(card);
    });
  }

  renderGrid() {
    this.gridContainer.innerHTML = "";
    
    if (this.filteredPresetsList.length === 0) {
      this.emptyState.classList.remove("hidden");
      return;
    }
    this.emptyState.classList.add("hidden");
    
    // Render first chunk
    const chunk = this.filteredPresetsList.slice(0, this.loadedCount);
    chunk.forEach(preset => {
      const card = this.createVoiceCardElement(preset);
      this.gridContainer.appendChild(card);
    });
  }

  createVoiceCardElement(preset) {
    const card = document.createElement("div");
    
    // Map categories to design classes
    const themeMap = {
      gaming: "theme-yellow",
      robots: "theme-cyan",
      monsters: "theme-green",
      funny: "theme-pink",
      horror: "theme-purple",
      celebrity: "theme-cyan",
      elements: "theme-green",
      classic: "theme-pink"
    };
    
    const themeClass = themeMap[preset.category] || "theme-pink";
    const isActive = preset.id === this.activePresetId;
    
    card.className = `voice-card ${themeClass} ${isActive ? "active" : ""}`;
    card.setAttribute("data-id", preset.id);
    
    const isFav = this.presetManager.isFavorite(preset.id);
    
    card.innerHTML = `
      <div class="voice-card-header">
        <span class="voice-name">${preset.name}</span>
        <button class="voice-fav-btn ${isFav ? "favorited" : ""}" data-fav="${preset.id}">
          ${isFav ? "★" : "☆"}
        </button>
      </div>
      <div class="voice-card-footer">
        <span class="voice-tag">${preset.tags[1] || preset.category}</span>
        <button class="voice-preview-btn" data-preview="${preset.id}">▶</button>
      </div>
    `;
    
    // Click card to select preset
    card.addEventListener("click", (e) => {
      // If user clicked the Favorite button or Play preview button, intercept it
      if (e.target.closest(".voice-fav-btn") || e.target.closest(".voice-preview-btn")) return;
      
      this.selectPreset(preset.id);
    });
    
    // Favorite Button Action
    const favBtn = card.querySelector(".voice-fav-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isNowFav = this.presetManager.toggleFavorite(preset.id);
      
      favBtn.textContent = isNowFav ? "★" : "☆";
      favBtn.classList.toggle("favorited", isNowFav);
      
      // If we are in favorites view and unfavorite something, remove it
      if (this.currentCategory === "favorites" && !isNowFav) {
        card.remove();
        this.updatePresetsList();
      }
    });
    
    // Preview Button Action
    const previewBtn = card.querySelector(".voice-preview-btn");
    previewBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      
      // Animate preview button icon
      if (previewBtn.textContent === "▶") {
        previewBtn.textContent = "■";
        this.onPreview(preset, () => {
          previewBtn.textContent = "▶";
        });
      } else {
        previewBtn.textContent = "▶";
        this.onPreview(null); // stops preview
      }
    });
    
    return card;
  }

  selectPreset(presetId) {
    this.activePresetId = presetId;
    
    // Update active class on DOM cards
    document.querySelectorAll(".voice-card").forEach(card => {
      if (card.getAttribute("data-id") === presetId) {
        card.classList.add("active");
      } else {
        card.classList.remove("active");
      }
    });
    
    const preset = this.presetManager.presets.find(p => p.id === presetId);
    if (preset && typeof this.onSelectPreset === "function") {
      this.onSelectPreset(preset);
    }
  }

  updateFavoritesUI() {
    // Force re-draw if in Favorites tab, else refresh indicators
    if (this.currentCategory === "favorites") {
      this.resetPaginationAndRender();
    } else {
      this.renderGrid();
    }
  }
}
