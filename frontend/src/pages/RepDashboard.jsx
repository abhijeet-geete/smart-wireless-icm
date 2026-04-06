import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getRepPayout } from '../services/api'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#185FA5', '#3B6D11', '#BA7517', '#854F0B', '#533AB7']

function fmt(n) { return '$' + Math.round(n).toLocaleString() }

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

function MetricCard({ label, value, sub }) {
  return (
    <div style={styles.metric}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      {sub && <div style={styles.metricSub}>{sub}</div>}
    </div>
  )
}

export default function RepDashboard({ overrideRepCode } = {}) {
    const { user, logout } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('summary')
    const repCode = overrideRepCode || user?.linkedCode

  useEffect(() => {
    if (repCode) {
      getRepPayout(repCode).then(setData).finally(() => setLoading(false))
    }
  }, [repCode])

  if (loading) return <div style={styles.loading}>Loading your payout data...</div>
  if (!data) return <div style={styles.loading}>No data found</div>

  const { summary, transactions, store_multiplier, store_name, rep_name, payment_date } = data

  const pieData = [
    { name: 'Rateplans', value: summary.rateplan },
    { name: 'Features', value: summary.feature },
    { name: 'Accessories', value: summary.accessory },
    { name: 'Devices', value: summary.device },
    { name: 'Credit Cards', value: summary.credit_card },
  ].filter(d => d.value > 0)

  const tabs = [
    { id: 'summary', label: 'Summary' },
    { id: 'rp', label: `Rateplans (${transactions.rateplan.length})` },
    { id: 'ft', label: `Features (${transactions.feature.length})` },
    { id: 'ac', label: `Accessories (${transactions.accessory.length})` },
    { id: 'dv', label: `Devices (${transactions.device.length})` },
    { id: 'cc', label: `Credit Cards (${transactions.credit_card.length})` },
  ]

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <div style={styles.topLeft}>
          <span style={styles.brand}><span style={{ color: '#185FA5' }}>Smart</span> Wireless</span>
          <span style={styles.badge}>Store Rep</span>
          <span style={styles.userName}>{rep_name}</span>
        </div>
        <div style={styles.topRight}>
          <span style={styles.period}>Jan 2025</span>
          <span style={styles.storeName}>{store_name}</span>
          <button style={{...styles.logoutBtn, marginRight: 8}} onClick={() => window.location.href = '/about'}>About</button>
            <button style={styles.logoutBtn} onClick={logout}>Sign out</button>
        </div>
      </div>

      <div style={styles.metrics}>
        <MetricCard label="Total incentive" value={fmt(summary.total)} sub={`Payment: ${payment_date}`} />
        <MetricCard label="Rateplans sold" value={transactions.rateplan.length} sub={fmt(summary.rateplan) + ' earned'} />
        <MetricCard label="Devices sold" value={transactions.device.length} sub={fmt(summary.device) + ' earned'} />
        <MetricCard label="Store multiplier" value={store_multiplier + 'x'} sub={store_name} />
      </div>

      <div style={styles.tabs}>
        {tabs.map(t => (
          <button key={t.id} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Payout breakdown</div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Net units</th>
                  <th style={styles.th}>Incentive</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={styles.td}>Rateplans</td><td style={styles.td}>{transactions.rateplan.length}</td><td style={styles.td}>{fmt(summary.rateplan)}</td></tr>
                <tr><td style={styles.td}>Features</td><td style={styles.td}>{transactions.feature.length}</td><td style={styles.td}>{fmt(summary.feature)}</td></tr>
                <tr><td style={styles.td}>Accessories</td><td style={styles.td}>{transactions.accessory.length}</td><td style={styles.td}>{fmt(summary.accessory)}</td></tr>
                <tr><td style={styles.td}>Devices</td><td style={styles.td}>{transactions.device.length}</td><td style={styles.td}>{fmt(summary.device)}</td></tr>
                <tr><td style={styles.td}>Credit Cards (SPIFF)</td><td style={styles.td}>{transactions.credit_card.length}</td><td style={styles.td}>{fmt(summary.credit_card)}</td></tr>
                <tr>
                  <td style={{ ...styles.td, fontWeight: 600 }}>Total</td>
                  <td style={styles.td}></td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(summary.total)}</td>
                </tr>
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

      {activeTab === 'rp' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Rateplan transactions</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Plan</th>
                  <th style={styles.th}>Subscriber ID</th>
                  <th style={styles.th}>Phone number</th>
                  <th style={styles.th}>Rep code</th>
                  <th style={styles.th}>Store code</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Cust paid</th>
                  <th style={styles.th}>Base rate</th>
                  <th style={styles.th}>Mult</th>
                  <th style={styles.th}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {transactions.rateplan.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{repCode}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{data.store_code}</td>
                    <td style={styles.td}><Badge text={t.type} type={t.type === 'Activation' ? 'green' : 'amber'} /></td>
                    <td style={styles.td}>{fmt(t.customer_paid)}</td>
                    <td style={styles.td}>{fmt(t.base_rate)}</td>
                    <td style={styles.td}>{t.multiplier}x</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: t.earned < 0 ? '#c0392b' : '#185FA5' }}>{fmt(t.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ft' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Feature transactions</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Feature</th>
                  <th style={styles.th}>Subscriber ID</th>
                  <th style={styles.th}>Phone number</th>
                  <th style={styles.th}>Rep code</th>
                  <th style={styles.th}>Store code</th>
                  <th style={styles.th}>MRC</th>
                  <th style={styles.th}>Base rate</th>
                  <th style={styles.th}>Mult</th>
                  <th style={styles.th}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {transactions.feature.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{repCode}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{data.store_code}</td>
                    <td style={styles.td}>{fmt(t.mrc)}</td>
                    <td style={styles.td}>{fmt(t.base_rate)}</td>
                    <td style={styles.td}>{t.multiplier}x</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(t.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ac' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Accessory transactions</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Subscriber ID</th>
                  <th style={styles.th}>Phone number</th>
                  <th style={styles.th}>Rep code</th>
                  <th style={styles.th}>Store code</th>
                  <th style={styles.th}>Cust paid</th>
                  <th style={styles.th}>Base rate</th>
                  <th style={styles.th}>Mult</th>
                  <th style={styles.th}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {transactions.accessory.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id || '—'}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number || '—'}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{repCode}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{data.store_code}</td>
                    <td style={styles.td}>{fmt(t.customer_paid)}</td>
                    <td style={styles.td}>{fmt(t.base_rate)}</td>
                    <td style={styles.td}>{t.multiplier}x</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(t.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'dv' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Device transactions</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Device</th>
                  <th style={styles.th}>Subscriber ID</th>
                  <th style={styles.th}>Phone number</th>
                  <th style={styles.th}>Rep code</th>
                  <th style={styles.th}>Store code</th>
                  <th style={styles.th}>Sale type</th>
                  <th style={styles.th}>Cust paid</th>
                  <th style={styles.th}>Base rate</th>
                  <th style={styles.th}>Mult</th>
                  <th style={styles.th}>Earned</th>
                </tr>
              </thead>
              <tbody>
                {transactions.device.map((t, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>{t.description}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.subscriber_id}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{t.phone_number}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{repCode}</td>
                    <td style={{ ...styles.td, fontSize: 11, color: '#999' }}>{data.store_code}</td>
                    <td style={styles.td}><Badge text={t.sale_type} type={t.sale_type === 'New' ? 'blue' : 'purple'} /></td>
                    <td style={styles.td}>{fmt(t.customer_paid)}</td>
                    <td style={styles.td}>{fmt(t.base_rate)}</td>
                    <td style={styles.td}>{t.multiplier}x</td>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#185FA5' }}>{fmt(t.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'cc' && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Credit card SPIFF transactions</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Earned</th>
              </tr>
            </thead>
            <tbody>
              {transactions.credit_card.map((t, i) => (
                <tr key={i}>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>{t.description}</td>
                  <td style={styles.td}><Badge text="SPIFF" type="purple" /></td>
                  <td style={{ ...styles.td, fontWeight: 600, color: '#533AB7' }}>{fmt(t.earned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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