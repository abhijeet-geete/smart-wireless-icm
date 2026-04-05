import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      if (user.role === 'rep') navigate('/rep')
      else if (user.role === 'manager') navigate('/manager')
      else if (user.role === 'dm') navigate('/dm')
      else if (user.role === 'admin') navigate('/admin')
    } catch (err) {
      setError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (u, p) => {
    setUsername(u)
    setPassword(p)
    setLoading(true)
    try {
      const user = await login(u, p)
      if (user.role === 'rep') navigate('/rep')
      else if (user.role === 'manager') navigate('/manager')
      else if (user.role === 'dm') navigate('/dm')
      else if (user.role === 'admin') navigate('/admin')
    } catch {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandBlue}>Smart</span> Wireless
        </div>
        <div style={styles.subtitle}>Incentive Compensation Portal</div>
        <div style={styles.period}>January 2025</div>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={styles.divider}>Quick access for demo</div>
        <div style={styles.quickBtns}>
          <button style={styles.qBtn} onClick={() => quickLogin('mjohnson', 'rep2025pw')}>Rep</button>
          <button style={styles.qBtn} onClick={() => quickLogin('dreyes', 'mgr2025pw')}>Manager</button>
          <button style={styles.qBtn} onClick={() => quickLogin('kpark', 'dm2025pw')}>RM</button>
          <button style={styles.qBtn} onClick={() => quickLogin('admin', 'admin123')}>Admin</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
  card: { background: '#fff', borderRadius: 12, padding: '2.5rem', width: 380, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' },
  brand: { fontSize: 26, fontWeight: 600, marginBottom: 4, textAlign: 'center' },
  brandBlue: { color: '#185FA5' },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 4 },
  period: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 28 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: '#333' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, outline: 'none' },
  error: { background: '#fff0f0', color: '#c0392b', padding: '8px 12px', borderRadius: 8, fontSize: 13 },
  btn: { padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' },
  divider: { textAlign: 'center', fontSize: 12, color: '#999', margin: '20px 0 12px' },
  quickBtns: { display: 'flex', gap: 8 },
  qBtn: { flex: 1, padding: '8px', background: '#f0f4f8', border: '1px solid #ddd', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: '#333' },
}