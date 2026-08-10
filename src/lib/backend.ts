export const API_BASE = import.meta.env.VITE_API_URL ?? ''
export const isApiConfigured = API_BASE.length > 0
