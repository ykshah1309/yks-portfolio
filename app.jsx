// App — composes sections, applies Tweaks (theme/accent/serif accent on/off).

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "ink",
  "accent": "#4f8a78",
  "serifAccent": true,
  "density": "regular"
}/*EDITMODE-END*/;

const THEMES = {
  ink: {
    label: "Ink (default)",
    "--paper": "#F4F1EA",
    "--paper-2": "#ECE6DA",
    "--paper-rule": "#d8d1c1",
    "--ink": "#0B1220",
    "--ink-2": "#131c2e",
    "--text": "#14202F",
    "--text-mute": "#5a6477",
    "--text-faint": "#8c93a4",
    "--rule": "rgba(20,32,47,0.12)",
  },
  graphite: {
    label: "Graphite",
    "--paper": "#EEEFF1",
    "--paper-2": "#E4E6EA",
    "--paper-rule": "#cfd2d8",
    "--ink": "#16181D",
    "--ink-2": "#1f2229",
    "--text": "#1a1d23",
    "--text-mute": "#5e636d",
    "--text-faint": "#8a8f99",
    "--rule": "rgba(22,24,29,0.12)",
  },
  bone: {
    label: "Bone",
    "--paper": "#F8F5EE",
    "--paper-2": "#EFEADD",
    "--paper-rule": "#d8d0bb",
    "--ink": "#1c1814",
    "--ink-2": "#26211b",
    "--text": "#1c1814",
    "--text-mute": "#6b6258",
    "--text-faint": "#9a9388",
    "--rule": "rgba(28,24,20,0.14)",
  },
  midnight: {
    label: "Midnight",
    "--paper": "#0E141F",
    "--paper-2": "#141b29",
    "--paper-rule": "#1f273a",
    "--ink": "#06080D",
    "--ink-2": "#0c1018",
    "--text": "#E6E9F0",
    "--text-mute": "#8993a8",
    "--text-faint": "#5c6478",
    "--rule": "rgba(255,255,255,0.10)",
  },
};

const ACCENTS = ["#4f8a78", "#3c7dc0", "#b89762", "#8a6cd6", "#cc6a4a"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const ref = React.useRef(null);

  // ── Viewport adapter ──────────────────────────────────────────────
  // Classifies the device into a 'profile' (phone / portrait / tablet /
  // desktop / wide / ultrawide) based on width + aspect ratio, and
  // exposes it on <body data-profile=…> for CSS to react to. Also sets
  // a CSS var --vh that respects mobile dynamic-viewport quirks so we
  // never get the iOS-Safari 100vh overflow bug.
  React.useEffect(() => {
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const ar = w / Math.max(h, 1);
      let profile = 'desktop';
      if (w < 560) profile = 'phone';
      else if (w < 820) profile = ar < 1 ? 'portrait' : 'tablet';
      else if (w < 1200) profile = 'tablet';
      else if (ar >= 2.2) profile = 'ultrawide';
      else if (ar >= 1.85) profile = 'wide';
      else profile = 'desktop';
      const orientation = ar < 1 ? 'portrait' : 'landscape';
      document.body.dataset.profile = profile;
      document.body.dataset.orient = orientation;
      const root = document.documentElement;
      root.style.setProperty('--vh', h + 'px');
      root.style.setProperty('--vw', w + 'px');
      root.style.setProperty('--ar', ar.toFixed(3));
      // Density nudge for phones (smaller body, denser line-height already
      // handled by clamp() — but cap hero h1 to fit super-narrow screens).
      root.style.setProperty(
        '--hero-cap',
        profile === 'phone' ? '54px' : profile === 'portrait' ? '72px' : 'unset'
      );
    };
    apply();
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(apply);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', apply);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', apply);
    };
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES[t.theme] || THEMES.ink;
    Object.entries(theme).forEach(([k, v]) => {
      if (k.startsWith('--')) root.style.setProperty(k, v);
    });
    // accent + its dark-bg variant
    root.style.setProperty('--accent', t.accent);
    // lighten accent for use on dark surfaces (Avarieux / Contact / Midnight theme)
    root.style.setProperty('--accent-ink', shift(t.accent, 0.18));
    document.body.dataset.serifAccent = t.serifAccent ? "on" : "off";
    document.body.dataset.theme = t.theme;
  }, [t.theme, t.accent, t.serifAccent]);

  return (
    <div ref={ref}>
      <Nav />
      <main>
        <Hero />
        <Avarieux />
        <OpenSource />
        <Sandbox />
        <Research />
        <Speaking />
        <Experience />
        <Education />
        <Contact />
      </main>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Surface"
          value={t.theme}
          options={['ink', 'graphite', 'bone', 'midnight']}
          onChange={(v) => setTweak('theme', v)}
        />
        <TweakColor
          label="Accent"
          value={t.accent}
          options={ACCENTS}
          onChange={(v) => setTweak('accent', v)}
        />

        <TweakSection label="Typography" />
        <TweakToggle
          label="Serif italic accents"
          value={t.serifAccent}
          onChange={(v) => setTweak('serifAccent', v)}
        />
      </TweaksPanel>
    </div>
  );
}

// quick hex lighten by amount (0..1) toward white
function shift(hex, amt) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const mix = (c) => Math.round(c + (255 - c) * amt);
  const to = (n) => n.toString(16).padStart(2, '0');
  return '#' + to(mix(r)) + to(mix(g)) + to(mix(b));
}

// Apply serif-accent toggle globally — when off, swap <em> in headings to inherit
const styleEl = document.createElement('style');
styleEl.textContent = `
body[data-serif-accent="off"] .hero h1 em,
body[data-serif-accent="off"] .section-title em,
body[data-serif-accent="off"] .av-lede em,
body[data-serif-accent="off"] .contact h2 em,
body[data-serif-accent="off"] .edu-card h3 em,
body[data-serif-accent="off"] .metric .v em {
  font-family: var(--f-sans) !important;
  font-style: normal !important;
  font-weight: 500 !important;
}
body[data-theme="midnight"] {
  background: var(--paper);
  color: var(--text);
}
body[data-theme="midnight"] .nav { background: color-mix(in oklab, var(--paper) 80%, transparent); }
body[data-theme="midnight"] .repo, body[data-theme="midnight"] .talk { background: var(--paper-2); }
body[data-theme="midnight"] .repo:hover, body[data-theme="midnight"] .talk:hover { background: color-mix(in oklab, var(--paper-2) 80%, white 6%); }
body[data-theme="midnight"] .edu-card { background: var(--paper-2); }
body[data-theme="midnight"] .btn-ghost { color: var(--text); }
body[data-theme="midnight"] ::selection { background: color-mix(in oklab, var(--accent) 40%, var(--paper)); color: var(--text); }
body[data-theme="midnight"] .glyph { background: var(--text); color: var(--paper); }
`;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
