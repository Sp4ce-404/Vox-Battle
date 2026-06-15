# VOXFORGE — Website

The official website for **VoxForge**, a real-time voice modulation engine.

🌐 **Live:** *(deploy this folder to GitHub Pages, Netlify, or Vercel — it's a static site with zero build step)*

## Stack

- Pure HTML + CSS + vanilla JS
- No build step, no framework, no dependencies
- ~74 KB total uncompressed
- Mobile-responsive
- Accessibility: respects `prefers-reduced-motion`

## Pages

| File           | Purpose                                                  |
| -------------- | -------------------------------------------------------- |
| `index.html`   | Landing — hero, features, system, testimonials, CTA      |
| `about.html`   | Origin story — manifesto, tech, timeline, values         |
| `download.html`| Platforms — Windows (live) / Android (soon), sysreq, FAQ |

## Run locally

```bash
# Any static file server works. Easiest:
python -m http.server 8765
# then open http://localhost:8765
```

## Animations

The site is built on a Neon Brutalist foundation. Animation features include:

- **Text scramble** — hero titles cycle through synonyms on load
- **Particle field** — neon dots drifting upward (canvas)
- **CRT scanlines** — fixed overlay for retro CRT feel
- **Custom cursor ring** — neon-pink ring follows the mouse with a lag
- **Magnetic buttons** — nav + CTAs lean toward the cursor
- **Scroll-reveal** — cards blur-in / slide-up as they enter the viewport
- **Animated counters** — stats count up with eased easing
- **Voice wall marquee** — infinite horizontal scroll of preset names
- **3D tilt** — feature/info cards tilt subtly on hover
- **Glitch RGB** — title shadows split into pink/cyan on hover
- **Glow pulse** — download card breathes a neon shadow
- **Easter egg** — type `voxforge` for rainbow borders + screen shake

All animations are gated by `prefers-reduced-motion`.

## Deploy

### GitHub Pages

1. Push to a GitHub repo
2. Settings → Pages → Source: `main` branch, `/` root
3. Done. URL: `https://<user>.github.io/<repo>/`

### Netlify / Vercel

Drag-and-drop the folder, or connect the repo. No build command needed.

## Structure

```
voxbattle-website/
├── index.html
├── about.html
├── download.html
├── css/
│   └── style.css       # All styles, ~37KB
├── js/
│   └── main.js         # All animations, ~14KB
├── assets/             # (legacy — unused, safe to delete)
└── .gitignore
```

## License

© 2026 Antigravity. All rights reserved.
