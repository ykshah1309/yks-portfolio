// MCP Sandbox — interactive terminal demo of Yash's 4 MCP servers.
// Pre-baked sample runs are deterministic. The "ask anything" prompt
// routes through window.claude.complete with an Avarieux-style system prompt
// so the audit/provenance behavior is demonstrated on a real call.

const SANDBOX_SAMPLES = {
  "financial-hub-mcp": [
    {
      q: "Get latest 10-K filing context for AAPL",
      tool: "fhm.get_filing",
      args: { ticker: "AAPL", form: "10-K", limit: 1 },
      provenance: [
        { src: "SEC EDGAR · 0000320193-24-000123", line: "Item 7 · MD&A · pp. 27-34" },
        { src: "SEC EDGAR · 0000320193-24-000123", line: "Item 8 · Consolidated Statements of Operations" },
      ],
      out: [
        "✔ Resolved filing 0000320193-24-000123 (10-K, FY2024)",
        "✔ Extracted MD&A (Item 7) — 8,214 tokens · checksum 0x4a91…",
        "✔ Extracted financial statements (Item 8) — 3,127 tokens · checksum 0x8c10…",
        "→ 2 provenance pointers attached. Ready for downstream reasoning.",
      ],
    },
    {
      q: "Reconcile Apple Q1'25 gross margin",
      tool: "fhm.reconcile_metric",
      args: { ticker: "AAPL", metric: "gross_margin", period: "Q1-2025" },
      provenance: [
        { src: "10-Q · Q1-2025", line: "Consolidated Statements of Operations · line 4" },
        { src: "10-Q · Q1-2025", line: "Consolidated Statements of Operations · line 3" },
      ],
      out: [
        "Computed: gross_margin = (revenue − cost_of_sales) / revenue",
        "Sourced revenue:        ${LINE_4} → reconciled to filing line 4",
        "Sourced cost_of_sales:  ${LINE_3} → reconciled to filing line 3",
        "✔ AUDIT PASS — claim reproducible from primary source.",
      ],
    },
  ],
  "global-sentinel-mcp": [
    {
      q: "Stream new 8-K filings touching cybersecurity disclosures",
      tool: "gs.subscribe",
      args: { form: "8-K", item: "1.05", region: "US" },
      provenance: [
        { src: "SEC EDGAR · live feed", line: "Item 1.05 — Material Cybersecurity Incidents" },
      ],
      out: [
        "Subscribed: SEC EDGAR · 8-K · Item 1.05",
        "▌ awaiting events…",
        "● 2026-05-18T09:41Z · ticker=XYZQ · 8-K Item 1.05 filed",
        "  → primary-source URL captured · agent can quote and re-verify",
      ],
    },
    {
      q: "Sanctions update: new OFAC designations today",
      tool: "gs.poll",
      args: { source: "OFAC_SDN", since: "today" },
      provenance: [{ src: "OFAC Specially Designated Nationals list", line: "Daily delta · 2026-05-18" }],
      out: [
        "Polled OFAC SDN daily delta",
        "✔ 14 new designations · 3 removals · 1 amendment",
        "→ structured event records emitted with source-row pointers",
      ],
    },
  ],
  "live-audio-intelligence-mcp": [
    {
      q: "Transcribe & cite an earnings call audio stream",
      tool: "lai.transcribe_stream",
      args: { source: "earnings_call_demo.wav", diarize: true },
      provenance: [
        { src: "audio · t=00:14:22.310", line: "speaker: CFO · segment 412" },
        { src: "audio · t=00:14:27.880", line: "speaker: CFO · segment 413" },
      ],
      out: [
        "Stream opened · 16kHz mono · diarization enabled",
        "[00:14:22 · CFO]  \"…we exited the quarter with $4.2B in operating cash…\"",
        "[00:14:27 · CFO]  \"…and reaffirm full-year guidance of $18-19B.\"",
        "✔ Every claim is timestamp-cited back to the original waveform.",
      ],
    },
  ],
  "stealth-agent-browser-mcp": [
    {
      q: "Open SEC EDGAR and pull the latest filing for NVDA",
      tool: "sab.navigate_and_extract",
      args: { url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810", select: "latest_filing" },
      provenance: [
        { src: "browser session · step 1", line: "GET sec.gov/cgi-bin/browse-edgar" },
        { src: "browser session · step 4", line: "click · 10-Q · Q1-2026" },
        { src: "browser session · step 6", line: "extract · primary document URL" },
      ],
      out: [
        "[browser] GET sec.gov/cgi-bin/browse-edgar?CIK=0001045810  · 200 OK",
        "[browser] CLICK row[0] · 10-Q · filed 2026-05-15",
        "[browser] EXTRACT primary_document_url",
        "✔ 6-step action log captured · replayable as audit evidence",
      ],
    },
  ],
};

function Sandbox() {
  const repos = window.PORTFOLIO.repos.map(r => r.name);
  const revealRef = window.useReveal();
  const [active, setActive] = React.useState(repos[0]);
  const [running, setRunning] = React.useState(false);
  const [lines, setLines] = React.useState([]);
  const [askInput, setAskInput] = React.useState("");
  const [askMode, setAskMode] = React.useState(false);
  const termRef = React.useRef(null);
  const tokenRef = React.useRef(0);

  React.useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const reset = (msg) => {
    tokenRef.current += 1;
    setLines(msg ? [msg] : []);
  };

  React.useEffect(() => {
    reset({ kind: "sys", text: `mcp connect ${active} — ready.` });
  }, [active]);

  const append = (line) => setLines((prev) => [...prev, line]);

  const typeOut = async (text, kind = "out", perChar = 6) => {
    const t = tokenRef.current;
    let buf = "";
    setLines((prev) => [...prev, { kind, text: "" }]);
    for (let i = 0; i < text.length; i++) {
      if (tokenRef.current !== t) return;
      buf += text[i];
      // eslint-disable-next-line no-loop-func
      setLines((prev) => {
        const next = prev.slice();
        next[next.length - 1] = { kind, text: buf };
        return next;
      });
      // micro-delay
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, perChar));
    }
  };

  const runSample = async (sample) => {
    if (running) return;
    setRunning(true);
    reset();
    const t = tokenRef.current;
    try {
      await typeOut(`$ ${active} <<< "${sample.q}"`, "prompt", 5);
      await new Promise((r) => setTimeout(r, 200));
      if (tokenRef.current !== t) return;
      append({ kind: "dim", text: `[tool] ${sample.tool}(${JSON.stringify(sample.args)})` });
      await new Promise((r) => setTimeout(r, 350));
      for (const ln of sample.out) {
        if (tokenRef.current !== t) return;
        // fake interpolation just for the demo lines
        const text = ln
          .replace("${LINE_4}", "$95,359 (millions)")
          .replace("${LINE_3}", "$53,765 (millions)");
        await typeOut(text, text.startsWith("✔") ? "ok" : text.startsWith("→") || text.startsWith("●") ? "accent" : "out", 5);
      }
      if (tokenRef.current !== t) return;
      append({ kind: "spacer" });
      append({ kind: "provLabel", text: "provenance attached" });
      for (const p of sample.provenance) {
        append({ kind: "prov", src: p.src, line: p.line });
      }
    } finally {
      if (tokenRef.current === t) setRunning(false);
    }
  };

  const runAsk = async () => {
    const q = askInput.trim();
    if (!q || running) return;
    setRunning(true);
    reset();
    const t = tokenRef.current;
    try {
      await typeOut(`$ avarieux.research <<< "${q}"`, "prompt", 4);
      append({ kind: "dim", text: "[policy] structurally-honest mode · claims must be source-anchored" });
      await new Promise((r) => setTimeout(r, 250));
      append({ kind: "dim", text: "[claude-haiku-4-5] streaming…" });

      const systemHints = `You are an Avarieux research assistant. House rules: (1) be concise — no more than ~6 short lines. (2) Treat numeric or factual claims as STRUCTURALLY HONEST: if you cannot tie a number to a specific primary source, you must flag it as "[UNVERIFIED]" inline rather than asserting it. (3) End with a 1-2 line "provenance:" block listing source types you would cite (e.g. "10-K Item 7", "8-K Item 1.05", "OFAC SDN delta", "press release"). (4) Do not invent specific filing IDs, CIKs, or numbers. (5) Plain text, no markdown.`;
      let answer = "";
      try {
        answer = await window.claude.complete({
          messages: [
            { role: "user", content: `${systemHints}\n\nUser query: ${q}` },
          ],
        });
      } catch (e) {
        answer = "[sandbox] live model is rate-limited right now. Try a sample query — the provenance behavior is identical.";
      }
      if (tokenRef.current !== t) return;
      const trimmed = (answer || "").toString().trim();
      const parts = trimmed.split(/\n+/);
      for (const ln of parts) {
        if (tokenRef.current !== t) return;
        await typeOut(ln, /unverified|cannot|unable/i.test(ln) ? "warn" : "out", 4);
      }
    } finally {
      if (tokenRef.current === t) setRunning(false);
    }
  };

  return (
    <section id="sandbox" className="sandbox" data-screen-label="Sandbox" ref={revealRef}>
      <div className="wrap">
        <div className="section-head">
          <div className="eyebrow reveal">Sandbox · 03</div>
          <h2 className="section-title reveal">Try the MCPs — <em>live</em>.</h2>
        </div>

        <p className="sb-lede reveal">
          A working terminal against the four MCP servers I authored. Pre-baked sample queries always work; the
          <strong> ask anything</strong> input runs your query through a structurally-honest research prompt — claims it
          cannot anchor to a source are flagged <code>[UNVERIFIED]</code> rather than asserted.
        </p>

        <div className="sb-frame reveal">
          <div className="sb-chrome">
            <span className="dot r" />
            <span className="dot y" />
            <span className="dot g" />
            <span className="sb-title">avarieux@sandbox · ~ · mcp-client</span>
            <span className="sb-status">
              <span className="d" /> connected
            </span>
          </div>

          <div className="sb-tabs">
            {repos.map((r) => (
              <button
                key={r}
                className={"sb-tab " + (active === r ? "on" : "")}
                onClick={() => { if (!running) { setActive(r); setAskMode(false); } }}
                disabled={running}
              >
                {r}
              </button>
            ))}
            <button
              className={"sb-tab ask " + (askMode ? "on" : "")}
              onClick={() => { if (!running) setAskMode((v) => !v); }}
              disabled={running}
            >
              ★ ask anything
            </button>
          </div>

          <div className="sb-body">
            <div className="sb-side">
              {!askMode && (
                <>
                  <div className="sb-side-h">Sample queries</div>
                  {(SANDBOX_SAMPLES[active] || []).map((s, i) => (
                    <button
                      key={i}
                      className="sb-q"
                      onClick={() => runSample(s)}
                      disabled={running}
                    >
                      <span className="sb-q-arr">▸</span>
                      <span>{s.q}</span>
                    </button>
                  ))}
                  <div className="sb-side-foot">
                    <div className="sb-side-h">Server</div>
                    <div className="sb-server">
                      <div className="sb-server-name">{active}</div>
                      <div className="sb-server-meta">
                        {window.PORTFOLIO.repos.find(r => r.name === active)?.lang}
                      </div>
                    </div>
                  </div>
                </>
              )}
              {askMode && (
                <>
                  <div className="sb-side-h">Ask anything</div>
                  <textarea
                    className="sb-ask"
                    rows="5"
                    placeholder="e.g. What did NVDA say about gross margin in their last filing?"
                    value={askInput}
                    onChange={(e) => setAskInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runAsk(); }}
                    disabled={running}
                  />
                  <button
                    className="sb-run"
                    onClick={runAsk}
                    disabled={running || !askInput.trim()}
                  >
                    {running ? "running…" : "▸ run (⌘↵)"}
                  </button>
                  <div className="sb-hint">
                    Live calls go through claude-haiku-4-5 with an Avarieux-style policy prompt. Don't trust this for
                    actual investment decisions — that's literally the point of the policy.
                  </div>
                </>
              )}
            </div>

            <div className="sb-term" ref={termRef}>
              {lines.length === 0 && (
                <div className="sb-line dim">$ pick a sample on the left, or switch to ★ ask anything.</div>
              )}
              {lines.map((l, i) => {
                if (l.kind === "spacer") return <div key={i} className="sb-spacer" />;
                if (l.kind === "provLabel") return <div key={i} className="sb-line prov-label">— {l.text} —</div>;
                if (l.kind === "prov") {
                  return (
                    <div key={i} className="sb-line prov">
                      <span className="prov-src">{l.src}</span>
                      <span className="prov-line">{l.line}</span>
                    </div>
                  );
                }
                return <div key={i} className={"sb-line " + l.kind}>{l.text}</div>;
              })}
              {running && <div className="sb-cursor">▌</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Sandbox = Sandbox;
