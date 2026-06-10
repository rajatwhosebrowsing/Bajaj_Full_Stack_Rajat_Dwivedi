import { useState } from "react";
import Head from "next/head";

const SAMPLE = `A->B, A->C, B->D, C->E, E->F
X->Y, Y->Z, Z->X
P->Q, Q->R
G->H, G->H, G->I
hello, 1->2, A->`;

function Node({ name, kids }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasKids = kids && Object.keys(kids).length > 0;
  return (
    <div className="node-wrap">
      <div
        className={`node-row ${hasKids ? "clickable" : ""}`}
        onClick={() => hasKids && setCollapsed(c => !c)}
      >
        {hasKids && <span className="caret">{collapsed ? "▸" : "▾"}</span>}
        {!hasKids && <span className="caret-placeholder" />}
        <span className={`node-dot ${hasKids ? "parent" : "leaf"}`}>{name}</span>
      </div>
      {hasKids && !collapsed && (
        <div className="kids">
          {Object.entries(kids).map(([k, v]) => <Node key={k} name={k} kids={v} />)}
        </div>
      )}
    </div>
  );
}

function HierarchyCard({ data, idx }) {
  const treeEntry = data.tree ? Object.entries(data.tree)[0] : null;
  const isCyclic = !!data.has_cycle;
  return (
    <div className={`card ${isCyclic ? "card-cycle" : "card-tree"}`}>
      <div className="card-top">
        <span className="card-num">#{idx + 1}</span>
        <span className="card-root">
          root <strong>{data.root}</strong>
        </span>
        {isCyclic
          ? <span className="badge badge-cycle">cycle detected</span>
          : <span className="badge badge-tree">depth {data.depth}</span>
        }
      </div>
      <div className="card-body">
        {treeEntry
          ? <Node name={treeEntry[0]} kids={treeEntry[1]} />
          : <span className="no-tree">All nodes form a cycle — no tree to display</span>
        }
      </div>
    </div>
  );
}

