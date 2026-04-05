import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getManagerPayout, getStoreReps, getRepPayout } from '../services/api'
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

function StoreTransactionTab({ title, note, storeCode, txnKey, columns, renderRow }) {
  const [txnData, setTxnData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setTxnData(null)
    const fetchTxns = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/payout/store/${storeCode}/transactions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await res.json()
        setTxnData(data.transactions)
      } catch (e) {
        setTxnData({})
      }
      setLoading(false)
    }
    if (storeCode) fetchTxns()
  }, [storeCode, txnKey])

  if (loading) return <div style={{ padding: '2rem', color: '#999', fontSize: 13 }}>Loading transactions...</div>

  const rows = (txnData?.[txnKey] || [])

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#999', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#bbb', marginBottom: 16 }}>{note} · {rows.length} transactions</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>{columns.map(c => <th key={c} style={{ textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999', padding: '6px 8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={i}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                {renderRow(t).map((cell, j) => (
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

export default function ManagerDashboard({ overrideMgrCode } = {}) {
  const { user, logout } = useAuth()
  const [data, setData] = useState(null)
  const [reps, setReps] = useState([])
  const [drillRep, setDrillRep] = useState(null)
  const [drillData, setDrillData] = useState(null)
  const [drillLoading, setDrillLoading] = useState(false)
  const [preloadedReps, setPreloadedReps] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('payout')
  const [drillTab, setDrillTab] = useState('summary')
  const mgrCode = overrideMgrCode || user?.linkedCode

  useEffect(() => {
    if (mgrCode) {
      getManagerPayout(mgrCode).then(d => {
        setData(d)
        return getStoreReps(d.store_code)
      }).then(r => {
        setReps(r.reps)
        setTimeout(() => {
          r.reps.forEach(async (rep) => {
            try {
              const d = await getRepPayout(rep.rep_code)
              setPreloadedReps(prev => ({ ...prev, [rep.rep_code]: d }))
            } catch {}
          })
        }, 1000)
      }).finally(() => setLoading(false))
    }
  }, [mgrCode])

  const handleDrillRep = async (rep) => {
    setDrillRep(rep)
    setDrillTab('summary')
    setDrillLoading(true)
    if (preloadedReps[rep.rep_code]) {
      setDrillData(preloadedReps[rep.rep_code])
      setDrillLoading(false)
    } else {
      const d = await getRepPayout(rep.rep_code)
      setDrillData(d)
      setDrillLoading(false)
    }
  }

  if (loading) return <div style={styles.loading}>Loading...</div>
  if (!data) return <div style={styles.loading}>No data found</div>

  const { store_stats, store_attainment, base_payout, cc_payout, total_payout, tti, payment_date, manager_name, store_name, payout_rules } = data

  const attChartData = [
    { name: 'Rateplan Volume', target: 100, attainment: Math.round(store_stats.attainments.rp_volume * 100) },
    { name: 'Rateplan Revenue', target: 100, attainment: Math.round(store_stats.attainments.rp_revenue * 100) },
    { name: 'Feature Revenue', target: 100, attainment: Math.round(store_stats.attainments.feature_revenue * 100) },
    { name: 'Accessory Revenue', target: 100, attainment: Math.round(store_stats.attainments.accessory_revenue * 100) },
    { name: 'Device Revenue', target: 100, attainment: Math.round(store_stats.attainments.device_revenue * 100) },
  ]

  const isAtFloor = store_attainment < payout_rules.floor
  const isAtCap = store_attainment >= payout_rules.cap

  if (drillRep && drillLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div style={styles.topLeft}>
            <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
            <span style={styles.badge}>Store Manager</span>
            <span style={styles.userName}>{manager_name}</span>
          </div>
          <div style={styles.topRight}>
            <span style={styles.period}>Jan 2025</span>
            <button style={styles.backBtn} onClick={() => { setDrillRep(null); setDrillData(null); setActiveTab('reps') }}>← Back to rep leaderboard</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
          {store_name} › <strong style={{ color: '#185FA5' }}>{drillRep.rep_name}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#999', fontSize: 14 }}>
          Loading {drillRep.rep_name}'s data...
        </div>
      </div>
    )
  }

  if (drillRep && drillData) {
    const { summary, transactions, store_multiplier } = drillData

    const repTabs = [
      { id: 'summary', label: 'Summary' },
      { id: 'rp', label: `Rateplans (${transactions.rateplan.length})` },
      { id: 'ft', label: `Features (${transactions.feature.length})` },
      { id: 'ac', label: `Accessories (${transactions.accessory.length})` },
      { id: 'dv', label: `Devices (${transactions.device.length})` },
      { id: 'cc', label: `Credit Cards (${transactions.credit_card.length})` },
    ]

    const pieData = [
      { name: 'Rateplans', value: summary.rateplan },
      { name: 'Features', value: summary.feature },
      { name: 'Accessories', value: summary.accessory },
      { name: 'Devices', value: summary.device },
      { name: 'Credit Cards', value: summary.credit_card },
    ].filter(d => d.value > 0)

    return (
      <div style={styles.page}>
        <div style={styles.topbar}>
          <div style={styles.topLeft}>
            <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
            <span style={styles.badge}>Store Manager</span>
            <span style={styles.userName}>{manager_name}</span>
          </div>
          <div style={styles.topRight}>
            <span style={styles.period}>Jan 2025</span>
            <button style={styles.backBtn} onClick={() => { setDrillRep(null); setDrillData(null); setActiveTab('reps') }}>← Back to rep leaderboard</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
          </div>
        </div>

        <div style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>
          {store_name} › <strong style={{ color: '#185FA5' }}>{drillRep.rep_name}</strong>
        </div>

        <div style={styles.metrics}>
          <div style={styles.metric}><div style={styles.metricLabel}>Total incentive</div><div style={styles.metricValue}>{fmt(summary.total)}</div><div style={styles.metricSub}>Payment: {drillData.payment_date}</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Rateplans sold</div><div style={styles.metricValue}>{transactions.rateplan.length}</div><div style={styles.metricSub}>{fmt(summary.rateplan)} earned</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Devices sold</div><div style={styles.metricValue}>{transactions.device.length}</div><div style={styles.metricSub}>{fmt(summary.device)} earned</div></div>
          <div style={styles.metric}><div style={styles.metricLabel}>Store multiplier</div><div style={styles.metricValue}>{store_multiplier}x</div><div style={styles.metricSub}>{store_name}</div></div>
        </div>

        <div style={styles.tabs}>
          {repTabs.map(t => (
            <button key={t.id} style={{ ...styles.tab, ...(drillTab === t.id ? styles.tabActive : {}) }} onClick={() => setDrillTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {drillTab === 'summary' && (
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

        {drillTab === 'rp' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Rateplan transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Plan</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Type</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.rateplan.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td>
                      <td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillData.store_code}</td>
                      <td style={styles.td}><Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} /></td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {drillTab === 'ft' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Feature transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Feature</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>MRC</th></tr></thead>
                <tbody>
                  {transactions.feature.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td>
                      <td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillData.store_code}</td>
                      <td style={styles.td}>{fmt(t.mrc || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {drillTab === 'ac' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Accessory transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Item</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.accessory.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td>
                      <td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillData.store_code}</td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {drillTab === 'dv' && (
          <div style={styles.card}>
            <div style={styles.cardTitle}>Device transactions</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Device</th><th style={styles.th}>Subscriber ID</th><th style={styles.th}>Phone number</th><th style={styles.th}>Rep code</th><th style={styles.th}>Store code</th><th style={styles.th}>Sale type</th><th style={styles.th}>Cust paid</th></tr></thead>
                <tbody>
                  {transactions.device.map((t, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{t.date}</td>
                      <td style={styles.td}>{t.description}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillRep.rep_code}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{drillData.store_code}</td>
                      <td style={styles.td}><Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} /></td>
                      <td style={styles.td}>{fmt(t.customer_paid || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {drillTab === 'cc' && (
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

  const mainTabs = [
    { id: 'payout', label: 'My payout' },
    { id: 'store', label: 'Store attainment' },
    { id: 'reps', label: 'Rep leaderboard' },
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
          <span style={styles.badge}>Store Manager</span>
          <span style={styles.userName}>{manager_name}</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.period}>Jan 2025</span>
          <span style={styles.storeName}>{store_name}</span>
          <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={styles.metrics}>
        <div style={styles.metric}><div style={styles.metricLabel}>My incentive</div><div style={styles.metricValue}>{fmt(total_payout)}</div><div style={styles.metricSub}>Payment: {payment_date}</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Store attainment</div><div style={styles.metricValue}>{pct(store_attainment)}</div><div style={styles.metricSub}>TTI: {fmt(tti)}</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Net rateplan adds</div><div style={styles.metricValue}>{store_stats.actuals.rp_net_adds}</div><div style={styles.metricSub}>Target: {store_stats.quotas.rp_volume}</div></div>
        <div style={styles.metric}><div style={styles.metricLabel}>Active reps</div><div style={styles.metricValue}>{reps.length}</div><div style={styles.metricSub}>{store_name}</div></div>
      </div>

      <div style={styles.tabs}>
        {mainTabs.map(t => (
          <button key={t.id} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }} onClick={() => {
            setActiveTab(t.id)
            if (t.id === 'reps' && Object.keys(preloadedReps).length === 0) {
              reps.forEach(async (rep) => {
                try {
                  const d = await getRepPayout(rep.rep_code)
                  setPreloadedReps(prev => ({ ...prev, [rep.rep_code]: d }))
                } catch {}
              })
            }
          }}>
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
                <tr><td style={styles.td}>Total target incentive (TTI)</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(tti)}</td></tr>
                <tr><td style={styles.td}>Store attainment</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{pct(store_attainment)}</td></tr>
                <tr><td style={styles.td}>Payout floor</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(payout_rules.floor)}</td></tr>
                <tr><td style={styles.td}>Payout cap</td><td style={{ ...styles.td, textAlign: 'right' }}>{pct(payout_rules.cap)}</td></tr>
                <tr><td style={{ ...styles.td, color: '#999', fontSize: 12 }} colSpan={2}>Base payout = TTI × Store Attainment</td></tr>
                <tr><td style={styles.td}>Base payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 500 }}>{fmt(base_payout)}</td></tr>
                <tr><td style={styles.td}>Credit Cards (SPIFF)</td><td style={{ ...styles.td, textAlign: 'right' }}>{fmt(cc_payout)}</td></tr>
                <tr><td style={{ ...styles.td, fontWeight: 600 }}>Total payout</td><td style={{ ...styles.td, textAlign: 'right', fontWeight: 600, color: '#185FA5' }}>{fmt(total_payout)}</td></tr>
              </tbody>
            </table>
            {isAtFloor && (
              <div style={{ marginTop: 12, background: '#FCEBEB', color: '#791F1F', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                Store attainment is below the {pct(payout_rules.floor)} payout floor — base payout is $0.
              </div>
            )}
            {isAtCap && (
              <div style={{ marginTop: 12, background: '#FAEEDA', color: '#633806', fontSize: 12, padding: '8px 12px', borderRadius: 8 }}>
                Payout is capped at {pct(payout_rules.cap)} attainment.
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>Payment date: {payment_date}</div>
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

      {activeTab === 'store' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Store performance vs target</div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Metric</th><th style={styles.th}>Target</th><th style={styles.th}>Actual</th><th style={styles.th}>Attainment</th></tr></thead>
            <tbody>
              <tr><td style={styles.td}>Rateplan net adds</td><td style={styles.td}>{store_stats.quotas.rp_volume}</td><td style={styles.td}>{store_stats.actuals.rp_net_adds}</td><td style={styles.td}><AttBadge att={store_stats.attainments.rp_volume} /></td></tr>
              <tr><td style={styles.td}>Rateplan revenue</td><td style={styles.td}>{fmt(store_stats.quotas.rp_revenue)}</td><td style={styles.td}>{fmt(store_stats.actuals.rp_revenue)}</td><td style={styles.td}><AttBadge att={store_stats.attainments.rp_revenue} /></td></tr>
              <tr><td style={styles.td}>Feature revenue</td><td style={styles.td}>{fmt(store_stats.quotas.feature_revenue)}</td><td style={styles.td}>{fmt(store_stats.actuals.feature_revenue)}</td><td style={styles.td}><AttBadge att={store_stats.attainments.feature_revenue} /></td></tr>
              <tr><td style={styles.td}>Accessory revenue</td><td style={styles.td}>{fmt(store_stats.quotas.accessory_revenue)}</td><td style={styles.td}>{fmt(store_stats.actuals.accessory_revenue)}</td><td style={styles.td}><AttBadge att={store_stats.attainments.accessory_revenue} /></td></tr>
              <tr><td style={styles.td}>Device revenue</td><td style={styles.td}>{fmt(store_stats.quotas.device_revenue)}</td><td style={styles.td}>{fmt(store_stats.actuals.device_revenue)}</td><td style={styles.td}><AttBadge att={store_stats.attainments.device_revenue} /></td></tr>
              <tr><td style={{ ...styles.td, fontWeight: 600 }}>Overall</td><td style={styles.td}>—</td><td style={styles.td}>—</td><td style={styles.td}><AttBadge att={store_attainment} /></td></tr>
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'reps' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Rep leaderboard — click a rep name to view details</div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>#</th><th style={styles.th}>Rep</th><th style={styles.th}>Rateplans</th><th style={styles.th}>Devices</th><th style={styles.th}>Features</th><th style={styles.th}>Credit Cards</th><th style={styles.th}>Total payout</th></tr></thead>
            <tbody>
              {reps.map((r, i) => (
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

      {activeTab === 'txn_rp' && (
        <StoreTransactionTab
          title="Rateplan transactions — all reps"
          note="Store-level rateplan activations and deactivations for Jan 2025"
          storeCode={data.store_code}
          txnKey="rateplan"
          columns={['Date', 'Plan', 'Subscriber ID', 'Phone number', 'Rep name', 'Rep code', 'Type', 'Cust paid']}
          renderRow={(t) => [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.rep_code, <Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} />, fmt(t.customer_paid || 0)]}
        />
      )}

      {activeTab === 'txn_ft' && (
        <StoreTransactionTab
          title="Feature transactions — all reps"
          note="Store-level feature activations for Jan 2025"
          storeCode={data.store_code}
          txnKey="feature"
          columns={['Date', 'Feature', 'Subscriber ID', 'Phone number', 'Rep name', 'Rep code', 'MRC']}
          renderRow={(t) => [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.rep_code, fmt(t.mrc || 0)]}
        />
      )}

      {activeTab === 'txn_ac' && (
        <StoreTransactionTab
          title="Accessory transactions — all reps"
          note="Store-level accessory sales for Jan 2025"
          storeCode={data.store_code}
          txnKey="accessory"
          columns={['Date', 'Item', 'Subscriber ID', 'Phone number', 'Rep name', 'Rep code', 'Cust paid']}
          renderRow={(t) => [t.date, t.description, t.subscriber_id || '—', t.phone_number || '—', t.rep_name, t.rep_code, fmt(t.customer_paid || 0)]}
        />
      )}

      {activeTab === 'txn_dv' && (
        <StoreTransactionTab
          title="Device transactions — all reps"
          note="Store-level device sales for Jan 2025"
          storeCode={data.store_code}
          txnKey="device"
          columns={['Date', 'Device', 'Subscriber ID', 'Phone number', 'Rep name', 'Rep code', 'Sale type', 'Cust paid']}
          renderRow={(t) => [t.date, t.description, t.subscriber_id, t.phone_number, t.rep_name, t.rep_code, <Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} />, fmt(t.customer_paid || 0)]}
        />
      )}

      {activeTab === 'txn_cc' && (
        <StoreTransactionTab
          title="Credit card SPIFF transactions — all reps"
          note="Store-level credit card sales for Jan 2025"
          storeCode={data.store_code}
          txnKey="credit_card"
          columns={['Date', 'Product', 'Rep name', 'Rep code', 'Type']}
          renderRow={(t) => [t.date, t.description, t.rep_name, t.rep_code, <Badge text="SPIFF" type="purple" />]}
        />
      )}
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
  badge: { background: '#E6F1FB', color: '#0C447C', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500 },
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