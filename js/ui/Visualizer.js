// Dynamic Web Audio visualizer that draws high-FPS neon wave patterns.

export default class Visualizer {
  constructor(canvasId, audioEngine) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.engine = audioEngine;
    this.animationId = null;
    this.isActive = false;
    
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  resizeCanvas() {
    // Canvas sizing matches CSS layout bounds
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
  }

  start() {
    if (this.isActive) return;
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
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = "#040407";
    this.ctx.fillRect(0, 0, w, h);
    
    // Draw idle flat line with neon border style
    this.ctx.strokeStyle = "#00f0ff";
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = "rgba(0, 240, 255, 0.6)";
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, h / 2);
    this.ctx.lineTo(w, h / 2);
    this.ctx.stroke();
    
    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  draw() {
    if (!this.isActive) return;
    
    this.animationId = requestAnimationFrame(() => this.draw());
    
    const w = this.canvas.width;
    const h = this.canvas.height;
    
    // Fade background slightly to create retro phosphor trails
    this.ctx.fillStyle = "rgba(4, 4, 7, 0.25)";
    this.ctx.fillRect(0, 0, w, h);
    
    // Fetch FFT analysis
    const data = this.engine.getAnalyserData();
    
    if (!data) {
      this.clearCanvas();
      return;
    }
    
    const len = data.length;
    const barWidth = (w / len) * 2.5;
    let x = 0;
    
    // Setup neon properties
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 10;
    
    // Draw frequency spectrum bars (mirrored left-right for premium feel)
    for (let i = 0; i < len / 2; i++) {
      const value = data[i];
      const percent = value / 255;
      const barHeight = percent * h * 0.8;
      
      // Color shifts: bass (left) is pink, mid is cyan, treble (right) is green
      const r = i / (len / 2);
      let color = "#00f0ff"; // default cyan
      
      if (r < 0.3) {
        color = "#ff007f"; // Pink bass
      } else if (r > 0.7) {
        color = "#39ff14"; // Green treble
      }
      
      this.ctx.fillStyle = color;
      this.ctx.strokeStyle = "#000000"; // Black borders for brutalist design
      this.ctx.shadowColor = color;
      
      // Mirror draw
      const yPos = (h - barHeight) / 2;
      
      // Left side
      this.ctx.fillRect(w / 2 - x, yPos, barWidth - 2, barHeight);
      this.ctx.strokeRect(w / 2 - x, yPos, barWidth - 2, barHeight);
      
      // Right side
      this.ctx.fillRect(w / 2 + x, yPos, barWidth - 2, barHeight);
      this.ctx.strokeRect(w / 2 + x, yPos, barWidth - 2, barHeight);
      
      x += barWidth;
    }
    
    // Reset shadow blur for other drawing calls to save GPU cycles
    this.ctx.shadowBlur = 0;
  }
}
