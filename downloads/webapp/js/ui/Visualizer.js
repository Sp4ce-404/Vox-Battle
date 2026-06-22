// Dynamic Web Audio visualizer that draws high-FPS neon wave patterns.

export default class Visualizer {
  constructor(canvasId, audioEngine) {
    this.canvas = document.getElementById(canvasId);
    this.engine = audioEngine;
    this.animationId = null;
    this.isActive = false;
    this.ctx = null;

    if (this.canvas) {
      try { this.ctx = this.canvas.getContext("2d"); } catch (e) { this.ctx = null; }
    }

    if (this.canvas && this.ctx) {
      this.resizeCanvas();
      window.addEventListener("resize", () => this.resizeCanvas());
    }
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth || 300;
    const h = this.canvas.clientHeight || 80;
    this.canvas.width = Math.max(1, Math.floor(w * ratio));
    this.canvas.height = Math.max(1, Math.floor(h * ratio));
  }

  start() {
    if (this.isActive) return;
    if (!this.ctx) return;
    this.isActive = true;
    this.draw();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.clearCanvas();
  }

  clearCanvas() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = "#040407";
    this.ctx.fillRect(0, 0, w, h);

    this.ctx.strokeStyle = "#00f0ff";
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = "rgba(0, 240, 255, 0.6)";

    this.ctx.beginPath();
    this.ctx.moveTo(0, h / 2);
    this.ctx.lineTo(w, h / 2);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
  }

  draw() {
    if (!this.isActive || !this.ctx) return;

    this.animationId = requestAnimationFrame(() => this.draw());

    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.fillStyle = "rgba(4, 4, 7, 0.25)";
    this.ctx.fillRect(0, 0, w, h);

    let data = null;
    try { data = this.engine && this.engine.getAnalyserData ? this.engine.getAnalyserData() : null; } catch (e) { data = null; }

    if (!data || data.length === 0) return;

    const len = data.length;
    const barWidth = (w / len) * 2.5;
    let x = 0;

    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;

    for (let i = 0; i < Math.floor(len / 2); i++) {
      const value = data[i];
      const percent = value / 255;
      const barHeight = percent * h * 0.8;

      const r = i / (len / 2);
      let color = "#00f0ff";

      if (r < 0.3) color = "#ff007f";
      else if (r > 0.7) color = "#39ff14";

      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = "#000000";
      this.ctx.shadowColor = color;

      const yPos = (h - barHeight) / 2;

      this.ctx.fillRect(w / 2 - x, yPos, barWidth - 2, barHeight);
      this.ctx.strokeRect(w / 2 - x, yPos, barWidth - 2, barHeight);

      this.ctx.fillRect(w / 2 + x, yPos, barWidth - 2, barHeight);
      this.ctx.strokeRect(w / 2 + x, yPos, barWidth - 2, barHeight);

      x += barWidth;
    }

    this.ctx.shadowBlur = 0;
  }
}
