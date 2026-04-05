import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminSummary, runCalculations } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RepDashboard from './RepDashboard'
import ManagerDashboard from './ManagerDashboard'
import RMDashboard from './RMDashboard'

function fmt(n) { return '$' + Math.round(n).toLocaleString() }
function pct(n) { return Math.round(n * 100) + '%' }

function AttBadge({ att }) {
  const a = parseFloat(att)
  if (a >= 1.2) return <span style={{ background: '#EAF3DE', color: '#27500A', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  if (a >= 1.0) return <span style={{ background: '#E6F1FB', color: '#0C447C', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  if (a >= 0.8) return <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  return <span style={{ background: '#FCEBEB', color: '#791F1F', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
}

function Badge({ text, type }) {
  const colors = { green: ['#EAF3DE', '#27500A'], blue: ['#E6F1FB', '#0C447C'], amber: ['#FAEEDA', '#633806'], purple: ['#EEEDFE', '#3C3489'] }
  const [bg, color] = colors[type] || colors.blue
  return <span style={{ background: bg, color, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{text}</span>
}

function RegionTxnFetcher({ txnKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setRows([])
    const fetchAll = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/payout/region/RM-001/transactions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        const key = txnKey === 'creditcard' ? 'credit_card' : txnKey
        setRows(data.transactions?.[key] || [])
      } catch (e) {
        setRows([])
      }
      setLoading(false)
    }
    fetchAll()
  }, [txnKey])

  if (loading) return <div style={{ padding: '2rem', color: '#999', fontSize: 13 }}>Loading {txnKey} transactions...</div>

  const columns = {
    rateplan: ['Date', 'Plan', 'Subscriber ID', 'Phone number', 'Rep', 'Store', 'Type', 'Cust paid'],
    feature: ['Date', 'Feature', 'Subscriber ID', 'Phone number', 'Rep', 'Store', 'MRC'],
    accessory: ['Date', 'Item', 'Subscriber ID', 'Phone number', 'Rep', 'Store', 'Cust paid'],
    device: ['Date', 'Device', 'Subscriber ID', 'Phone number', 'Rep', 'Store', 'Sale type', 'Cust paid'],
    creditcard: ['Date', 'Product', 'Rep', 'Store', 'Type'],
  }

  const getRow = (t) => {
    if (txnKey === 'rateplan') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.store_name, <Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} />, fmt(t.customer_paid || 0)]
    if (txnKey === 'feature') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.store_name, fmt(t.mrc || 0)]
    if (txnKey === 'accessory') return [t.date, t.description, t.subscriber_id || '—', t.phone_number || '—', t.rep_name, t.store_name, fmt(t.customer_paid || 0)]
    if (txnKey === 'device') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.store_name, <Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} />, fmt(t.customer_paid || 0)]
    if (txnKey === 'creditcard') return [t.date, t.description, t.rep_name, t.store_name, <Badge text="SPIFF" type="purple" />]
    return []
  }

  const cols = columns[txnKey] || []

  return (
    <div>
      <div style={{ fontSize: 12, color: '#bbb', marginBottom: 12 }}>{rows.length} transactions region-wide</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{cols.map(c => <th key={c} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                {getRow(t).map((cell, j) => (
                  <td key={j} style={{ padding: '7px 8px', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap', fontSize: j >= 4 ? 11 : 13, color: j >= 4 ? '#999' : '#333' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('region')
  const [activeTxnTab, setActiveTxnTab] = useState('rateplan')
  const [persona, setPersona] = useState('admin')
  const [personaEntity, setPersonaEntity] = useState(null)
  const [viewAsUser, setViewAsUser] = useState(null)
  const [storeCategory, setStoreCategory] = useState('overall')
  const [calcRunning, setCalcRunning] = useState(false)
  const [calcResult, setCalcResult] = useState(null)

  useEffect(() => {
    getAdminSummary().then(setData).finally(() => setLoading(false))
  }, [])

  const handleRunCalc = async () => {
    setCalcRunning(true)
    setCalcResult(null)
    try {
      const result = await runCalculations()
      setCalcResult(result)
      const fresh = await getAdminSummary()
      setData(fresh)
    } catch (e) {
      setCalcResult({ error: e.message })
    } finally {
      setCalcRunning(false)
    }
  }

  if (viewAsUser) {
    const { role, code, name } = viewAsUser
    return (
      <div>
        <div style={{ background: '#185FA5', color: '#fff', padding: '8px 24px', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Admin view — viewing as <strong>{name}</strong> ({role})</span>
          <button onClick={() => setViewAsUser(null)} style={{ background: '#fff', color: '#185FA5', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>← Back to Admin</button>
        </div>
        {role === 'rep' && <RepDashboard overrideRepCode={code} />}
        {role === 'manager' && <ManagerDashboard overrideMgrCode={code} />}
        {role === 'rm' && <RMDashboard />}
      </div>
    )
  }

  if (loading) return (
    <div style={styles.loading}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Loading admin dashboard...</div>
        <div style={{ fontSize: 13, color: '#aaa' }}>Fetching payout data across all stores and reps</div>
      </div>
    </div>
  )
  if (!data) return <div style={styles.loading}>No data found</div>

  const stores = data.district?.stores || []

  const getPersonaOptions = () => {
    if (persona === 'rep') return (data.all_reps || []).map(r => ({ code: r.rep_code, name: `${r.rep_name} — ${r.store_name}` }))
    if (persona === 'manager') return stores.map(s => ({ code: s.manager_code, name: `${s.manager_name} — ${s.store_name}` }))
    if (persona === 'rm') return [{ code: 'RM-001', name: 'Kevin Park — Southwest Region' }]
    return []
  }

  const storeCategoryData = (category) => {
    return stores.map(s => ({
      name: s.store_name.replace('Phoenix ', 'PHX ').replace('Scottsdale ', 'SCT ').replace('Tempe ', 'TMP ').replace('Mesa ', 'MSA ').replace('Gilbert ', 'GLB '),
      att: category === 'overall'
        ? Math.round(s.overall_attainment * 100)
        : Math.round((s.attainments?.[category] || 0) * 100),
      store: s
    })).sort((a, b) => b.att - a.att)
  }

  const categoryOptions = [
    { key: 'overall', label: 'Overall attainment' },
    { key: 'rp_volume', label: 'Rateplan Volume' },
    { key: 'rp_revenue', label: 'Rateplan Revenue' },
    { key: 'feature_revenue', label: 'Feature Revenue' },
    { key: 'accessory_revenue', label: 'Accessory Revenue' },
    { key: 'device_revenue', label: 'Device Revenue' },
  ]

  const compConfig = data.comp_config || []
  const rpConfigs = compConfig.filter(c => c.product_type === 'rateplan')
  const ftConfigs = compConfig.filter(c => c.product_type === 'feature')
  const dvConfigs = compConfig.filter(c => c.product_type === 'device')
  const acConfigs = compConfig.filter(c => c.product_type === 'accessory')

  const mainTabs = [
    { id: 'region', label: 'Region view' },
    { id: 'stores', label: 'Store view' },
    { id: 'topreps', label: 'Top reps' },
    { id: 'insights', label: 'Other insights' },
    { id: 'config', label: 'Comp config' },
    { id: 'transactions', label: 'Transactional data' },
  ]

  const txnTabs = [
    { id: 'rateplan', label: 'Rateplans' },
    { id: 'feature', label: 'Features' },
    { id: 'accessory', label: 'Accessories' },
    { id: 'device', label: 'Devices' },
    { id: 'creditcard', label: 'Credit Cards' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.topLeft}>
          <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
          <span style={styles.badge}>Admin</span>
          <span style={styles.userName}>System Admin</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.period}>Jan 2025</span>
          <select style={styles.personaSelect} value={persona} onChange={e => { setPersona(e.target.value); setPersonaEntity(null) }}>
            <option value="admin">Admin view</option>
            <option value="rep">View as: Store Rep</option>
            <option value="manager">View as: Store Manager</option>
            <option value="rm">View as: Region Manager</option>
          </select>
          {persona !== 'admin' && (
            <select style={styles.personaSelect} value={personaEntity || ''} onChange={e => setPersonaEntity(e.target.value)}>
              <option value="">Select {persona === 'rep' ? 'rep' : persona === 'manager' ? 'manager' : 'RM'}...</option>
              {getPersonaOptions().map(o => (
                <option key={o.code} value={o.code}>{o.name}</option>
              ))}
            </select>
          )}
          {persona !== 'admin' && personaEntity && (
            <button style={{ ...styles.logoutBtn, background: '#185FA5', color: '#fff', border: 'none' }}
              onClick={() => {
                const opts = getPersonaOptions()
                const found = opts.find(o => o.code === personaEntity)
                setViewAsUser({ role: persona, code: personaEntity, name: found?.name || personaEntity })
              }}>
              View →
            </button>
          )}
          <button
            style={{ ...styles.logoutBtn, background: calcRunning ? '#f0f0f0' : '#EAF3DE', color: calcRunning ? '#999' : '#27500A', border: '1px solid #ccc' }}
            onClick={handleRunCalc}
            disabled={calcRunning}>
            {calcRunning ? 'Running...' : 'Run calculations'}
          </button>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      {calcResult && (
        <div style={{ background: calcResult.error ? '#FCEBEB' : '#EAF3DE', color: calcResult.error ? '#791F1F' : '#27500A', fontSize: 12, padding: '8px 16px', borderRadius: 8, marginBottom: 16 }}>
          {calcResult.error
            ? `Calculation error: ${calcResult.error}`
            : `Calculations complete — ${calcResult.reps} reps, ${calcResult.managers} managers, ${calcResult.rm} RMs calculated in ${calcResult.elapsed_seconds}s`}
        </div>
      )}

      <div style={styles.metrics}>
        <div style={styles.metric}><div style={styles.metricLabel}>Total incentive liability</div><div style={styles.metricValue}>{fmt(data.total_incentive_liability)}</div><div style={styles.metricSub}>All employees — Jan 2025</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Rep payout pool</div><div style={styles.metricValue}>{fmt(data.rep_pool)}</div><div style={styles.metricSub}>{(data.all_reps || []).length} reps</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Store manager payout pool</div><div style={styles.metricValue}>{fmt(data.manager_pool)}</div><div style={styles.metricSub}>{stores.length} store managers</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>RM payout pool</div><div style={styles.metricValue}>{fmt(data.rm_payout || 0)}</div><div style={styles.metricSub}>Region managers</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Total CC SPIFF pool</div><div style={styles.metricValue}>{fmt(data.total_cc_pool || 0)}</div><div style={styles.metricSub}>All roles combined</div></div>
      </div>

      <div style={styles.tabs}>
        {mainTabs.map(t => (
          <button key={t.id} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'region' && (
        <div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Southwest Region — Kevin Park</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={styles.insightBox}><div style={styles.insightLabel}>Region avg attainment</div><div style={styles.insightValue}>{pct(data.district?.average_attainment || 0)}</div></div>
              <div style={styles.insightBox}><div style={styles.insightLabel}>RM total payout</div><div style={styles.insightValue}>{fmt(data.district?.total_payout || 0)}</div></div>
              <div style={styles.insightBox}><div style={styles.insightLabel}>RM TTI</div><div style={styles.insightValue}>{fmt(data.district?.tti || 11700)}</div></div>
              <div style={styles.insightBox}><div style={styles.insightLabel}>Total stores</div><div style={styles.insightValue}>{stores.length}</div></div>
            </div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Store</th><th style={styles.th}>Store Manager</th><th style={styles.th}>Attainment</th><th style={styles.th}>Store mult</th><th style={styles.th}>Rep pool</th><th style={styles.th}>RSM payout</th><th style={styles.th}>Reps</th></tr></thead>
              <tbody>
                {stores.sort((a, b) => b.overall_attainment - a.overall_attainment).map(s => (
                  <tr key={s.store_code} onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...styles.td, fontWeight: 500 }}>{s.store_name}</td>
                    <td style={styles.td}>{s.manager_name}</td>
                    <td style={styles.td}><AttBadge att={s.overall_attainment} /></td>
                    <td style={styles.td}>
                      <span style={{ background: s.store_multiplier >= 1.2 ? '#EAF3DE' : s.store_multiplier >= 1 ? '#E6F1FB' : '#FAEEDA', color: s.store_multiplier >= 1.2 ? '#27500A' : s.store_multiplier >= 1 ? '#0C447C' : '#633806', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{s.store_multiplier}x</span>
                    </td>
                    <td style={styles.td}>{fmt(s.rep_pool)}</td>
                    <td style={styles.td}>{fmt(s.manager_payout)}</td>
                    <td style={styles.td}>{s.rep_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Store attainment vs rep pool</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stores.sort((a, b) => b.overall_attainment - a.overall_attainment).map(s => ({
                name: s.store_name.split(' ')[0],
                att: Math.round(s.overall_attainment * 100),
                repPool: Math.round(s.rep_pool),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="%" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip formatter={(v, n) => n === 'Attainment %' ? v + '%' : fmt(v)} />
                <Bar yAxisId="left" dataKey="att" name="Attainment %" fill="#185FA5" />
                <Bar yAxisId="right" dataKey="repPool" name="Rep pool" fill="#3B6D11" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {categoryOptions.map(opt => (
              <button key={opt.key} onClick={() => setStoreCategory(opt.key)} style={{
                padding: '5px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                border: storeCategory === opt.key ? '1.5px solid #185FA5' : '1px solid #ddd',
                background: storeCategory === opt.key ? '#E6F1FB' : '#f8f8f8',
                color: storeCategory === opt.key ? '#0C447C' : '#666',
                fontWeight: storeCategory === opt.key ? 600 : 400
              }}>{opt.label}</button>
            ))}
          </div>
          <div style={styles.grid2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Store rankings — {categoryOptions.find(c => c.key === storeCategory)?.label}</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Store</th><th style={styles.th}>Region</th><th style={styles.th}>Manager</th><th style={styles.th}>Attainment</th><th style={styles.th}>Rep pool</th></tr></thead>
                <tbody>
                  {storeCategoryData(storeCategory).map((s, i) => (
                    <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ ...styles.td, color: '#999' }}>{i + 1}</td>
                      <td style={{ ...styles.td, fontWeight: 500 }}>{s.store?.store_name || s.name}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>Southwest</td>
                      <td style={styles.td}>{s.store?.manager_name || '—'}</td>
                      <td style={styles.td}><AttBadge att={s.att / 100} /></td>
                      <td style={styles.td}>{s.store ? fmt(s.store.rep_pool) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Visual comparison</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={storeCategoryData(storeCategory)} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(v) => v + '%'} />
                  <Bar dataKey="att" name="Attainment" fill="#185FA5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topreps' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Top reps by incentive — Jan 2025 — click rep name to view dashboard</div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Rep</th><th style={styles.th}>Store</th><th style={styles.th}>Rateplans</th><th style={styles.th}>Devices</th><th style={styles.th}>Features</th><th style={styles.th}>Credit Cards</th><th style={styles.th}>Total</th></tr></thead>
            <tbody>
              {(data.top_reps || []).slice(0, 15).map((r, i) => (
                <tr key={r.rep_code} onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ ...styles.td, color: '#999' }}>{i + 1}</td>
                  <td style={{ ...styles.td, color: '#185FA5', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }}
                    onClick={() => setViewAsUser({ role: 'rep', code: r.rep_code, name: r.rep_name })}>
                    {r.rep_name}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#999' }}>{r.store_name}</td>
                  <td style={styles.td}>{r.breakdown?.rateplan !== undefined ? fmt(r.breakdown.rateplan) : '—'}</td>
                  <td style={styles.td}>{r.breakdown?.device !== undefined ? fmt(r.breakdown.device) : '—'}</td>
                  <td style={styles.td}>{r.breakdown?.feature !== undefined ? fmt(r.breakdown.feature) : '—'}</td>
                  <td style={styles.td}>{r.breakdown?.credit_card !== undefined ? fmt(r.breakdown.credit_card) : '—'}</td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(r.total_payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'insights' && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Top 5 rateplans by rate</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Rateplan</th><th style={styles.th}>Code</th><th style={styles.th}>Rep rate</th></tr></thead>
              <tbody>
                {rpConfigs.slice(0, 5).map((c, i) => (
                  <tr key={i}><td style={{ ...styles.td, color: '#999' }}>{i + 1}</td><td style={{ ...styles.td, fontWeight: 500 }}>{c.product_description}</td><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{fmt(c.rep_flat_rate)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Top 5 features by rate</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Feature</th><th style={styles.th}>Code</th><th style={styles.th}>Rep rate</th></tr></thead>
              <tbody>
                {ftConfigs.slice(0, 5).map((c, i) => (
                  <tr key={i}><td style={{ ...styles.td, color: '#999' }}>{i + 1}</td><td style={{ ...styles.td, fontWeight: 500 }}>{c.product_description}</td><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{fmt(c.rep_flat_rate)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Devices — new activations</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Device</th><th style={styles.th}>Code</th><th style={styles.th}>Rep rate</th></tr></thead>
              <tbody>
                {dvConfigs.slice(0, 5).map((c, i) => (
                  <tr key={i}><td style={{ ...styles.td, color: '#999' }}>{i + 1}</td><td style={{ ...styles.td, fontWeight: 500 }}>{c.product_description}</td><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{fmt(c.rep_flat_rate)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Devices — upgrades</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Device</th><th style={styles.th}>Code</th><th style={styles.th}>Rep rate</th></tr></thead>
              <tbody>
                {dvConfigs.slice(0, 5).map((c, i) => (
                  <tr key={i}><td style={{ ...styles.td, color: '#999' }}>{i + 1}</td><td style={{ ...styles.td, fontWeight: 500 }}>{c.product_description}</td><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{fmt(c.rep_flat_rate)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div>
          <div style={styles.grid2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Rateplan rates</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Code</th><th style={styles.th}>Description</th><th style={styles.th}>Rep rate</th></tr></thead>
                <tbody>{rpConfigs.map((c, i) => <tr key={i}><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{c.product_description}</td><td style={{ ...styles.td, fontWeight: 600 }}>{fmt(c.rep_flat_rate)}</td></tr>)}</tbody>
              </table>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Feature rates</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Code</th><th style={styles.th}>Description</th><th style={styles.th}>Rep rate</th></tr></thead>
                <tbody>{ftConfigs.map((c, i) => <tr key={i}><td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{c.product_code}</td><td style={styles.td}>{c.product_description}</td><td style={{ ...styles.td, fontWeight: 600 }}>{fmt(c.rep_flat_rate)}</td></tr>)}</tbody>
              </table>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Device & accessory rates</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Type</th><th style={styles.th}>Description</th><th style={styles.th}>Rep rate</th></tr></thead>
                <tbody>{[...dvConfigs, ...acConfigs].map((c, i) => <tr key={i}><td style={{ ...styles.td, fontSize: 11, color: '#999', textTransform: 'capitalize' }}>{c.product_type}</td><td style={styles.td}>{c.product_description}</td><td style={{ ...styles.td, fontWeight: 600 }}>{fmt(c.rep_flat_rate)}</td></tr>)}</tbody>
              </table>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>System configuration</div>
              <table style={styles.table}>
                <tbody>
                  <tr><td style={styles.td}>Chargeback window</td><td style={{ ...styles.td, fontWeight: 600 }}>120 days</td></tr>
                  <tr><td style={styles.td}>Manager payout floor</td><td style={{ ...styles.td, fontWeight: 600 }}>50% attainment</td></tr>
                  <tr><td style={styles.td}>Manager payout cap</td><td style={{ ...styles.td, fontWeight: 600 }}>130% attainment</td></tr>
                  <tr><td style={styles.td}>RM payout floor</td><td style={{ ...styles.td, fontWeight: 600 }}>50% avg region attainment</td></tr>
                  <tr><td style={styles.td}>RM payout cap</td><td style={{ ...styles.td, fontWeight: 600 }}>130% avg region attainment</td></tr>
                  <tr><td style={styles.td}>RM TTI</td><td style={{ ...styles.td, fontWeight: 600 }}>$11,700</td></tr>
                  <tr><td style={styles.td}>Payment cycle</td><td style={{ ...styles.td, fontWeight: 600 }}>Monthly + 10 days</td></tr>
                  <tr><td style={styles.td}>Store multiplier range</td><td style={{ ...styles.td, fontWeight: 600 }}>0.8x – 1.2x</td></tr>
                  <tr><td style={styles.td}>Credit Card SPIFF — Rep</td><td style={{ ...styles.td, fontWeight: 600 }}>$25 flat</td></tr>
                  <tr><td style={styles.td}>Credit Card SPIFF — Store Manager</td><td style={{ ...styles.td, fontWeight: 600 }}>$10 flat</td></tr>
                  <tr><td style={styles.td}>Credit Card SPIFF — Region Manager</td><td style={{ ...styles.td, fontWeight: 600 }}>$10 flat</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Transactional data — region wide</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {txnTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTxnTab(t.id)} style={{
                padding: '5px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                border: activeTxnTab === t.id ? '1.5px solid #185FA5' : '1px solid #ddd',
                background: activeTxnTab === t.id ? '#E6F1FB' : '#f8f8f8',
                color: activeTxnTab === t.id ? '#0C447C' : '#666',
                fontWeight: activeTxnTab === t.id ? 600 : 400
              }}>{t.label}</button>
            ))}
          </div>
          <RegionTxnFetcher txnKey={activeTxnTab} />
        </div>
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 1300, margin: '0 auto', padding: '1rem 1.5rem', fontFamily: 'system-ui, sans-serif' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee', marginBottom: 24, flexWrap: 'wrap', gap: 8 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  topRight: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  brand: { fontSize: 16, fontWeight: 600 },
  badge: { background: '#EEEDFE', color: '#3C3489', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  userName: { fontSize: 13, color: '#555' },
  period: { fontSize: 12, color: '#999' },
  personaSelect: { fontSize: 12, padding: '5px 8px', border: '1px solid #ddd', borderRadius: 8, background: '#f8f8f8', color: '#333', maxWidth: 220 },
  logoutBtn: { fontSize: 12, padding: '5px 12px', border: '1px solid #ddd', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#666' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 },
  metric: { background: '#f8f8f8', borderRadius: 8, padding: '1rem' },
  metricLabel: { fontSize: 10, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 20, fontWeight: 600, color: '#111' },
  metricSub: { fontSize: 11, color: '#aaa', marginTop: 4 },
  tabs: { display: 'flex', gap: 2, borderBottom: '1px solid #eee', marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#666', borderBottom: '2px solid transparent', marginBottom: -1 },
  tabActive: { color: '#111', borderBottom: '2px solid #185FA5', fontWeight: 500 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  card: { background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 16 },
  cardTitle: { fontSize: 12, fontWeight: 500, color: '#999', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.3 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  td: { padding: '7px 8px', borderBottom: '1px solid #f5f5f5', color: '#333', whiteSpace: 'nowrap' },
  insightBox: { background: '#f8f8f8', borderRadius: 8, padding: '0.75rem' },
  insightLabel: { fontSize: 11, color: '#999', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.3 },
  insightValue: { fontSize: 20, fontWeight: 600, color: '#111' },
}