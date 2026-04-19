import axios from 'axios'

export const http = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE && String((import.meta as any).env?.VITE_API_BASE).trim() !== '' ? (import.meta as any).env?.VITE_API_BASE : '/',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (r) => r,
  (err) => {
    return Promise.reject(err)
  },
)

