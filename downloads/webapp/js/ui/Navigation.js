// Simple navigation controller that manages tab switching and view activation.

export default class Navigation {
  constructor(onTabChangeCallback) {
    this.navItems = document.querySelectorAll(".nav-item");
    this.views = document.querySelectorAll(".app-view");
    this.callback = onTabChangeCallback;
    this.init();
  }

  init() {
    if (!this.navItems || this.navItems.length === 0) return;
    this.navItems.forEach(item => {
      item.addEventListener("click", () => {
        const targetViewId = item.getAttribute("data-view");
        if (!targetViewId) return;
        this.switchTab(targetViewId);
      });
    });
  }

  switchTab(viewId) {
    if (!viewId) return;
    this.navItems.forEach(item => {
      if (item.getAttribute("data-view") === viewId) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });
    this.views.forEach(view => {
      if (view.id === viewId) {
        view.classList.add("active");
        view.style.animation = "none";
        view.offsetHeight;
        view.style.animation = null;
      } else {
        view.classList.remove("active");
      }
    });
    if (typeof this.callback === "function") {
      this.callback(viewId);
    }
  }
}
