import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const login = async (username, password) => {
  const res = await api.post('/api/auth/login', { username, password })
  return res.data
}

export const getRepPayout = async (repCode, period = '2025-01') => {
  const res = await api.get(`/api/payout/rep/${repCode}`, { params: { period } })
  return res.data
}

export const getStoreReps = async (storeCode, period = '2025-01') => {
  const res = await api.get(`/api/payout/store/${storeCode}/reps`, { params: { period } })
  return res.data
}

export const getManagerPayout = async (managerCode, period = '2025-01') => {
  const res = await api.get(`/api/payout/manager/${managerCode}`, { params: { period } })
  return res.data
}

export const getDistrictSummary = async (dmCode, period = '2025-01') => {
  const res = await api.get(`/api/payout/district/${dmCode}`, { params: { period } })
  return res.data
}

export const getAdminSummary = async (period = '2025-01') => {
  const res = await api.get('/api/payout/admin/summary', { params: { period } })
  return res.data
}

export const runCalculations = async (period = '2025-01') => {
    const res = await api.post(`/api/payout/admin/run-calculations`, null, { params: { period } })
    return res.data
  }

export const getStoreTransactions = async (storeCode, period = '2025-01') => {
    const res = await api.get(`/api/payout/store/${storeCode}/transactions`, { params: { period } })
    return res.data
  }
  
export const getRegionTransactions = async (rmCode, period = '2025-01') => {
    const res = await api.get(`/api/payout/region/${rmCode}/transactions`, { params: { period } })
    return res.data
  }

export default api