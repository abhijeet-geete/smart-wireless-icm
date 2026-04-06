import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  .about-root {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #f8fafc;
    color: #1e293b;
    min-height: 100vh;
    font-size: 14px;
  }

  .about-header {
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 56px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .about-header-left { display: flex; align-items: center; gap: 16px; }
  .brand { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; }
  .brand span { color: #1a56db; }
  .header-badge {
    background: #eff6ff; color: #1a56db; border: 1px solid #bfdbfe;
    border-radius: 4px; padding: 3px 10px; font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
  }
  .back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: 1px solid #e2e8f0; color: #64748b;
    padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .back-btn:hover { background: #f1f5f9; color: #1e293b; border-color: #cbd5e1; }

  .hero { background: #fff; border-bottom: 1px solid #e2e8f0; padding: 48px 32px 40px; }
  .hero-inner { max-width: 860px; }
  .hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 100px;
    padding: 4px 14px; font-size: 11px; font-weight: 600; color: #1a56db;
    letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 20px;
  }
  .pulse { width: 6px; height: 6px; background: #1a56db; border-radius: 50%; animation: blink 2s ease-in-out infinite; }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .hero h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.5px; margin: 0 0 16px; color: #0f172a; line-height: 1.2; }
  .hero h1 .accent { color: #1a56db; }
  .hero-sub { font-size: 15px; color: #64748b; line-height: 1.7; max-width: 680px; margin: 0 0 28px; }
  .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .tech-tag {
    font-family: 'JetBrains Mono', monospace; font-size: 11px;
    padding: 4px 10px; border-radius: 4px; border: 1px solid #e2e8f0; color: #475569; background: #f8fafc; font-weight: 500;
  }
  .tech-tag.blue { border-color: #bfdbfe; color: #1a56db; background: #eff6ff; }
  .tech-tag.green { border-color: #bbf7d0; color: #16a34a; background: #f0fdf4; }
  .tech-tag.amber { border-color: #fde68a; color: #d97706; background: #fffbeb; }
  .tech-tag.purple { border-color: #ddd6fe; color: #7c3aed; background: #f5f3ff; }

  .nav-tabs {
    background: #fff; border-bottom: 1px solid #e2e8f0; padding: 0 32px;
    display: flex; gap: 0; overflow-x: auto; position: sticky; top: 56px; z-index: 99;
  }
  .nav-tab {
    padding: 14px 20px; font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer;
    border-bottom: 2px solid transparent; border-top: none; border-left: none; border-right: none;
    background: none; white-space: nowrap; transition: all 0.15s; font-family: inherit;
  }
  .nav-tab:hover { color: #1e293b; }
  .nav-tab.active { color: #1a56db; border-bottom-color: #1a56db; font-weight: 600; }

  .content { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
  .section { margin-bottom: 56px; }
  .section-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #1a56db; margin-bottom: 8px; }
  .section-title { font-size: 22px; font-weight: 700; letter-spacing: -0.3px; color: #0f172a; margin: 0 0 8px; }
  .section-desc { font-size: 14px; color: #64748b; line-height: 1.7; max-width: 720px; margin: 0 0 24px; }

  .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; transition: all 0.15s; }
  .card:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(26,86,219,0.06); transform: translateY(-1px); }
  .card-icon { font-size: 22px; margin-bottom: 10px; }
  .card h3 { font-size: 13px; font-weight: 600; margin: 0 0 6px; color: #0f172a; }
  .card p { font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; }
  .card .why { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; line-height: 1.5; }
  .card .why strong { color: #1a56db; font-weight: 600; }

  .arch-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
  .arch-box-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 14px 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
  .arch-layers { padding: 28px; display: flex; flex-direction: column; align-items: center; gap: 0; }
  .arch-layer { width: 100%; max-width: 540px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 20px; display: flex; align-items: flex-start; gap: 14px; transition: all 0.15s; }
  .arch-layer:hover { border-color: #bfdbfe; background: #eff6ff; }
  .arch-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .arch-icon.fe { background: #eff6ff; }
  .arch-icon.be { background: #fffbeb; }
  .arch-icon.db { background: #f0fdf4; }
  .arch-text h4 { font-size: 13px; font-weight: 600; margin: 0 0 3px; color: #0f172a; }
  .arch-text p { font-size: 11px; color: #64748b; margin: 0; font-family: 'JetBrains Mono', monospace; }
  .arch-arrow { font-size: 13px; color: #94a3b8; margin: 6px 0; text-align: center; width: 100%; max-width: 540px; font-family: 'JetBrains Mono', monospace; }
  .arch-note { margin-top: 20px; padding: 14px 18px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 12px; color: #1e40af; max-width: 540px; line-height: 1.6; }

  .code-block { background: #0f172a; border-radius: 10px; padding: 24px 28px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.9; color: #94a3b8; overflow-x: auto; margin-top: 20px; }
  .code-block .dir { color: #e2e8f0; font-weight: 500; }
  .code-block .folder { color: #60a5fa; }
  .code-block .comment { color: #475569; }

  .data-table { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-top: 20px; }
  .data-table th { text-align: left; padding: 11px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; }
  .data-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #475569; vertical-align: top; line-height: 1.5; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: #f8fafc; }
  .data-table .bold { color: #0f172a; font-weight: 600; }
  .data-table code { font-family: 'JetBrains Mono', monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 3px; color: #1a56db; }

  .schema-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; margin-top: 20px; }
  .schema-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; transition: all 0.15s; }
  .schema-card:hover { border-color: #bfdbfe; }
  .schema-card-header { background: #eff6ff; border-bottom: 1px solid #bfdbfe; padding: 9px 14px; font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; color: #1a56db; }
  .schema-card-body { padding: 10px 14px; display: flex; flex-direction: column; gap: 3px; }
  .schema-field { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; line-height: 1.6; }
  .schema-field.pk { color: #f59e0b; }
  .schema-field.fk { color: #1a56db; }

  .personas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px; margin-top: 20px; }
  .persona-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px 20px; transition: all 0.15s; }
  .persona-card:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(26,86,219,0.06); }
  .persona-role-badge { display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px; margin-bottom: 12px; }
  .persona-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
  .persona-desc { font-size: 12px; color: #64748b; line-height: 1.6; margin-bottom: 14px; }
  .persona-features { display: flex; flex-direction: column; gap: 5px; }
  .persona-feature { font-size: 11px; color: #64748b; display: flex; align-items: flex-start; gap: 7px; line-height: 1.5; }
  .pf-arrow { color: #1a56db; flex-shrink: 0; font-weight: 600; }

  .stat-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; margin-top: 20px; }
  .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; }
  .stat-label { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; }
  .stat-value { font-size: 26px; font-weight: 700; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.5px; }
  .stat-sub { font-size: 11px; color: #94a3b8; }

  .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #1e40af; line-height: 1.6; margin-bottom: 20px; }

  .about-footer { background: #fff; border-top: 1px solid #e2e8f0; padding: 20px 32px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .footer-text { font-size: 12px; color: #94a3b8; }
  .footer-links { display: flex; gap: 20px; align-items: center; }
  .footer-link { font-size: 12px; color: #1a56db; text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 5px; }
  .footer-link:hover { color: #1e40af; text-decoration: underline; }

  @media (max-width: 640px) {
    .about-header, .hero, .nav-tabs, .content, .about-footer { padding-left: 16px; padding-right: 16px; }
  }
`;

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "tech", label: "Tech Decisions" },
  { id: "business", label: "Business Logic" },
  { id: "personas", label: "Personas" },
  { id: "data", label: "Data Model" },
];

export default function AboutPage({ onBack }) {
  const [tab, setTab] = useState("overview");

  return (
    <div className="about-root">
      <style>{styles}</style>

      <div className="about-header">
        <div className="about-header-left">
          <div className="brand"><span>Smart</span> Wireless</div>
          <div className="header-badge">About this project</div>
        </div>
        {onBack && <button className="back-btn" onClick={onBack}>← Back to Dashboard</button>}
      </div>

      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow"><span className="pulse" />ICM Portal · January 2025</div>
          <h1>Smart Wireless <span className="accent">Incentive Compensation</span><br />Management System</h1>
          <p className="hero-sub">
            A production-grade full-stack application simulating how a corporate wireless retail 
            organization manages, calculates, and distributes monthly incentive payouts across 
            multiple stores, roles, and product lines. Built end-to-end with real-world comp logic.
          </p>
          <div className="tag-row">
            <span className="tech-tag blue">React 18</span>
            <span className="tech-tag blue">FastAPI</span>
            <span className="tech-tag blue">asyncpg</span>
            <span className="tech-tag green">PostgreSQL</span>
            <span className="tech-tag green">Supabase</span>
            <span className="tech-tag amber">Railway</span>
            <span className="tech-tag amber">Vercel</span>
            <span className="tech-tag purple">JWT Auth</span>
            <span className="tech-tag purple">Recharts</span>
            <span className="tech-tag">Vite</span>
            <span className="tech-tag">Python 3.13</span>
            <span className="tech-tag">React Router v6</span>
          </div>
        </div>
      </div>

      <div className="nav-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="content">

        {tab === "overview" && (
          <>
            <div className="section">
              <div className="section-eyebrow">What is this?</div>
              <div className="section-title">A real-world ICM simulation</div>
              <p className="section-desc">
                Incentive Compensation Management (ICM) systems are the backbone of how sales 
                organizations pay their people. This project simulates one for Smart Wireless — a 
                hypothetical corporate retail wireless carrier with 6 Southwest stores. Every layer 
                of the real-world comp process is modeled: transaction ingestion, eligibility checks, 
                chargeback logic, quota attainment, floor/cap enforcement, and role-specific payout delivery.
              </p>
            </div>
            <div className="section">
              <div className="section-eyebrow">Transaction Volume · Jan 2025</div>
              <div className="section-title">Scale of the simulation</div>
              <div className="stat-row">
                {[
                  { label: "Rateplan Txns", value: "1,162", sub: "incl. ~120 deactivations" },
                  { label: "Feature Txns", value: "1,273", sub: "streaming, protection, data" },
                  { label: "Accessory Txns", value: "736", sub: "cases, chargers, earbuds" },
                  { label: "Device Txns", value: "574", sub: "new sales + upgrades" },
                  { label: "Credit Card Txns", value: "160", sub: "co-branded card SPIFFs" },
                  { label: "Total Employees", value: "49", sub: "41 reps · 6 managers · RM · Admin" },
                ].map(s => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-label">{s.label}</div>
                    <div className="stat-value">{s.value}</div>
                    <div className="stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Key Capabilities</div>
              <div className="section-title">What the system does</div>
              <div className="cards-grid">
                {[
                  { icon: "🔐", title: "JWT Role-Based Auth", desc: "Stateless auth. Role, linked entity code, and display name encoded in token. Zero DB calls to determine access level on any request." },
                  { icon: "⚡", title: "Async Payout Engine", desc: "FastAPI + asyncpg runs all payout calculations concurrently using Python async/await. Chargebacks, multipliers, floor/cap rules applied live from the DB." },
                  { icon: "📊", title: "4-Level Dashboards", desc: "Rep → Store Manager → Region Manager → Admin. Each role sees a completely different view of the same underlying transaction data." },
                  { icon: "🔄", title: "Background Preloading", desc: "Manager dashboard preloads all rep payouts on page load so drill-down into any rep is instant — no wait on click." },
                  { icon: "🧮", title: "5-Category Attainment", desc: "Store attainment calculated across Rateplan Volume, Rateplan Revenue, Feature Revenue, Accessory Revenue, and Device Revenue — averaged to a single attainment %." },
                  { icon: "📤", title: "CSV Data Pipeline", desc: "Bulk load via load_data.py — parses 5 CSV types, clears old data, upserts into Supabase using parameterized asyncpg queries. Idempotent by design." },
                ].map(f => (
                  <div className="card" key={f.title}>
                    <div className="card-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Products Sold</div>
              <div className="section-title">What Smart Wireless sells</div>
              <div className="cards-grid">
                {[
                  { icon: "📡", title: "Rateplans", desc: "MaxFlex5G, PremiumUnlimited, ConnectPlus, ConnectBasic, HomeConnect, ElitePlan, SwiftFlex. Home internet is a rateplan line — no features tied to it." },
                  { icon: "✨", title: "Features", desc: "Line add-ons: Device Protection, Netflix, Apple TV+, Amazon Prime, Hulu, Pandora, Intl Day Pass, HD Streaming. Independently payable per activation." },
                  { icon: "🎧", title: "Accessories", desc: "Phone cases, screen protectors, chargers, power banks, wireless chargers, Bluetooth earbuds, car mounts. May or may not be tied to a subscriber line." },
                  { icon: "📱", title: "Devices", desc: "New sales and upgrades: iPhone 16 Pro Max, iPhone 16 Pro, Samsung S25 Ultra, S25, Pixel 9, Motorola Edge 15." },
                  { icon: "💳", title: "Credit Cards", desc: "Smart Wireless co-branded card. Customers get autopay discount. Flat SPIFF: $25 to reps, $10 to managers, $10 to RM — no quota, pure volume." },
                ].map(p => (
                  <div className="card" key={p.title}>
                    <div className="card-icon">{p.icon}</div>
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "architecture" && (
          <>
            <div className="section">
              <div className="section-eyebrow">System Design</div>
              <div className="section-title">Three-tier, three clouds</div>
              <p className="section-desc">
                Classic separation of concerns: stateless React SPA, stateless FastAPI backend, 
                managed PostgreSQL. Each tier is deployed independently and can scale, fail, and 
                update without coupling. The Vercel proxy layer eliminates CORS complexity entirely.
              </p>
              <div className="arch-box">
                <div className="arch-box-header">Request Flow</div>
                <div className="arch-layers">
                  <div className="arch-layer">
                    <div className="arch-icon fe">🌐</div>
                    <div className="arch-text">
                      <h4>Browser → Vercel CDN (Edge Network)</h4>
                      <p>React 18 + Vite · Recharts · React Router v6 · JWT in localStorage · axios interceptor</p>
                    </div>
                  </div>
                  <div className="arch-arrow">↕ HTTPS · All /api/* proxied via vercel.json rewrite (same-origin, no CORS)</div>
                  <div className="arch-layer">
                    <div className="arch-icon be">⚙️</div>
                    <div className="arch-text">
                      <h4>FastAPI → Railway (us-east4, GCP)</h4>
                      <p>Python 3.13 · Uvicorn · asyncpg pool · Pydantic v2 · JWT Bearer middleware</p>
                    </div>
                  </div>
                  <div className="arch-arrow">↕ asyncpg connection pool · port 6543 (pooler) · SSL enforced · TLS 1.2+</div>
                  <div className="arch-layer">
                    <div className="arch-icon db">🗄️</div>
                    <div className="arch-text">
                      <h4>PostgreSQL → Supabase PgBouncer (AWS us-east-1)</h4>
                      <p>13 tables · Transaction-mode pooler · parameterized queries · no RLS</p>
                    </div>
                  </div>
                  <div className="arch-note">
                    <strong>Why the connection pooler?</strong> Railway's egress IPs are dynamic and blocked by Supabase's direct 
                    endpoint (port 5432). Supabase's PgBouncer pooler (port 6543, Transaction mode) accepts connections 
                    from any IP, resolving the network reachability issue.
                  </div>
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Infrastructure</div>
              <div className="section-title">Three deployment platforms</div>
              <div className="cards-grid">
                <div className="card">
                  <div className="card-icon">▲</div>
                  <h3>Vercel — Frontend Host</h3>
                  <p>Auto-deploys on push to <code>main</code>. Root set to <code>/frontend</code>. <code>vercel.json</code> does double duty: SPA rewrites (all routes → index.html) and API proxy (<code>/api/*</code> → Railway URL).</p>
                  <div className="why"><strong>CORS fix:</strong> Railway's Fastly CDN strips <code>Access-Control-Allow-Origin</code> from non-preflight responses. Proxying through Vercel makes requests same-origin — no CORS headers needed.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🚂</div>
                  <h3>Railway — Backend Host</h3>
                  <p>FastAPI via Uvicorn on <code>$PORT</code> (auto-assigned 8080). Root directory: <code>/backend</code>. Procfile: <code>web: uvicorn app.main:app --host 0.0.0.0 --port $PORT</code>. Env vars injected at container start.</p>
                  <div className="why"><strong>Key gotcha:</strong> Railway injects <code>$PORT</code> as 8080, not 8000. The public domain must be configured to route to 8080, not the default assumption of 8000.</div>
                </div>
                <div className="card">
                  <div className="card-icon">⚡</div>
                  <h3>Supabase — Managed PostgreSQL</h3>
                  <p>PostgreSQL on AWS us-east-1. Uses PgBouncer connection pooler (port 6543, Transaction mode). SSL enforced via Python's <code>ssl.create_default_context()</code> passed directly to asyncpg — not via URL parameter.</p>
                  <div className="why"><strong>SSL note:</strong> asyncpg doesn't support <code>?sslmode=require</code> URL params. SSL must be passed as an <code>ssl=ctx</code> kwarg to <code>asyncpg.create_pool()</code>.</div>
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Code Structure</div>
              <div className="section-title">Repository layout</div>
              <div className="code-block">
                <span className="dir">smart-wireless-icm/</span><br />
                &nbsp;&nbsp;├── <span className="folder">backend/</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">app/routers/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># auth.py · payout.py · data_mgmt.py</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">app/services/</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># database.py · payout_engine.py · calc_engine.py</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">data/sample/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># 5 CSV files (rateplan, feature, accessory, device, cc)</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── load_data.py&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># CSV → Supabase async batch upsert</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── Procfile&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># Railway: uvicorn app.main:app --host 0.0.0.0 --port $PORT</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── requirements.txt<br />
                &nbsp;&nbsp;├── <span className="folder">frontend/</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">src/pages/</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># RepDashboard · ManagerDashboard · RMDashboard · AdminDashboard · AboutPage</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">src/services/</span>&nbsp;&nbsp;&nbsp;<span className="comment"># api.js — axios instance with JWT Authorization header interceptor</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── <span className="folder">src/context/</span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># AuthContext — login · logout · role guard HOC</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;├── vercel.json&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="comment"># SPA rewrites + /api/* → Railway proxy</span><br />
                &nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;└── vite.config.js<br />
                &nbsp;&nbsp;└── README.md
              </div>
            </div>
          </>
        )}

        {tab === "tech" && (
          <>
            <div className="section">
              <div className="section-eyebrow">Why these tools?</div>
              <div className="section-title">Technology decisions, explained</div>
              <p className="section-desc">
                Every tool was chosen deliberately. Here's the reasoning behind each major decision — 
                not just what was used, but why it beats the alternatives for this specific workload.
              </p>
            </div>
            <div className="section">
              <div className="section-eyebrow">Backend Stack</div>
              <div className="section-title">FastAPI · asyncpg · Python 3.13</div>
              <div className="cards-grid">
                <div className="card">
                  <div className="card-icon">⚡</div>
                  <h3>FastAPI over Django / Flask</h3>
                  <p>The payout engine fetches rateplan, feature, accessory, device, and CC data simultaneously — not sequentially. FastAPI's native <code>async/await</code> support lets these run concurrently via asyncio event loop. Pydantic v2 handles request/response validation with zero boilerplate.</p>
                  <div className="why"><strong>vs Flask:</strong> Sync-only without bolt-ons. <strong>vs Django:</strong> ORM + admin + migrations = weight without benefit for a data-query-heavy app with no user-facing forms.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🔌</div>
                  <h3>asyncpg over SQLAlchemy</h3>
                  <p>asyncpg is a low-level async PostgreSQL driver with no ORM overhead. For aggregations, multi-table joins, and chargeback window queries, raw parameterized SQL gives precise control over query plans and execution. <code>statement_cache_size=0</code> set for PgBouncer Transaction mode compatibility.</p>
                  <div className="why"><strong>vs SQLAlchemy async:</strong> Adds abstraction on top of asyncpg anyway. For this workload, direct SQL is cleaner, faster, and easier to debug.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🛡️</div>
                  <h3>Stateless JWT over Sessions</h3>
                  <p>Role, linked entity code (store/district), and display name are encoded in the token at login. The backend never queries a session store — it decodes the JWT on every request. Makes the API horizontally scalable by default, with no shared state between Railway instances.</p>
                  <div className="why"><strong>vs sessions:</strong> Would require Redis or sticky sessions. JWT keeps the backend fully stateless — consistent with Railway's ephemeral container model.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🐍</div>
                  <h3>Python 3.13 for Business Logic</h3>
                  <p>The payout engine — chargeback lookups, date math, eligibility filtering, multiplier application, floor/cap enforcement — reads naturally in Python. The standard library's <code>datetime</code>, <code>decimal</code>, and async primitives handle all requirements without third-party dependencies.</p>
                  <div className="why"><strong>vs Node/Go:</strong> For financial logic correctness and readability, Python's expressiveness wins. Performance is adequate — asyncio handles the I/O-bound DB bottleneck.</div>
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Frontend Stack</div>
              <div className="section-title">React 18 · Vite · Recharts · React Router v6</div>
              <div className="cards-grid">
                <div className="card">
                  <div className="card-icon">⚛️</div>
                  <h3>React 18</h3>
                  <p>Component model maps cleanly to the dashboard structure — each role's dashboard is an independent tree with its own state. <code>useState</code> + <code>useEffect</code> for data fetching, <code>useContext</code> for auth. No state management library needed — the data flow is simple enough that prop drilling + context covers everything.</p>
                  <div className="why"><strong>vs Vue/Svelte:</strong> React's ecosystem depth (Router, Recharts, Auth patterns, community) was the deciding factor for a dashboard-heavy app.</div>
                </div>
                <div className="card">
                  <div className="card-icon">⚡</div>
                  <h3>Vite over CRA / Next.js</h3>
                  <p>Vite's ES module-native dev server starts in &lt;500ms and HMR updates in milliseconds. For a project with many components and fast iteration cycles, Webpack-based CRA's 30+ second cold starts are a productivity killer. Next.js adds SSR complexity with no benefit for a JWT-protected SPA.</p>
                  <div className="why"><strong>Config added:</strong> <code>vercel.json</code> SPA rewrite handles what Next.js would handle via its router — without the framework overhead.</div>
                </div>
                <div className="card">
                  <div className="card-icon">📈</div>
                  <h3>Recharts</h3>
                  <p>Builds on D3 but exposes a React-native declarative component API. Horizontal bar charts for attainment comparison, grouped bars for category breakdown, custom tooltips — all composable as JSX without D3's imperative <code>select().attr()</code> imperative style that doesn't fit React's render model.</p>
                  <div className="why"><strong>vs Chart.js:</strong> Chart.js requires imperative canvas management that doesn't compose well with React state updates. Recharts re-renders declaratively.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🗺️</div>
                  <h3>React Router v6</h3>
                  <p>Protected routes gated by JWT role claim. <code>&lt;Navigate&gt;</code> handles unauthorized redirects. <code>vercel.json</code> rewrite <code>{"/(.*) → /index.html"}</code> ensures deep links resolve correctly in production — without it, direct URL access returns Vercel 404s.</p>
                  <div className="why"><strong>Key pattern:</strong> Route-level role guard checks <code>auth.role</code> from AuthContext. Wrong role → redirect to login. Clean, no per-component auth checks needed.</div>
                </div>
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Infrastructure</div>
              <div className="section-title">Vercel · Railway · Supabase</div>
              <div className="cards-grid">
                <div className="card">
                  <div className="card-icon">▲</div>
                  <h3>Vercel for Frontend</h3>
                  <p>Zero-config deploys from GitHub. The <code>vercel.json</code> proxy rewrite solves a real production problem: Railway's Fastly CDN strips <code>Access-Control-Allow-Origin</code> headers from non-preflight POST responses. Proxying through Vercel makes requests same-origin — CORS disappears entirely.</p>
                  <div className="why"><strong>Alternative considered:</strong> Netlify also works, but Vercel's rewrite syntax is cleaner and its edge network is faster for this use case.</div>
                </div>
                <div className="card">
                  <div className="card-icon">🚂</div>
                  <h3>Railway for Backend</h3>
                  <p>Auto-detects Python + Procfile. Injects <code>$PORT</code> env var automatically. Supports monorepo root directory config (<code>/backend</code>). GitHub-connected deployments with instant rollback. Environment variable management UI is clean and supports per-service secrets.</p>
                  <div className="why"><strong>vs Heroku:</strong> Railway's free tier is more generous, UI is faster, and deploy times are shorter. <strong>vs Fly.io:</strong> Less config for a simple Python web service.</div>
                </div>
                <div className="card">
                  <div className="card-icon">⚡</div>
                  <h3>Supabase for PostgreSQL</h3>
                  <p>Managed PostgreSQL with a web-based SQL editor for quick schema iteration. The PgBouncer connection pooler (Transaction mode) is the critical piece — it accepts Railway's dynamic IPs that Supabase's direct endpoint blocks. <code>statement_cache_size=0</code> required in asyncpg for PgBouncer compatibility.</p>
                  <div className="why"><strong>vs AWS RDS:</strong> Supabase's instant provisioning, web SQL editor, and free tier make it ideal for development speed. RDS adds VPC, IAM, and config overhead.</div>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "business" && (
          <>
            <div className="section">
              <div className="section-eyebrow">Compensation Rules</div>
              <div className="section-title">Payout calculation by role</div>
              <table className="data-table">
                <thead>
                  <tr><th>Role</th><th>Payout Formula</th><th>Floor / Cap</th><th>CC SPIFF</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="bold">Store Rep</td>
                    <td>Flat $ rate per transaction × Store Multiplier (0.8x–1.2x)</td>
                    <td>N/A</td>
                    <td>$25 / card</td>
                  </tr>
                  <tr>
                    <td className="bold">Store Manager</td>
                    <td>TTI × Store Attainment %<br /><small style={{color:'#94a3b8'}}>Attainment = avg of 5 quota categories</small></td>
                    <td>Floor: 50% → $0<br />Cap: 130% → max</td>
                    <td>$10 / card in store</td>
                  </tr>
                  <tr>
                    <td className="bold">Region Manager</td>
                    <td>TTI × Avg attainment across all stores<br /><small style={{color:'#94a3b8'}}>No separate district quota</small></td>
                    <td>Same floor/cap as manager</td>
                    <td>$10 / card region-wide</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="section">
              <div className="section-eyebrow">Chargeback Logic</div>
              <div className="section-title">When payouts get reversed</div>
              <p className="section-desc">
                The chargeback window (currently 120 days) is stored in <code>system_config</code> — 
                the business can change it without a code deployment. Any deactivation or return 
                within the window reverses the original payout for the rep, their manager, and the RM.
              </p>
              <div className="cards-grid">
                {[
                  { icon: "📡", title: "Rateplan Deactivation", desc: "volume = -1 row. Engine checks if matching activation exists within chargeback_days. If found, original payout reversed across rep, manager, and RM." },
                  { icon: "✨", title: "Feature Deactivation", desc: "Same logic as rateplan. Feature MRC payout reversed if feature deactivated within window. Evaluated per feature_code + subscriber_id." },
                  { icon: "🎧", title: "Accessory Return", desc: "type = 'Return'. customer_paid_amount reversed if return is within 120 days of original sale date. Subscriber ID optional — matched on date + rep + product." },
                  { icon: "📱", title: "Device Return", desc: "type = 'Return'. Applies to both new sales and upgrades. Device sale payout reversed. Subscriber ID + phone number used for matching where available." },
                ].map(c => (
                  <div className="card" key={c.title}>
                    <div className="card-icon">{c.icon}</div>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Store Attainment</div>
              <div className="section-title">5 quota categories averaged</div>
              <table className="data-table">
                <thead>
                  <tr><th>Category</th><th>Calculation</th><th>DB Column</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Rateplan Net Volume", "COUNT(activations) − COUNT(deactivations within chargeback window)", "rp_volume_quota"],
                    ["Rateplan Revenue", "SUM(customer_paid_amount) from rateplan_transactions", "rp_revenue_quota"],
                    ["Feature Revenue", "SUM(feature_mrc) from feature_transactions (activations only)", "feature_rev_quota"],
                    ["Accessory Revenue", "SUM(customer_paid_amount) from accessory_transactions (sales only)", "accessory_rev_quota"],
                    ["Device Revenue", "SUM(customer_paid_amount) from device_transactions (sales only)", "device_rev_quota"],
                  ].map(([cat, calc, col]) => (
                    <tr key={cat}>
                      <td className="bold">{cat}</td>
                      <td style={{fontSize:12}}>{calc}</td>
                      <td><code>{col}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="section">
              <div className="section-eyebrow">Eligibility Pipeline</div>
              <div className="section-title">What gets checked before payout</div>
              <div className="cards-grid">
                {[
                  { icon: "✅", title: "Product Eligibility", desc: "comp_config.is_eligible flag per product code. Unlisted or ineligible product codes earn $0. Business adds/removes codes here without code changes." },
                  { icon: "👤", title: "Rep Eligibility", desc: "reps.is_eligible flag. Reps on leave or terminated are marked false — all their transactions excluded from payout calculation." },
                  { icon: "📅", title: "Chargeback Window", desc: "system_config key chargeback_days. Currently 120. Configurable number — business changes value, engine picks it up on next calculation run." },
                  { icon: "💰", title: "Flat Rate Lookup", desc: "comp_config.flat_rate drives all rep transaction payouts. Repricing any product = one row update in comp_config. Zero code changes." },
                ].map(e => (
                  <div className="card" key={e.title}>
                    <div className="card-icon">{e.icon}</div>
                    <h3>{e.title}</h3>
                    <p>{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "personas" && (
          <>
            <div className="section">
              <div className="section-eyebrow">User Roles</div>
              <div className="section-title">Four personas, one codebase</div>
              <p className="section-desc">
                Role is encoded in the JWT at login. The frontend routes to the correct dashboard 
                based on the role claim — no separate login URLs or role-selection screens. 
                AuthContext exposes <code>auth.role</code> and each route checks it with a guard component.
              </p>
              <div className="personas-grid">
                {[
                  {
                    role: "Store Rep", color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe",
                    desc: "Primary customer-facing salesperson. Sells all 5 product types. Paid per transaction with store multiplier applied.",
                    features: ["Personal payout with multiplier breakdown", "Tabbed transaction detail: Rateplans · Features · Accessories · Devices · Credit Cards", "Net units per category, phone number + rep code shown per row"]
                  },
                  {
                    role: "Store Manager", color: "#d97706", bg: "#fffbeb", border: "#fde68a",
                    desc: "Oversees store operations. Accountable for store-level quota attainment. Coaches reps.",
                    features: ["TTI × attainment with floor/cap indicator", "Target attainment chart across 5 categories", "Rep leaderboard → drill into any rep's dashboard", "Background preloading for instant rep drill-down", "Store transaction tabs (no per-transaction payout)"]
                  },
                  {
                    role: "Region Manager", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0",
                    desc: "Oversees all 6 stores in the Southwest district. Receives CC SPIFF on all region card sales.",
                    features: ["District payout = TTI × avg store attainment", "Store rankings with attainment comparison chart", "Interactive category-level breakdown across stores", "Drill-down → any store manager's full view", "District-wide transaction tabs per product type"]
                  },
                  {
                    role: "Admin", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe",
                    desc: "Internal business user. Full cross-region visibility. Can assume any persona by name.",
                    features: ["View-as: select any rep, manager, or RM by name", "Region vs. region comparison", "Cross-store attainment analytics", "Top rep leaderboard + direct drill-down", "Other Insights: top 5 by product type", "Comp config viewer + chargeback window", "Full transactional data browser (all 5 types)"]
                  },
                ].map(p => (
                  <div className="persona-card" key={p.role} style={{borderColor: p.border}}>
                    <div className="persona-role-badge" style={{background: p.bg, color: p.color, border: `1px solid ${p.border}`}}>{p.role}</div>
                    <div className="persona-name">{p.role}</div>
                    <div className="persona-desc">{p.desc}</div>
                    <div className="persona-features">
                      {p.features.map((f, i) => <div className="persona-feature" key={i}><span className="pf-arrow">→</span>{f}</div>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Demo Credentials</div>
              <div className="section-title">Quick access logins</div>
              <div className="info-banner">Use the quick-access buttons on the login screen to auto-fill credentials. The JWT returned encodes role, linked_code, and display_name — decoded client-side for routing.</div>
              <table className="data-table">
                <thead>
                  <tr><th>Role</th><th>Username</th><th>Password</th><th>Persona</th><th>Linked To</th></tr>
                </thead>
                <tbody>
                  {[
                    ["Store Rep", "mjohnson", "rep2025pw", "Marcus Johnson", "SW-004 · Phoenix West"],
                    ["Store Manager", "dreyes", "mgr2025pw", "Diana Reyes", "SW-004 · Phoenix West"],
                    ["Region Manager", "kpark", "dm2025pw", "K. Park", "DM-SW · Southwest District"],
                    ["Admin", "admin", "admin123", "Admin User", "All stores · all regions"],
                  ].map(([role, user, pass, name, linked]) => (
                    <tr key={user}>
                      <td className="bold">{role}</td>
                      <td><code>{user}</code></td>
                      <td><code>{pass}</code></td>
                      <td>{name}</td>
                      <td style={{color:'#94a3b8', fontSize:12}}>{linked}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "data" && (
          <>
            <div className="section">
              <div className="section-eyebrow">Database Schema</div>
              <div className="section-title">13 PostgreSQL tables across 3 domains</div>
              <p className="section-desc">
                Org structure (who works where), configuration (comp rates and business rules), 
                and transactions (raw sales data). All queries use parameterized asyncpg statements. 
                🔑 = primary key &nbsp; 🔗 = foreign key
              </p>
              <div className="schema-grid">
                {[
                  { name: "districts", fields: [["district_code","pk"],["district_name",""],["rm_code","fk"]] },
                  { name: "stores", fields: [["store_code","pk"],["store_name",""],["district_code","fk"],["manager_code","fk"]] },
                  { name: "managers", fields: [["manager_code","pk"],["manager_name",""],["store_code","fk"],["tti",""],["is_eligible",""]] },
                  { name: "reps", fields: [["rep_code","pk"],["rep_name",""],["store_code","fk"],["is_eligible",""]] },
                  { name: "users", fields: [["username","pk"],["password_hash",""],["role",""],["linked_code",""],["display_name",""]] },
                  { name: "comp_config", fields: [["product_code","pk"],["product_type",""],["flat_rate",""],["is_eligible",""],["description",""]] },
                  { name: "store_quotas", fields: [["store_code","fk"],["period",""],["rp_volume_quota",""],["rp_revenue_quota",""],["feature_rev_quota",""],["accessory_rev_quota",""],["device_rev_quota",""]] },
                  { name: "system_config", fields: [["config_key","pk"],["config_value",""],["description",""]] },
                  { name: "rateplan_txns", fields: [["transaction_date",""],["rateplan_code","fk"],["rep_code","fk"],["store_code","fk"],["plan_mrc",""],["customer_paid_amount",""],["subscriber_id",""],["phone_number",""],["volume",""],["type",""]] },
                  { name: "feature_txns", fields: [["transaction_date",""],["feature_code","fk"],["rep_code","fk"],["store_code","fk"],["feature_mrc",""],["subscriber_id",""],["phone_number",""],["volume",""],["type",""]] },
                  { name: "accessory_txns", fields: [["transaction_date",""],["accessory_code","fk"],["rep_code","fk"],["store_code","fk"],["customer_paid_amount",""],["subscriber_id",""],["phone_number",""],["volume",""],["type",""]] },
                  { name: "device_txns", fields: [["transaction_date",""],["device_code","fk"],["rep_code","fk"],["store_code","fk"],["customer_paid_amount",""],["device_sale_type",""],["subscriber_id",""],["phone_number",""],["volume",""],["type",""]] },
                  { name: "creditcard_txns", fields: [["transaction_date",""],["product_code","fk"],["rep_code","fk"],["store_code","fk"],["subscriber_id",""],["phone_number",""],["volume",""]] },
                ].map(t => (
                  <div className="schema-card" key={t.name}>
                    <div className="schema-card-header">{t.name}</div>
                    <div className="schema-card-body">
                      {t.fields.map(([f, type]) => (
                        <div className={`schema-field ${type}`} key={f}>
                          {type === 'pk' ? '🔑 ' : type === 'fk' ? '🔗 ' : '   '}{f}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="section">
              <div className="section-eyebrow">Data Pipeline</div>
              <div className="section-title">CSV ingestion + payout calculation</div>
              <div className="cards-grid">
                {[
                  { icon: "📂", title: "5 CSV Input Types", desc: "rateplan_transactions.csv · feature_transactions.csv · accessory_transactions.csv · device_transactions.csv · creditcard_transactions.csv" },
                  { icon: "🔄", title: "Idempotent Load", desc: "load_data.py truncates all transaction tables before inserting. Run it any number of times — result is always deterministic based on CSV content." },
                  { icon: "🧮", title: "On-Demand Calculation", desc: "POST /api/payout/admin/run-calculations?period=2025-01 triggers the engine. Admin can re-run any time. Results stored in payout_results table." },
                  { icon: "📅", title: "Period-Scoped Queries", desc: "All calculations scoped to a YYYY-MM period parameter. Multi-month ready — load new month's CSV and run calculations for that period." },
                ].map(d => (
                  <div className="card" key={d.title}>
                    <div className="card-icon">{d.icon}</div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      <div className="about-footer">
        <div className="footer-text">Smart Wireless ICM · Jan 2025 · FastAPI + React + PostgreSQL · Supabase · Railway · Vercel</div>
        <div className="footer-links">
          <a className="footer-link" href="https://github.com/abhijeet-geete/smart-wireless-icm" target="_blank" rel="noopener noreferrer">GitHub →</a>
          <a className="footer-link" href="https://smart-wireless-icm.vercel.app" target="_blank" rel="noopener noreferrer">Live App →</a>
        </div>
      </div>
    </div>
  );
}