export default function App() {
  const [raw, setRaw] = useState(SAMPLE);
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function runQuery() {
    setErr(null);
    setData(null);
    setBusy(true);

    const edges = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

    try {
      const resp = await fetch("/api/graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edges }),
      });
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Server error");
      setData(json);
    } catch (e) {
      setErr(e.message || "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>Graph Analyser</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="shell">
        <nav>
          <div className="nav-inner">
            <div className="brand">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="4" r="3" fill="#7c6af7"/>
                <circle cx="4" cy="17" r="3" fill="#7c6af7"/>
                <circle cx="18" cy="17" r="3" fill="#7c6af7"/>
                <line x1="11" y1="7" x2="4" y2="14" stroke="#7c6af7" strokeWidth="1.5"/>
                <line x1="11" y1="7" x2="18" y2="14" stroke="#7c6af7" strokeWidth="1.5"/>
                <line x1="7" y1="17" x2="15" y2="17" stroke="#7c6af7" strokeWidth="1.5"/>
              </svg>
              Graph Analyser
            </div>
            <span className="nav-tag">SIT · Round 1</span>
          </div>
        </nav>

        <div className="page">
          <div className="left-col">
            <h1>Visualise node hierarchies</h1>
            <p className="subtext">
              Enter directed edges like <code>A-&gt;B</code>, separated by commas or newlines.
              The API detects trees, cycles, invalid entries, and duplicates.
            </p>

            <label className="field-label">Edges</label>
            <textarea
              value={raw}
              onChange={e => setRaw(e.target.value)}
              placeholder={"A->B, B->C\nX->Y, Y->Z"}
              spellCheck={false}
            />

            <button onClick={runQuery} disabled={busy} className="run-btn">
              {busy ? <><span className="spin" /> Analysing…</> : "Run →"}
            </button>

            {err && (
              <div className="err-banner">
                <b>Error</b> — {err}
              </div>
            )}

            {data && (
              <div className="meta-block">
                <div className="meta-row"><span>user_id</span><code>{data.user_id}</code></div>
                <div className="meta-row"><span>email</span><code>{data.email_id}</code></div>
                <div className="meta-row"><span>enrollment</span><code>{data.enrollment_number}</code></div>
              </div>
            )}
          </div>

          <div className="right-col">
            {!data && !busy && (
              <div className="empty-state">
                Results will appear here after you run the analysis.
              </div>
            )}

            {data && (
              <>
                <div className="stats-bar">
                  <div className="stat">
                    <div className="stat-n">{data.summary.total_trees}</div>
                    <div className="stat-l">Trees</div>
                  </div>
                  <div className="stat">
                    <div className="stat-n">{data.summary.total_cycles}</div>
                    <div className="stat-l">Cycles</div>
                  </div>
                  <div className="stat accent-stat">
                    <div className="stat-n">{data.summary.largest_tree_root ?? "—"}</div>
                    <div className="stat-l">Deepest root</div>
                  </div>
                </div>

                <div className="section-head">Hierarchies</div>
                <div className="cards-list">
                  {data.hierarchies.map((h, i) => (
                    <HierarchyCard key={i} data={h} idx={i} />
                  ))}
                </div>

                {(data.invalid_entries.length > 0 || data.duplicate_edges.length > 0) && (
                  <div className="issues">
                    {data.invalid_entries.length > 0 && (
                      <div className="issue-group">
                        <div className="issue-head red">Invalid ({data.invalid_entries.length})</div>
                        {data.invalid_entries.map((e, i) => <code key={i} className="pill red-pill">{e || '""'}</code>)}
                      </div>
                    )}
                    {data.duplicate_edges.length > 0 && (
                      <div className="issue-group">
                        <div className="issue-head amber">Duplicates ({data.duplicate_edges.length})</div>
                        {data.duplicate_edges.map((e, i) => <code key={i} className="pill amber-pill">{e}</code>)}
                      </div>
                    )}
                  </div>
                )}

                <div className="section-head">Raw response</div>
                <pre className="json-out">{JSON.stringify(data, null, 2)}</pre>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0b0c10;
          --panel: #13151c;
          --panel2: #1a1d28;
          --border: #252838;
          --purple: #7c6af7;
          --purple-dim: rgba(124,106,247,0.12);
          --green: #3fcf8e;
          --red: #f56565;
          --amber: #f6ad55;
          --txt: #dde2f0;
          --muted: #636b85;
          --mono: 'IBM Plex Mono', monospace;
          --sans: 'Sora', sans-serif;
          --r: 10px;
        }
        body { background: var(--bg); color: var(--txt); font-family: var(--sans); min-height: 100vh; }
        nav { border-bottom: 1px solid var(--border); background: rgba(11,12,16,0.9); backdrop-filter: blur(10px); position: sticky; top: 0; z-index: 50; }
        .nav-inner { max-width: 1200px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.95rem; }
        .nav-tag { font-size: 0.72rem; color: var(--muted); letter-spacing: 0.05em; }
        .page { max-width: 1200px; margin: 0 auto; padding: 40px 24px 80px; display: grid; grid-template-columns: 380px 1fr; gap: 40px; align-items: start; }
        .left-col h1 { font-size: 1.5rem; font-weight: 700; line-height: 1.3; margin-bottom: 10px; }
        .subtext { font-size: 0.85rem; color: var(--muted); line-height: 1.7; margin-bottom: 24px; }
        .subtext code { font-family: var(--mono); background: var(--panel2); padding: 1px 5px; border-radius: 4px; color: var(--purple); font-size: 0.8rem; }
        .field-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 600; display: block; margin-bottom: 8px; }
        textarea { width: 100%; height: 160px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r); color: var(--txt); font-family: var(--mono); font-size: 0.82rem; padding: 12px 14px; resize: vertical; outline: none; transition: border-color 0.2s; line-height: 1.6; }
        textarea:focus { border-color: var(--purple); }
        .run-btn { margin-top: 14px; background: var(--purple); color: #fff; border: none; border-radius: 8px; padding: 11px 26px; font-size: 0.88rem; font-weight: 600; font-family: var(--sans); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
        .run-btn:hover:not(:disabled) { opacity: 0.85; }
        .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .spin { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: rot 0.65s linear infinite; }
        @keyframes rot { to { transform: rotate(360deg); } }
        .err-banner { margin-top: 16px; background: rgba(245,101,101,0.08); border: 1px solid rgba(245,101,101,0.3); border-radius: 8px; padding: 12px 16px; font-size: 0.84rem; color: var(--red); }
        .meta-block { margin-top: 24px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--r); overflow: hidden; }
        .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 0.8rem; }
        .meta-row:last-child { border-bottom: none; }
        .meta-row span { color: var(--muted); }
        .meta-row code { font-family: var(--mono); color: var(--purple); font-size: 0.78rem; }
        .empty-state { margin-top: 60px; text-align: center; color: var(--muted); font-size: 0.88rem; }
        .stats-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 28px; }
        .stat { background: var(--panel); border: 1px solid var(--border); border-radius: var(--r); padding: 18px 14px; text-align: center; }
        .accent-stat { border-color: rgba(124,106,247,0.4); background: var(--purple-dim); }
        .stat-n { font-size: 1.8rem; font-weight: 700; line-height: 1; }
        .accent-stat .stat-n { color: var(--purple); }
        .stat-l { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em; color: var(--muted); margin-top: 5px; }
        .section-head { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); font-weight: 600; margin: 24px 0 10px; }
        .cards-list { display: flex; flex-direction: column; gap: 10px; }
        .card { background: var(--panel); border-radius: var(--r); overflow: hidden; border: 1px solid var(--border); }
        .card-cycle { border-color: rgba(246,173,85,0.3); }
        .card-top { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--border); }
        .card-num { font-size: 0.72rem; color: var(--muted); font-family: var(--mono); }
        .card-root { font-size: 0.86rem; flex: 1; }
        .card-root strong { color: var(--purple); }
        .badge { font-size: 0.68rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; }
        .badge-tree { background: rgba(63,207,142,0.1); color: var(--green); }
        .badge-cycle { background: rgba(246,173,85,0.1); color: var(--amber); }
        .card-body { padding: 12px 18px; }
        .no-tree { font-size: 0.82rem; color: var(--muted); font-style: italic; }
        .node-wrap { }
        .node-row { display: flex; align-items: center; gap: 5px; padding: 3px 0; }
        .node-row.clickable { cursor: pointer; }
        .caret { color: var(--muted); font-size: 0.7rem; width: 11px; flex-shrink: 0; }
        .caret-placeholder { width: 11px; flex-shrink: 0; }
        .node-dot { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; font-family: var(--mono); font-size: 0.78rem; font-weight: 600; border: 1px solid var(--border); background: var(--panel2); }
        .node-dot.parent { border-color: var(--purple); color: var(--purple); background: var(--purple-dim); }
        .node-dot.leaf { color: var(--muted); }
        .kids { margin-left: 18px; border-left: 1px dashed var(--border); padding-left: 12px; }
        .issues { margin-top: 6px; display: flex; flex-direction: column; gap: 10px; }
        .issue-group { background: var(--panel); border-radius: var(--r); padding: 12px 16px; }
        .issue-head { font-size: 0.75rem; font-weight: 600; margin-bottom: 8px; }
        .red { color: var(--red); border: 1px solid rgba(245,101,101,0.2); }
        .issue-group.red { border: 1px solid rgba(245,101,101,0.2); }
        .issue-group .red { color: var(--red); }
        .amber { color: var(--amber); }
        .issue-group .amber { color: var(--amber); }
        .issue-group:has(.amber) { border: 1px solid rgba(246,173,85,0.2); }
        .pill { font-family: var(--mono); font-size: 0.76rem; padding: 2px 7px; border-radius: 4px; margin: 2px; display: inline-block; }
        .red-pill { background: rgba(245,101,101,0.1); color: var(--red); }
        .amber-pill { background: rgba(246,173,85,0.1); color: var(--amber); }
        .json-out { background: #0d0f16; border: 1px solid var(--border); border-radius: var(--r); padding: 16px; font-family: var(--mono); font-size: 0.76rem; color: var(--muted); overflow-x: auto; white-space: pre; line-height: 1.7; }
        @media (max-width: 768px) {
          .page { grid-template-columns: 1fr; }
          .stats-bar { grid-template-columns: repeat(3, 1fr); }
          .nav-tag { display: none; }
        }
      `}</style>
    </>
  );
}
