import axios from 'axios'

const envBaseUrl = import.meta.env.VITE_API_BASE_URL
const baseURL = import.meta.env.DEV ? '' : (envBaseUrl || '')

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export function postForm(url, data) {
  const body = new URLSearchParams()
  Object.entries(data).forEach(([k, v]) => body.append(k, v))
  return apiClient.post(url, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })
}
