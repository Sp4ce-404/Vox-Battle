// Simple navigation controller that manages tab switching and view activation.

export default class Navigation {
  constructor(onTabChangeCallback) {
    this.navItems = document.querySelectorAll(".nav-item");
    this.views = document.querySelectorAll(".app-view");
    this.callback = onTabChangeCallback;
    
    this.init();
  }

  init() {
    this.navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetViewId = item.getAttribute("data-view");
        this.switchTab(targetViewId);
      });
    });
  }

  switchTab(viewId) {
    // 1. Update navigation items
    this.navItems.forEach(item => {
      if (item.getAttribute("data-view") === viewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // 2. Update views visibility
    this.views.forEach(view => {
      if (view.id === viewId) {
        view.classList.add("active");
        
        // Trigger exit-enter animations by cycling class if needed
        view.style.animation = "none";
        view.offsetHeight; // trigger reflow
        view.style.animation = null;
      } else {
        view.classList.remove("active");
      }
    });
    
    // 3. Fire callback if present
    if (typeof this.callback === "function") {
      this.callback(viewId);
    }
  }
}
