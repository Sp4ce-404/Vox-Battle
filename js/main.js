/* =====================================================
   VOXFORGE — Main JS
   - Text scramble (cycling phrases)
   - Custom cursor ring
   - Magnetic buttons
   - Scroll-reveal (blur-in / slide-up)
   - Counter animation
   - Particle canvas
   - Mobile nav
   - Smooth scroll
   - Glitch RGB hover
   ===================================================== */

(() => {
  'use strict';

  // ----- Reduced motion guard -----
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===================================================
  // TEXT SCRAMBLE (ReactBits-style cycle)
  // ===================================================
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#01%$@ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      this.frame = 0;
      this.queue = [];
      this.frameRequest = null;
      this.update = this.update.bind(this);
    }

    setText(newText) {
      const oldText = this.el.dataset.scrambled || this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise(resolve => (this.resolve = resolve));
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 18);
        const end = start + Math.floor(Math.random() * 18);
        this.queue.push({ from, to, start, end, char: '' });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.update();
      this.el.dataset.scrambled = newText;
      return promise;
    }

    update() {
      let output = '';
      let complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        const item = this.queue[i];
        const { from, to, start, end } = item;
        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!item.char || Math.random() < 0.28) {
            item.char = this.randomChar();
          }
          output += `<span class="scramble-char">${item.char}</span>`;
        } else {
          output += from;
        }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        this.resolve && this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    }

    randomChar() {
      return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
  }

  function initScramble() {
    const els = document.querySelectorAll('[data-scramble]');
    els.forEach(el => {
      if (prefersReducedMotion) {
        el.textContent = el.dataset.scramble.split('|')[0];
        return;
      }
      const fx = new TextScramble(el);
      const phrases = el.dataset.scramble.split('|');
      let idx = 0;
      const cycle = () => {
        fx.setText(phrases[idx % phrases.length]).then(() => {
          setTimeout(cycle, 2800);
        });
        idx++;
      };
      // Defer start so initial render is clean
      setTimeout(cycle, 600);
    });
  }

  // ===================================================
  // CUSTOM CURSOR RING
  // ===================================================
  function initCursor() {
    const ring = document.getElementById('cursor-ring');
    if (!ring || prefersReducedMotion) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const tick = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    // Hover effect on interactive elements
    const interactives = document.querySelectorAll('a, button, .brutal-btn, .feature-card, .info-box, .tech-card, .value-card, .dl-card, .step, [data-magnetic]');
    interactives.forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }

  // ===================================================
  // MAGNETIC BUTTONS
  // ===================================================
  function initMagnetic() {
    if (prefersReducedMotion) return;
    const els = document.querySelectorAll('[data-magnetic]');
    els.forEach(el => {
      let raf = null;
      const strength = el.classList.contains('nav-btn') ? 0.25 : 0.35;
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
        });
      });
      el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        el.style.transform = '';
      });
    });
  }

  // ===================================================
  // SCROLL-REVEAL (IntersectionObserver)
  // ===================================================
  function initScrollReveal() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.blur-in, .slide-up').forEach(el => el.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.blur-in, .slide-up').forEach(el => observer.observe(el));
  }

  // ===================================================
  // ANIMATED COUNTERS
  // ===================================================
  function animateCounter(el, target, duration = 1800) {
    let start = null;
    const suffix = el.dataset.suffix || '';
    const step = timestamp => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target).toLocaleString() + (progress === 1 ? suffix : '');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initCounters() {
    const els = document.querySelectorAll('[data-count]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, parseInt(entry.target.dataset.count, 10));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    els.forEach(el => observer.observe(el));
  }

  // ===================================================
  // PARTICLE CANVAS (floating neon dots)
  // ===================================================
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas || prefersReducedMotion) return;
    const ctx = canvas.getContext('2d');
    const COLORS = ['#ff2bd6', '#4dd0e1', '#c6e000'];

    let particles = [];
    let width = 0, height = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function spawn(y) {
      return {
        x: Math.random() * width,
        y: y ?? Math.random() * height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.3 - 0.05,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.1,
      };
    }

    function init() {
      resize();
      particles = Array.from({ length: 70 }, () => spawn());
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          Object.assign(p, spawn(height + 10));
        }
      });
      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    init();
    draw();
  }

  // ===================================================
  // MOBILE NAV
  // ===================================================
  function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if (!hamburger || !menu) return;
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      menu.classList.toggle('open');
    });
    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        menu.classList.remove('open');
      });
    });
  }

  // ===================================================
  // SMOOTH SCROLL (for #anchors)
  // ===================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const href = link.getAttribute('href');
        if (href === '#' || href.length < 2) return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  }

  // ===================================================
  // NAVBAR SCROLL BEHAVIOR (shrink on scroll)
  // ===================================================
  function initNavScroll() {
    const nav = document.querySelector('.navbar');
    if (!nav) return;
    let last = 0;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y > 60) {
        nav.style.padding = '12px 5%';
        nav.style.background = 'rgba(8, 8, 12, 0.95)';
      } else {
        nav.style.padding = '20px 5%';
        nav.style.background = 'rgba(8, 8, 12, 0.85)';
      }
      last = y;
    }, { passive: true });
  }

  // ===================================================
  // GLITCH RGB ON HERO TITLE HOVER
  // ===================================================
  function initGlitchRgb() {
    if (prefersReducedMotion) return;
    const titles = document.querySelectorAll('.hero-title, .about-title');
    titles.forEach(title => {
      title.addEventListener('mouseenter', () => {
        title.classList.add('glitch-rgb');
      });
      title.addEventListener('mouseleave', () => {
        title.classList.remove('glitch-rgb');
      });
    });
  }

  // ===================================================
  // WINDOWS DOWNLOAD (placeholder — wires up button)
  // ===================================================
  function initDownload() {
    const btn = document.getElementById('dl-windows');
    if (!btn) return;
    btn.addEventListener('click', e => {
      e.preventDefault();
      // Placeholder: in production, point to the actual .exe URL
      const link = document.createElement('a');
      link.href = 'https://github.com/voxbattle/voxforge/releases/latest';
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // ===================================================
  // VOICE WALL HOVER PAUSE
  // ===================================================
  function initVoiceWall() {
    document.querySelectorAll('.voice-brick-track').forEach(track => {
      track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
      });
      track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
      });
    });
  }

  // ===================================================
  // TILT EFFECT ON CARDS (subtle 3D on hover)
  // ===================================================
  function initTilt() {
    if (prefersReducedMotion) return;
    const cards = document.querySelectorAll('.feature-card, .tech-card, .value-card, .info-box, .dl-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-8px) perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ===================================================
  // KONAMI / EASTER EGG (V O X F O R G E)
  // ===================================================
  function initEasterEgg() {
    const code = ['v', 'o', 'x', 'f', 'o', 'r', 'g', 'e'];
    let buf = [];
    document.addEventListener('keydown', e => {
      buf.push(e.key.toLowerCase());
      if (buf.length > code.length) buf.shift();
      if (buf.join('') === code.join('')) {
        document.body.style.animation = 'rainbow-border 2s linear infinite, shake 0.4s ease-in-out 3';
        setTimeout(() => {
          document.body.style.animation = '';
        }, 3500);
      }
    });
  }

  // ===================================================
  // BOOT
  // ===================================================
  function boot() {
    initScramble();
    initCursor();
    initMagnetic();
    initScrollReveal();
    initCounters();
    initParticles();
    initMobileNav();
    initSmoothScroll();
    initNavScroll();
    initGlitchRgb();
    initDownload();
    initVoiceWall();
    initTilt();
    initEasterEgg();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
