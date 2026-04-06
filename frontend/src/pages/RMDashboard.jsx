import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDistrictSummary, getManagerPayout, getStoreReps, getRepPayout } from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#185FA5', '#3B6D11', '#BA7517', '#854F0B', '#533AB7']

function fmt(n) { return '$' + Math.round(n).toLocaleString() }
function pct(n) { return Math.round(n * 100) + '%' }

function AttBadge({ att }) {
  const a = parseFloat(att)
  if (a >= 1.2) return <span style={{ background: '#EAF3DE', color: '#27500A', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  if (a >= 1.0) return <span style={{ background: '#E6F1FB', color: '#0C447C', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  if (a >= 0.8) return <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
  return <span style={{ background: '#FCEBEB', color: '#791F1F', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{pct(a)}</span>
}

function MultBadge({ mult }) {
  const m = parseFloat(mult)
  if (m >= 1.2) return <span style={{ background: '#EAF3DE', color: '#27500A', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{m}x</span>
  if (m >= 1.0) return <span style={{ background: '#E6F1FB', color: '#0C447C', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{m}x</span>
  return <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{m}x</span>
}

function Badge({ text, type }) {
  const colors = {
    green: ['#EAF3DE', '#27500A'],
    blue: ['#E6F1FB', '#0C447C'],
    amber: ['#FAEEDA', '#633806'],
    purple: ['#EEEDFE', '#3C3489']
  }
  const [bg, color] = colors[type] || colors.blue
  return <span style={{ background: bg, color, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>{text}</span>
}

function RegionTransactionTab({ title, note, txnKey, rmCode }) {
  const [txnData, setTxnData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTxnData(null)
    const fetchTxns = async () => {
      try {
        const res = await fetch(`/api/payout/region/${rmCode}/transactions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        setTxnData(data.transactions)
      } catch (e) {
        setTxnData({})
      }
      setLoading(false)
    }
    fetchTxns()
  }, [rmCode, txnKey])

  if (loading) return <div style={{ padding: '2rem', color: '#999', fontSize: 13 }}>Loading transactions...</div>

  const rows = (txnData?.[txnKey] || [])

  const columns = {
    rateplan: ['Date', 'Plan', 'Subscriber ID', 'Phone number', 'Rep code', 'Store', 'Type', 'Cust paid'],
    feature: ['Date', 'Feature', 'Subscriber ID', 'Phone number', 'Rep code', 'Store', 'MRC'],
    accessory: ['Date', 'Item', 'Subscriber ID', 'Phone number', 'Rep code', 'Store', 'Cust paid'],
    device: ['Date', 'Device', 'Subscriber ID', 'Phone number', 'Rep code', 'Store', 'Sale type', 'Cust paid'],
    credit_card: ['Date', 'Product', 'Rep code', 'Store', 'Type'],
  }

  const getRow = (t) => {
    if (txnKey === 'rateplan') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_code, t.store_name, <Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} />, fmt(t.customer_paid || 0)]
    if (txnKey === 'feature') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_code, t.store_name, fmt(t.mrc || 0)]
    if (txnKey === 'accessory') return [t.date, t.description, t.subscriber_id || '—', t.phone_number || '—', t.rep_code, t.store_name, fmt(t.customer_paid || 0)]
    if (txnKey === 'device') return [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_code, t.store_name, <Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} />, fmt(t.customer_paid || 0)]
    if (txnKey === 'credit_card') return [t.date, t.description, t.rep_code, t.store_name, <Badge text="SPIFF" type="purple" />]
    return []
  }

  const cols = columns[txnKey] || []

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#bbb', marginBottom: 16 }}>{note} · {rows.length} transactions</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{cols.map(c => <th key={c} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
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

export default function RMDashboard() {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('payout')
  const [chartSubTab, setChartSubTab] = useState('overall')
  const [drillStore, setDrillStore] = useState(null)
  const [drillData, setDrillData] = useState(null)
  const [drillReps, setDrillReps] = useState(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [drillTab, setDrillTab] = useState('payout')
  const [drillRepData, setDrillRepData] = useState(null)
  const [drillRepLoading, setDrillRepLoading] = useState(false)
  const [preloadedReps, setPreloadedReps] = useState({})
  const dmCode = user?.linkedCode

  useEffect(() => {
    if (dmCode) {
      getDistrictSummary(dmCode).then(setData).finally(() => setLoading(false))
    }
  }, [dmCode])

  const handleDrillStore = async (store) => {
    setDrillStore(store)
    setDrillTab('payout')
    setDrillRepData(null)
    setDrillLoading(true)
    const [mgr, reps] = await Promise.all([
      getManagerPayout(store.manager_code),
      getStoreReps(store.store_code)
    ])
    setDrillData(mgr)
    setDrillReps(reps.reps)
    setDrillLoading(false)
    setTimeout(() => {
      reps.reps.forEach(async (rep) => {
        try {
          const d = await getRepPayout(rep.rep_code)
          setPreloadedReps(prev => ({ ...prev, [rep.rep_code]: d }))
        } catch {}
      })
    }, 500)
  }

  const handleDrillRep = async (rep) => {
    setDrillRepLoading(true)
    if (preloadedReps[rep.rep_code]) {
      setDrillRepData({ rep, data: preloadedReps[rep.rep_code] })
      setDrillRepLoading(false)
    } else {
      const d = await getRepPayout(rep.rep_code)
      setDrillRepData({ rep, data: d })
      setDrillRepLoading(false)
    }
  }

  if (loading) return (
    <div style={styles.loading}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Loading region data...</div>
        <div style={{ fontSize: 13, color: '#aaa' }}>Calculating payouts across all stores and reps — this may take a few seconds</div>
      </div>
    </div>
  )
  if (!data) return <div style={styles.loading}>No data found</div>

  const isAtFloor = data.average_attainment < (data.payout_rules?.floor || 0.5)
  const isAtCap = data.average_attainment >= (data.payout_rules?.cap || 1.3)

  const overallChartData = data.stores
    .sort((a, b) => b.overall_attainment - a.overall_attainment)
    .map(s => ({
      name: s.store_name.replace('Phoenix ', 'PHX ').replace('Scottsdale ', 'SCT ').replace('Tempe ', 'TMP ').replace('Mesa ', 'MSA ').replace('Gilbert ', 'GLB '),
      att: Math.round(s.overall_attainment * 100)
    }))

  const categoryChartData = {
    'Rateplan Volume': data.stores.map(s => ({ name: s.store_name.split(' ')[0], value: Math.round((s.attainments?.rp_volume || 0) * 100) })),
    'Rateplan Revenue': data.stores.map(s => ({ name: s.store_name.split(' ')[0], value: Math.round((s.attainments?.rp_revenue || 0) * 100) })),
    'Feature Revenue': data.stores.map(s => ({ name: s.store_name.split(' ')[0], value: Math.round((s.attainments?.feature_revenue || 0) * 100) })),
    'Accessory Revenue': data.stores.map(s => ({ name: s.store_name.split(' ')[0], value: Math.round((s.attainments?.accessory_revenue || 0) * 100) })),
    'Device Revenue': data.stores.map(s => ({ name: s.store_name.split(' ')[0], value: Math.round((s.attainments?.device_revenue || 0) * 100) })),
  }

  // Rep drill-in view
  if (drillStore && drillData && drillRepData) {
    const { summary, transactions, store_multiplier } = drillRepData.data
    const pieData = [
      { name: 'Rateplans', value: summary.rateplan },
      { name: 'Features', value: summary.feature },
      { name: 'Accessories', value: summary.accessory },
      { name: 'Devices', value: summary.device },
      { name: 'Credit Cards', value: summary.credit_card },
    ].filter(d => d.value > 0)

    const repTabs = [
      { id: 'summary', label: 'Summary' },
      { id: 'rp', label: `Rateplans (${transactions.rateplan.length})` },
      { id: 'ft', label: `Features (${transactions.feature.length})` },
      { id: 'ac', label: `Accessories (${transactions.accessory.length})` },
      { id: 'dv', label: `Devices (${transactions.device.length})` },
      { id: 'cc', label: `Credit Cards (${transactions.credit_card.length})` },
    ]

    const [repTab, setRepTab] = useState('summary')

    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div style={styles.topLeft}>
            <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
            <span style={styles.badge}>Region Manager</span>
          </div>
          <div style={styles.topRight}>
            <button style={styles.backBtn} onClick={() => setDrillRepData(null)}>← Back to {drillStore.store_name}</button>
            <button style={{...styles.logoutBtn, marginRight: 8}} onClick={() => window.location.href = '/about'}>About</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
          Southwest Region › <span style={{ color: '#185FA5', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setDrillRepData(null)}>{drillStore.store_name}</span> › <strong style={{ color: '#185FA5' }}>{drillRepData.rep.rep_name}</strong>
        </div>
        <div style={styles.metrics}>
          <div style={styles.metric}><div style={styles.metricLabel}>Total incentive</div><div style={styles.metricValue}>{fmt(summary.total)}</div><div style={styles.metricSub}>Payment: {drillRepData.data.payment_date}</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Rateplans sold</div><div style={styles.metricValue}>{transactions.rateplan.length}</div><div style={styles.metricSub}>{fmt(summary.rateplan)} earned</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Devices sold</div><div style={styles.metricValue}>{transactions.device.length}</div><div style={styles.metricSub}>{fmt(summary.device)} earned</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Store multiplier</div><div style={styles.metricValue}>{store_multiplier}x</div><div style={styles.metricSub}>{drillStore.store_name}</div></div>
        </div>
        <div style={styles.tabs}>
          {repTabs.map(t => (
            <button key={t.id} style={{ ...styles.tab, ...(repTab === t.id ? styles.tabActive : {}) }} onClick={() => setRepTab(t.id)}>{t.label}</button>
          ))}
        </div>
        {repTab === 'summary' && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Payout breakdown</div>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Category</th><th style={styles.th}>Net units</th><th style={styles.th}>Incentive</th></tr></thead>
                <tbody>
                  <tr><td style={styles.td}>Rateplans</td><td style={styles.td}>{transactions.rateplan.length}</td><td style={styles.td}>{fmt(summary.rateplan)}</td></tr>
                  <tr><td style={styles.td}>Features</td><td style={styles.td}>{transactions.feature.length}</td><td style={styles.td}>{fmt(summary.feature)}</td></tr>
                  <tr><td style={styles.td}>Accessories</td><td style={styles.td}>{transactions.accessory.length}</td><td style={styles.td}>{fmt(summary.accessory)}</td></tr>
                  <tr><td style={styles.td}>Devices</td><td style={styles.td}>{transactions.device.length}</td><td style={styles.td}>{fmt(summary.device)}</td></tr>
                  <tr><td style={styles.td}>Credit Cards (SPIFF)</td><td style={styles.td}>{transactions.credit_card.length}</td><td style={styles.td}>{fmt(summary.credit_card)}</td></tr>
                  <tr><td style={{ ...styles.td, fontWeight: 600 }}>Total</td><td style={styles.td}></td><td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(summary.total)}</td></tr>
                </tbody>
              </table>
              <div style={styles.multNote}>Store multiplier <strong>{store_multiplier}x</strong> applied to all product rates</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Incentive mix</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.legend}>
                {pieData.map((d, i) => (
                  <span key={i} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: COLORS[i % COLORS.length] }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        {repTab === 'rp' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Rateplan transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Plan</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Type</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.rateplan.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td><td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.rep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.data.store_code}</td>
                      <td style={styles.td}><Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} /></td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {repTab === 'ft' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Feature transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Feature</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>MRC</th></tr></thead>
                <tbody>
                  {transactions.feature.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td><td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.rep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.data.store_code}</td>
                      <td style={styles.td}>{fmt(t.mrc || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {repTab === 'ac' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Accessory transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Item</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.accessory.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td><td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.rep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.data.store_code}</td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {repTab === 'dv' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Device transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Device</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Sale type</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.device.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td><td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.rep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRepData.data.store_code}</td>
                      <td style={styles.td}><Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} /></td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {repTab === 'cc' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Credit card SPIFF transactions</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Product</th><th style={styles.th}>Type</th></tr></thead>
              <tbody>
                {transactions.credit_card.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={styles.td}><Badge text="SPIFF" type="purple" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // Store manager drill-in view
  if (drillStore && drillData && drillReps) {
    if (drillLoading) return (
      <div style={styles.loading}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Loading {drillStore.store_name}...</div>
        </div>
      </div>
    )

    const attChartData = [
      { name: 'Rateplan Volume', target: 100, attainment: Math.round(drillData.store_stats.attainments.rp_volume * 100) },
      { name: 'Rateplan Revenue', target: 100, attainment: Math.round(drillData.store_stats.attainments.rp_revenue * 100) },
      { name: 'Feature Revenue', target: 100, attainment: Math.round(drillData.store_stats.attainments.feature_revenue * 100) },
      { name: 'Accessory Revenue', target: 100, attainment: Math.round(drillData.store_stats.attainments.accessory_revenue * 100) },
      { name: 'Device Revenue', target: 100, attainment: Math.round(drillData.store_stats.attainments.device_revenue * 100) },
    ]

    const mgrTabs = [
      { id: 'payout', label: 'My payout' },
      { id: 'store', label: 'Store attainment' },
      { id: 'reps', label: 'Rep leaderboard' },
    ]

    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div style={styles.topLeft}>
            <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
            <span style={styles.badge}>Region Manager</span>
          </div>
          <div style={styles.topRight}>
            <button style={styles.backBtn} onClick={() => { setDrillStore(null); setDrillData(null); setDrillReps(null) }}>← Back to region</button>
            <button style={{...styles.logoutBtn, marginRight: 8}} onClick={() => window.location.href = '/about'}>About</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
          Southwest Region › <strong>{drillStore.store_name}</strong> › {drillStore.manager_name}
        </div>
        <div style={styles.metrics}>
          <div style={styles.metric}><div style={styles.metricLabel}>Manager payout</div><div style={styles.metricValue}>{fmt(drillData.total_payout)}</div><div style={styles.metricSub}>TTI: {fmt(drillData.tti)}</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Store attainment</div><div style={styles.metricValue}>{pct(drillData.store_attainment)}</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Net RP adds</div><div style={styles.metricValue}>{drillData.store_stats.actuals.rp_net_adds}</div><div style={styles.metricSub}>Target: {drillData.store_stats.quotas.rp_volume}</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Reps in store</div><div style={styles.metricValue}>{drillReps.length}</div></div>
        </div>
        <div style={styles.tabs}>
          {mgrTabs.map(t => (
            <button key={t.id} style={{ ...styles.tab, ...(drillTab === t.id ? styles.tabActive : {}) }} onClick={() => setDrillTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {drillTab === 'payout' && (
          <div style={styles.grid2}>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Payout calculation</div>
              <table style={styles.table}>
                <tbody>
                  <tr><td style={styles.td}>Total target incentive (TTI)</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(drillData.tti)}</td></tr>
                  <tr><td style={styles.td}>Store attainment</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{pct(drillData.store_attainment)}</td></tr>
                  <tr><td style={styles.td}>Payout floor</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(drillData.payout_rules.floor)}</td></tr>
                  <tr><td style={styles.td}>Payout cap</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(drillData.payout_rules.cap)}</td></tr>
                  <tr><td style={{ ...styles.td, color: '#999', fontSize: 12 }} colSpan={2}>Base payout = TTI × Store Attainment</td></tr>
                  <tr><td style={styles.td}>Base payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(drillData.base_payout)}</td></tr>
                  <tr><td style={styles.td}>Credit Cards (SPIFF)</td><td style={{ ...styles.td, textAlign: 'right' }}>{fmt(drillData.cc_payout)}</td></tr>
                  <tr><td style={{ ...styles.td, fontWeight: 600 }}>Total payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: '#185FA5' }}>{fmt(drillData.total_payout)}</td></tr>
                </tbody>
              </table>
              {drillData.store_attainment < drillData.payout_rules.floor && (
                <div style={{ marginTop: 12, background: '#FCEBEB', color: '#791F1F', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                  Store attainment is below the {pct(drillData.payout_rules.floor)} payout floor — base payout is $0.
                </div>
              )}
              {drillData.store_attainment >= drillData.payout_rules.cap && (
                <div style={{ marginTop: 12, background: '#FAEEDA', color: '#633806', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                  Payout is capped at {pct(drillData.payout_rules.cap)} attainment.
                </div>
              )}
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>Target attainment by category</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={attChartData} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 150]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip formatter={(v) => v + '%'} />
                  <Bar dataKey="target" fill="#e0e0e0" name="Target" />
                  <Bar dataKey="attainment" fill="#185FA5" name="Attainment" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {drillTab === 'store' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Store performance vs target</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Metric</th><th style={styles.th}>Target</th><th style={styles.th}>Actual</th><th style={styles.th}>Attainment</th></tr></thead>
              <tbody>
                <tr><td style={styles.td}>Rateplan net adds</td><td style={styles.td}>{drillData.store_stats.quotas.rp_volume}</td><td style={styles.td}>{drillData.store_stats.actuals.rp_net_adds}</td><td style={styles.td}><AttBadge att={drillData.store_stats.attainments.rp_volume} /></td></tr>
                <tr><td style={styles.td}>Rateplan revenue</td><td style={styles.td}>{fmt(drillData.store_stats.quotas.rp_revenue)}</td><td style={styles.td}>{fmt(drillData.store_stats.actuals.rp_revenue)}</td><td style={styles.td}><AttBadge att={drillData.store_stats.attainments.rp_revenue} /></td></tr>
                <tr><td style={styles.td}>Feature revenue</td><td style={styles.td}>{fmt(drillData.store_stats.quotas.feature_revenue)}</td><td style={styles.td}>{fmt(drillData.store_stats.actuals.feature_revenue)}</td><td style={styles.td}><AttBadge att={drillData.store_stats.attainments.feature_revenue} /></td></tr>
                <tr><td style={styles.td}>Accessory revenue</td><td style={styles.td}>{fmt(drillData.store_stats.quotas.accessory_revenue)}</td><td style={styles.td}>{fmt(drillData.store_stats.actuals.accessory_revenue)}</td><td style={styles.td}><AttBadge att={drillData.store_stats.attainments.accessory_revenue} /></td></tr>
                <tr><td style={styles.td}>Device revenue</td><td style={styles.td}>{fmt(drillData.store_stats.quotas.device_revenue)}</td><td style={styles.td}>{fmt(drillData.store_stats.actuals.device_revenue)}</td><td style={styles.td}><AttBadge att={drillData.store_stats.attainments.device_revenue} /></td></tr>
                <tr><td style={{ ...styles.td, fontWeight: 600 }}>Overall</td><td style={styles.td}>—</td><td style={styles.td}>—</td><td style={styles.td}><AttBadge att={drillData.store_attainment} /></td></tr>
              </tbody>
            </table>
          </div>
        )}

        {drillTab === 'reps' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Rep leaderboard — click a rep name to view details</div>
            {drillRepLoading && <div style={{ padding: '1rem', color: '#999', fontSize: 13 }}>Loading rep data...</div>}
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Rep</th><th style={styles.th}>Rateplans</th><th style={styles.th}>Devices</th><th style={styles.th}>Features</th><th style={styles.th}>Credit Cards</th><th style={styles.th}>Total payout</th></tr></thead>
              <tbody>
                {drillReps.map((r, i) => (
                  <tr key={r.rep_code}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ ...styles.td, color: '#999' }}>{i + 1}</td>
                    <td style={{ ...styles.td, color: '#185FA5', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline' }} onClick={() => handleDrillRep(r)}>{r.rep_name}</td>
                    <td style={styles.td}>{r.rp_count}</td>
                    <td style={styles.td}>{r.dv_count}</td>
                    <td style={styles.td}>{r.ft_count}</td>
                    <td style={styles.td}>{r.cc_count}</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(r.total_payout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  const mainTabs = [
    { id: 'payout', label: 'My payout' },
    { id: 'stores', label: 'Store rankings' },
    { id: 'chart', label: 'Attainment chart' },
    { id: 'txn_rp', label: 'Rateplans' },
    { id: 'txn_ft', label: 'Features' },
    { id: 'txn_ac', label: 'Accessories' },
    { id: 'txn_dv', label: 'Devices' },
    { id: 'txn_cc', label: 'Credit Cards' },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.topLeft}>
          <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
          <span style={styles.badge}>Region Manager</span>
          <span style={styles.userName}>{data.rm_name || 'Kevin Park'}</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.period}>Jan 2025</span>
          <span style={styles.storeName}>{data.region_name || 'Southwest Region'}</span>
          <button style={{...styles.logoutBtn, marginRight: 8}} onClick={() => window.location.href = '/about'}>About</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={styles.metrics}>
        <div style={styles.metric}><div style={styles.metricLabel}>My total payout</div><div style={styles.metricValue}>{fmt(data.total_payout)}</div><div style={styles.metricSub}>Payment: {data.payment_date}</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Region avg attainment</div><div style={styles.metricValue}>{pct(data.average_attainment)}</div><div style={styles.metricSub}>Across {data.store_count} stores</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Total stores</div><div style={styles.metricValue}>{data.store_count}</div><div style={styles.metricSub}>Southwest Region</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>TTI</div><div style={styles.metricValue}>{fmt(data.tti || 11700)}</div><div style={styles.metricSub}>Total target incentive</div></div>
      </div>

      <div style={styles.tabs}>
        {mainTabs.map(t => (
          <button key={t.id} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'payout' && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Payout calculation</div>
            <table style={styles.table}>
              <tbody>
                <tr><td style={styles.td}>Total target incentive (TTI)</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(data.tti || 11700)}</td></tr>
                <tr><td style={styles.td}>Region avg attainment</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{pct(data.average_attainment)}</td></tr>
                <tr><td style={styles.td}>Payout floor</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(data.payout_rules?.floor || 0.5)}</td></tr>
                <tr><td style={styles.td}>Payout cap</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(data.payout_rules?.cap || 1.3)}</td></tr>
                <tr><td style={{ ...styles.td, color: '#999', fontSize: 12 }} colSpan={2}>Base payout = TTI × Region Avg Attainment</td></tr>
                <tr><td style={styles.td}>Base payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(data.base_payout || 0)}</td></tr>
                <tr><td style={styles.td}>Credit Card SPIFF</td><td style={{ ...styles.td, textAlign: 'right' }}>{fmt(data.cc_payout)}</td></tr>
                <tr><td style={{ ...styles.td, fontWeight: 600 }}>Total payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: '#185FA5' }}>{fmt(data.total_payout)}</td></tr>
              </tbody>
            </table>
            {isAtFloor && (
              <div style={{ marginTop: 12, background: '#FCEBEB', color: '#791F1F', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                Region attainment is below the {pct(data.payout_rules?.floor || 0.5)} payout floor — base payout is $0.
              </div>
            )}
            {isAtCap && (
              <div style={{ marginTop: 12, background: '#FAEEDA', color: '#633806', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                Payout is capped at {pct(data.payout_rules?.cap || 1.3)} attainment.
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>Payment date: {data.payment_date}</div>
          </div>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Store attainment breakdown</div>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Store</th><th style={styles.th}>Store Manager</th><th style={styles.th}>Store attainment</th><th style={styles.th}>RSM payout</th></tr></thead>
              <tbody>
                {data.stores.sort((a, b) => b.overall_attainment - a.overall_attainment).map(s => (
                  <tr key={s.store_code}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={styles.td}>{s.store_name}</td>
                    <td style={{ ...styles.td, color: '#185FA5', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }} onClick={() => handleDrillStore(s)}>{s.manager_name}</td>
                    <td style={styles.td}><AttBadge att={s.overall_attainment} /></td>
                    <td style={styles.td}>{fmt(s.manager_payout)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #ddd' }}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>Region avg</td>
                  <td style={styles.td}></td>
                  <td style={styles.td}><AttBadge att={data.average_attainment} /></td>
                  <td style={styles.td}></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stores' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Store performance — click store manager to drill in</div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Store</th><th style={styles.th}>Store Manager</th><th style={styles.th}>Attainment</th><th style={styles.th}>Rateplan net adds</th><th style={styles.th}>Rateplan Rev</th><th style={styles.th}>Mult</th><th style={styles.th}>RSM payout</th></tr></thead>
            <tbody>
              {data.stores.sort((a, b) => b.overall_attainment - a.overall_attainment).map((s, i) => (
                <tr key={s.store_code}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ ...styles.td, color: '#999' }}>{i + 1}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{s.store_name}</td>
                  <td style={{ ...styles.td, color: '#185FA5', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500 }} onClick={() => handleDrillStore(s)}>{s.manager_name}</td>
                  <td style={styles.td}><AttBadge att={s.overall_attainment} /></td>
                  <td style={styles.td}>{s.actuals.rp_net_adds}</td>
                  <td style={styles.td}>{fmt(s.actuals.rp_revenue)}</td>
                  <td style={styles.td}><MultBadge mult={s.store_multiplier} /></td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(s.manager_payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'chart' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Attainment chart</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {['overall', 'Rateplan Volume', 'Rateplan Revenue', 'Feature Revenue', 'Accessory Revenue', 'Device Revenue'].map(opt => (
              <button key={opt} onClick={() => setChartSubTab(opt)} style={{
                padding: '5px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                border: chartSubTab === opt ? '1.5px solid #185FA5' : '1px solid #ddd',
                background: chartSubTab === opt ? '#E6F1FB' : '#f8f8f8',
                color: chartSubTab === opt ? '#0C447C' : '#666',
                fontWeight: chartSubTab === opt ? 600 : 400
              }}>
                {opt === 'overall' ? 'Overall attainment' : opt}
              </button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={chartSubTab === 'overall' ? overallChartData : categoryChartData[chartSubTab]}
              layout="vertical"
              margin={{ top: 10, right: 20, bottom: 10, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" unit="%" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => v + '%'} />
              <Bar dataKey={chartSubTab === 'overall' ? 'att' : 'value'} name="Attainment %" fill="#185FA5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'txn_rp' && <RegionTransactionTab title="Rateplan transactions — all stores" note="Region-wide rateplan activations for Jan 2025" txnKey="rateplan" rmCode="RM-001" />}
      {activeTab === 'txn_ft' && <RegionTransactionTab title="Feature transactions — all stores" note="Region-wide feature activations for Jan 2025" txnKey="feature" rmCode="RM-001" />}
      {activeTab === 'txn_ac' && <RegionTransactionTab title="Accessory transactions — all stores" note="Region-wide accessory sales for Jan 2025" txnKey="accessory" rmCode="RM-001" />}
      {activeTab === 'txn_dv' && <RegionTransactionTab title="Device transactions — all stores" note="Region-wide device sales for Jan 2025" txnKey="device" rmCode="RM-001" />}
      {activeTab === 'txn_cc' && <RegionTransactionTab title="Credit card SPIFF transactions — all stores" note="Region-wide credit card sales for Jan 2025" txnKey="credit_card" rmCode="RM-001" />}
    </div>
  )
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem', fontFamily: 'system-ui, sans-serif' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 16, color: '#666' },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee', marginBottom: 24 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  topRight: { display: 'flex', alignItems: 'center', gap: 12 },
  brand: { fontSize: 16, fontWeight: 600 },
  badge: { background: '#EAF3DE', color: '#27500A', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
  userName: { fontSize: 13, color: '#555' },
  period: { fontSize: 12, color: '#999' },
  storeName: { fontSize: 12, color: '#666' },
  logoutBtn: { fontSize: 12, padding: '4px 12px', border: '1px solid #ddd', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#666' },
  backBtn: { fontSize: 12, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 8, background: 'none', cursor: 'pointer', color: '#185FA5' },
  metrics: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  metric: { background: '#f8f8f8', borderRadius: 8, padding: '1rem' },
  metricLabel: { fontSize: 11, color: '#999', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { fontSize: 22, fontWeight: 600, color: '#111' },
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
  multNote: { marginTop: 12, fontSize: 12, color: '#999', background: '#f8f8f8', padding: '8px 12px', borderRadius: 8 },
  legend: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#666' },
  legendDot: { width: 10, height: 10, borderRadius: 2, display: 'inline-block' },
}