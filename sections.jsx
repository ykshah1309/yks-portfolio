// Sections — read from window.PORTFOLIO

const P = () => window.PORTFOLIO;

function useReveal() {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  return ref;
}

// Animated count-up. Only triggers when the element enters the viewport.
function CountUp({ to, suffix = "", duration = 1400, format = (n) => n.toLocaleString() }) {
  const [val, setVal] = React.useState(0);
  const ref = React.useRef(null);
  const startedRef = React.useRef(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const t0 = performance.now();
          const tick = (t) => {
            const p = Math.min(1, (t - t0) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{format(val)}{suffix}</span>;
}

function Nav() {
  return (
    <header className="nav">
      <div className="nav-inner">
        <a href="#top" className="nav-brand">
          <span className="glyph">y</span>
          <span>yash.shah / portfolio · v2026</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="#avarieux">Avarieux</a>
          <a href="#open-source">Open Source</a>
          <a href="#sandbox">Sandbox</a>
          <a href="#research">Research</a>
          <a href="#speaking">Speaking</a>
          <a href="#experience">Experience</a>
        </nav>
        <a href="#contact" className="nav-cta">
          <span className="dot" />
          <span>Get in touch</span>
        </a>
      </div>
    </header>
  );
}

function Hero() {
  const p = P();
  const ref = useReveal();
  return (
    <section id="top" className="hero" data-screen-label="Hero" ref={ref}>
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-meta reveal">
              <span className="pill"><span className="dot" /> Avarieux out of stealth · May 20, 2026</span>
              <span>{p.location}</span>
            </div>
            <h1 className="reveal">
              Structurally <em>honest</em><br/>
              AI for regulated<br/>
              finance.
            </h1>
            <p className="hero-sub reveal">
              I'm <strong>{p.name}</strong> — <strong>Founder & CEO of Avarieux Inc.</strong>, a multi-source AI research platform for self-directed investors and registered investment advisors. Every numeric claim audited against its source before delivery; every analysis archived as a permanent, citable URL. M.S. Data Science, NJIT · Ying Wu College of Computing.
            </p>
            <div className="hero-actions reveal">
              <a href={p.social.avarieuxSite.href} target="_blank" rel="noopener" className="btn btn-primary">
                <span>Visit avarieux.com</span><span className="arr">→</span>
              </a>
              <a href="#sandbox" className="btn btn-ghost">
                <span>Try the MCP sandbox</span><span className="arr">→</span>
              </a>
            </div>
          </div>
          <div className="hero-card reveal">
            <div className="hero-portrait">
              <image-slot id="hero-portrait" shape="rect" placeholder="Drop a headshot — 4:5 portrait"></image-slot>
            </div>
            <div className="hero-caption">
              <span>Yash Kamlesh Shah</span>
              <span>Founder & CEO · Avarieux</span>
            </div>
          </div>
        </div>

        <div className="hero-marquee reveal">
          {p.metrics.map((m, i) => (
            <div key={i} className="metric">
              <div className="v">
                <CountUp to={m.v} suffix={m.suffix} />
              </div>
              <div className="l">{m.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- Animated provenance schematic ----------
function ProvenanceFlow({ schema }) {
  const [stage, setStage] = React.useState(-1);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let interval;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          // step through the pipeline forever while in view
          let i = 0;
          setStage(0);
          interval = setInterval(() => {
            i = (i + 1) % (schema.length + 1);
            setStage(i === schema.length ? -1 : i);
          }, 1200);
        } else {
          if (interval) clearInterval(interval);
          interval = null;
        }
      });
    }, { threshold: 0.35 });
    io.observe(el);
    return () => { if (interval) clearInterval(interval); io.disconnect(); };
  }, [schema.length]);

  return (
    <div className="av-schema reveal" ref={ref}>
      {schema.map((s, i) => {
        const isActive = stage === i;
        const wasActive = stage > i;
        return (
          <React.Fragment key={i}>
            <div className={'node ' + (s.hi ? 'hi ' : '') + (isActive ? 'active ' : '') + (wasActive ? 'done' : '')}>
              <div className="lbl">{String(i + 1).padStart(2, '0')} · {s.lbl}</div>
              <div className="val">{s.val}</div>
              {s.hi && <div className="node-stamp">{s.lbl === "Retrieve" ? "+ citation" : "✓ audited"}</div>}
            </div>
            {i < schema.length - 1 && (
              <div className={'conn ' + (stage > i ? 'lit' : '')}><span /></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Avarieux() {
  const p = P().avarieux;
  const ref = useReveal();
  return (
    <section id="avarieux" className="avarieux" data-screen-label="Avarieux" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Featured · 01</div>
          <h2 className="section-title reveal">Avarieux — <em>structurally honest</em> AI, by construction.</h2>
        </div>

        <div className="av-grid">
          <div>
            <p className="av-lede reveal">{p.lede}</p>
            <div className="av-stamps reveal">
              <span>{p.incorporated}</span>
              <span>·</span>
              <span>{p.publicSince}</span>
            </div>
          </div>
          <div className="av-pillars">
            {p.pillars.map((pi, i) => (
              <div key={i} className="pillar reveal">
                <div className="n">{pi.n}</div>
                <div>
                  <h4>{pi.h}</h4>
                  <p>{pi.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ProvenanceFlow schema={p.schema} />

        <LiveArchive samples={P().archiveSamples} />

        <div className="av-foot reveal">
          <a href={P().social.avarieuxSite.href} target="_blank" rel="noopener" className="btn btn-primary"><span>Visit avarieux.com</span><span className="arr">→</span></a>
          <a href={P().social.avarieuxTwitter.href} target="_blank" rel="noopener" className="btn btn-ghost"><span>{P().social.avarieuxTwitter.label}</span><span className="arr">→</span></a>
          <a href={P().social.avarieuxLinkedin.href} target="_blank" rel="noopener" className="btn btn-ghost"><span>Avarieux on LinkedIn</span><span className="arr">→</span></a>
        </div>
      </div>
    </section>
  );
}

// ---------- Live archive ticker ----------
function LiveArchive({ samples }) {
  // duplicate the array so the marquee can loop seamlessly
  const list = [...samples, ...samples];
  return (
    <div className="live-archive reveal" aria-label="Sample archive entries">
      <div className="la-head">
        <span className="la-eyebrow">Live archive · sample timestamps</span>
        <span className="la-pulse"><span className="d" /> writing</span>
      </div>
      <div className="la-track">
        <div className="la-row">
          {list.map((s, i) => (
            <div className="la-entry" key={i}>
              <span className="la-time">{s.when}</span>
              <span className="la-co">{s.co}</span>
              <span className="la-url">{s.url}</span>
              <span className="la-claim">— {s.claim}</span>
              <span className="la-tag">✓ audited</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpenSource() {
  const p = P();
  const ref = useReveal();
  return (
    <section id="open-source" data-screen-label="Open Source" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Open Source · 02</div>
          <h2 className="section-title reveal">Four MCP servers, <em>~10,700</em> lines, in production.</h2>
        </div>

        <div className="os-grid reveal">
          {p.repos.map((r, i) => (
            <article key={i} className="repo">
              <a className="repo-top" href={r.href} target="_blank" rel="noopener">
                <div className="repo-name">
                  <span>{r.name}</span>
                  <span className="arr">↗</span>
                </div>
                <span className="repo-tag">● {r.lang}</span>
              </a>
              <p className="repo-desc">{r.desc}</p>
              <div className="repo-foot">
                <span className="repo-sample">try → <code>{r.sample}</code></span>
                <a href="#sandbox" className="repo-try">open in sandbox →</a>
              </div>
            </article>
          ))}
        </div>

        <div className="os-registries reveal">
          <span className="lbl">Cited in</span>
          {p.registries.map((r, i) => (
            <span key={i} className="chip"><span className="d" />{r}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Research() {
  const p = P();
  const ref = useReveal();
  return (
    <section id="research" data-screen-label="Research" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Research · 04</div>
          <h2 className="section-title reveal">Peer-reviewed <em>publication</em>.</h2>
        </div>

        <div className="pub-list reveal">
          {p.publications.map((pub, i) => (
            <a href={pub.href} target="_blank" rel="noopener" key={i} className="pub">
              <div className="pub-yr">{pub.yr}</div>
              <div className="pub-body">
                <div className="pub-title">{pub.title}</div>
                <div className="pub-venue">
                  {pub.venue.map((v, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <span className="sep">/</span>}
                      <span>{v}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              <div className="pub-arr">read →</div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function Speaking() {
  const p = P();
  const ref = useReveal();
  return (
    <section id="speaking" data-screen-label="Speaking" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Speaking · 05</div>
          <h2 className="section-title reveal">Upcoming <em>stage</em>.</h2>
        </div>

        <div className="speak-grid reveal single">
          {p.talks.map((t, i) => (
            <article key={i} className="talk featured">
              <div className="talk-head">
                <span className="talk-when">{t.when}</span>
                <span className={'talk-status ' + t.status}>● Confirmed</span>
              </div>
              <div className="talk-venue">{t.venue}</div>
              <div className="talk-topic">{t.topic}</div>
              <div className="talk-loc">{t.loc}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Experience() {
  const p = P();
  const ref = useReveal();
  return (
    <section id="experience" data-screen-label="Experience" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Experience · 06</div>
          <h2 className="section-title reveal">Professional <em>arc</em>.</h2>
        </div>

        <div className="tl reveal">
          {p.experience.map((e, i) => (
            <div key={i} className={'tl-item ' + (e.now ? 'now' : '')}>
              <div>
                <div className="tl-role">{e.role}</div>
                <div className="tl-co">{e.co}</div>
                <div className="tl-detail">{e.detail}</div>
              </div>
              <div className="tl-when">{e.when}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Education() {
  const e = P().edu;
  const ref = useReveal();
  return (
    <section id="education" data-screen-label="Education" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Education · 07</div>
          <h2 className="section-title reveal">Academic <em>foundation</em>.</h2>
        </div>
        <div className="edu-card reveal">
          <div>
            <h3><em>M.S.</em> Data Science, {e.school}</h3>
            <div className="meta">
              <span>{e.college}</span>
              <span>·</span>
              <span>{e.when}</span>
              <span>·</span>
              <span>CGPA {e.gpa}</span>
            </div>
          </div>
          <div className="crest">{e.crest}</div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const p = P();
  const ref = useReveal();
  const links = [
    { k: "Email", v: p.email, href: "mailto:" + p.email },
    { k: "GitHub", v: p.social.github.label, href: p.social.github.href },
    { k: "LinkedIn (personal)", v: p.social.linkedin.label, href: p.social.linkedin.href },
    { k: "Avarieux on Twitter", v: p.social.avarieuxTwitter.label, href: p.social.avarieuxTwitter.href },
    { k: "Avarieux on LinkedIn", v: "linkedin.com/company/avarieux", href: p.social.avarieuxLinkedin.href },
    { k: "Avarieux", v: p.social.avarieuxSite.label, href: p.social.avarieuxSite.href },
  ];
  return (
    <section id="contact" className="contact" data-screen-label="Contact" ref={ref}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Contact · 08</div>
        </div>
        <h2 className="reveal">Let's build something <em>honest</em>.</h2>

        <div className="contact-grid">
          <div className="contact-links reveal">
            {links.map((l, i) => (
              <a key={i} href={l.href} target="_blank" rel="noopener" className="clink">
                <div className="clink-k">{String(i + 1).padStart(2, '0')} · {l.k}</div>
                <div className="clink-row">
                  <span className="clink-v">{l.v}</span>
                  <span className="clink-arr">→</span>
                </div>
              </a>
            ))}
          </div>
          <div className="reveal contact-aside" style={{fontFamily: 'var(--f-mono)', fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,.6)', maxWidth: '38ch'}}>
            <div style={{color: 'var(--paper)', marginBottom: 10, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10.5}}>Open to</div>
            · Inbound on Avarieux (self-directed investors, RIAs)<br/>
            · Pilots with compliance / risk teams<br/>
            · MCP collaborations &amp; tool integrations<br/>
            · Speaking on protocol-layer AI<br/>
            <div style={{color: 'var(--paper)', marginTop: 18, marginBottom: 10, letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 10.5}}>Direct</div>
            {p.email}
          </div>
        </div>

        <div className="foot">
          <span>© 2026 · {p.name} · Avarieux Inc.</span>
          <span>Designed &amp; built in HTML</span>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Nav, Hero, Avarieux, OpenSource, Research, Speaking, Experience, Education, Contact, useReveal });
